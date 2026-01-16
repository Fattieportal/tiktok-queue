import crypto from "crypto";
import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type ShopifyShippingLine = {
  title?: string | null;
};

type ShopifyAddress = {
  first_name?: string | null;
  name?: string | null;
};

type ShopifyCustomer = {
  first_name?: string | null;
};

type ShopifyOrderPaidWebhook = {
  id?: number | string | null;
  order_number?: number | string | null;
  name?: string | null;
  shipping_lines?: ShopifyShippingLine[] | null;
  customer?: ShopifyCustomer | null;
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
};

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function safeToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

export async function POST(req: NextRequest) {
  console.log("🔵 Webhook POST received");
  
  // Get shop domain from Shopify header
  const shopDomain = req.headers.get("x-shopify-shop-domain") ?? null;
  console.log("🔵 Shop domain:", shopDomain);
  
  if (!shopDomain) {
    console.log("❌ No shop domain header");
    return NextResponse.json({ ok: false, error: "Missing x-shopify-shop-domain header" }, { status: 400 });
  }

  // Find shop in database
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, name")
    .eq("shopify_shop_domain", shopDomain)
    .eq("is_active", true)
    .single<{ id: string; name: string }>();

  if (shopError || !shop) {
    return NextResponse.json({ ok: false, error: "Shop not found or inactive" }, { status: 404 });
  }

  // Get the secret for this specific shop from env variables
  // Format: SHOPIFY_SECRET_<SHOP_NAME_UPPERCASE>
  const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
  const secret = process.env[secretKey];
  
  if (!secret) {
    console.error(`Missing env variable: ${secretKey}`);
    return new NextResponse(`${secretKey} missing in environment variables`, { status: 500 });
  }

  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? null;

  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let order: ShopifyOrderPaidWebhook;
  try {
    order = JSON.parse(rawBody) as ShopifyOrderPaidWebhook;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const shippingTitles: string[] = (order.shipping_lines ?? [])
    .map((x) => (x?.title ?? "").trim())
    .filter(Boolean);

  const isTikTokUnboxing = shippingTitles.some((t) => t.toLowerCase().includes("tiktok live unboxing"));
  const isMysteryExcluded = shippingTitles.some((t) => t.toLowerCase().includes("ongeopende mysterybox"));

  if (!isTikTokUnboxing || isMysteryExcluded) {
    return NextResponse.json({ ok: true, status: "ignored", shippingTitles }, { status: 200 });
  }

  const shopifyOrderId = order.id;
  if (!shopifyOrderId) {
    return NextResponse.json({ ok: true, status: "ignored", reason: "missing_order_id" }, { status: 200 });
  }

  const orderNumber = safeToString(order.order_number) ?? safeToString(order.name);

  const firstName =
    (order.customer?.first_name ?? "").trim() ||
    (order.shipping_address?.first_name ?? "").trim() ||
    (order.billing_address?.first_name ?? "").trim() ||
    ((order.shipping_address?.name ?? "").trim().split(" ")[0] || "").trim() ||
    `Order #${orderNumber ?? "?"}`;

  // @ts-expect-error - Supabase typing issue with Proxy client
  const { error: insertErr } = await supabase.from("queue_entries").insert({
    shopify_order_id: shopifyOrderId,
    order_number: orderNumber,
    first_name: firstName,
    status: "waiting",
    shop_id: shop.id,
  });

  // Treat unique/duplicate as ok (Shopify can retry)
  if (insertErr) {
    const msg = String((insertErr as { message?: unknown }).message ?? "").toLowerCase();
    const isDuplicate = msg.includes("duplicate") || msg.includes("unique");
    if (!isDuplicate) return NextResponse.json({ ok: false, error: insertErr }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "eligible",
    firstName,
    orderNumber,
    shippingTitles,
    shopName: shop.name,
  }, { status: 200 });
}
