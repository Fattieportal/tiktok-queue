import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ShopifyShippingLine = {
  title?: string | null;
};

type ShopifyLineItem = {
  title?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  name?: string | null;
};

type ShopifyAddress = {
  first_name?: string | null;
  name?: string | null;
};

type ShopifyCustomer = {
  first_name?: string | null;
};

type ShopifyOrderCreatedWebhook = {
  id?: number | string | null;
  order_number?: number | string | null;
  name?: string | null;
  financial_status?: string | null;
  shipping_lines?: ShopifyShippingLine[] | null;
  line_items?: ShopifyLineItem[] | null;
  customer?: ShopifyCustomer | null;
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
  source_identifier?: string | null;
  source_name?: string | null;
  tags?: string | null;
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function verifyShopifyHmac(rawBody: Buffer, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
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

function formatProductInfo(lineItems: ShopifyLineItem[] | null | undefined): string {
  if (!lineItems || lineItems.length === 0) return "Product info niet beschikbaar";
  const formatted = lineItems
    .map((item) => {
      const quantity = item.quantity ?? 1;
      const title = item.title?.trim() || item.name?.trim() || "Onbekend product";
      const variant = item.variant_title?.trim();
      if (variant && variant.toLowerCase() !== "default title") {
        return `${quantity}x ${title} (${variant})`;
      }
      return `${quantity}x ${title}`;
    })
    .filter(Boolean)
    .join(" + ");
  return formatted || "Product info niet beschikbaar";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const shopDomain = (req.headers["x-shopify-shop-domain"] as string | undefined) ?? null;
  console.log("[WEBHOOK orders/create] Received from domain:", shopDomain);

  if (!shopDomain) {
    return res.status(400).json({ ok: false, error: "Missing x-shopify-shop-domain header" });
  }

  // Zoek shop op domain
  let { data: shop, error: shopError } = await supabaseAdmin
    .from("shops")
    .select("id, name, shopify_shop_domain")
    .eq("shopify_shop_domain", shopDomain)
    .eq("is_active", true)
    .single();

  // Fallback: shops zonder domain, match via env variable
  if (shopError || !shop) {
    console.log("[WEBHOOK orders/create] No shop found with domain:", shopDomain, "— trying fallback");
    const { data: allShops } = await supabaseAdmin
      .from("shops")
      .select("id, name, shopify_shop_domain")
      .is("shopify_shop_domain", null)
      .eq("is_active", true);

    if (allShops && allShops.length > 0) {
      for (const potentialShop of allShops) {
        const secretKey = `SHOPIFY_SECRET_${potentialShop.name.toUpperCase()}`;
        if (process.env[secretKey]) {
          console.log(`[WEBHOOK orders/create] Auto-filling domain for shop ${potentialShop.name}: ${shopDomain}`);
          const { data: updatedShop } = await supabaseAdmin
            .from("shops")
            .update({ shopify_shop_domain: shopDomain })
            .eq("id", potentialShop.id)
            .select("id, name, shopify_shop_domain")
            .single();
          if (updatedShop) {
            shop = updatedShop;
            shopError = null;
            break;
          }
        }
      }
    }
  }

  if (shopError || !shop) {
    console.log("[WEBHOOK orders/create] Shop not found for domain:", shopDomain);
    return res.status(404).json({ ok: false, error: "Shop not found", searchedDomain: shopDomain });
  }

  const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
  const secret = process.env[secretKey];

  if (!secret) {
    console.error(`[WEBHOOK orders/create] Missing env variable: ${secretKey}`);
    return res.status(500).send(`${secretKey} missing in environment variables`);
  }

  const rawBody = await readRawBody(req);
  const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string | undefined) ?? null;

  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  let order: ShopifyOrderCreatedWebhook;
  try {
    order = JSON.parse(rawBody.toString("utf8")) as ShopifyOrderCreatedWebhook;
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  // Alleen verwerken als de order al betaald is bij aanmaken
  // TikTok Shop orders komen direct binnen met financial_status: paid
  // Gewone Shopify orders worden later betaald via orders/paid webhook
  if (order.financial_status !== "paid") {
    console.log("[WEBHOOK orders/create] Genegeerd — financial_status is niet 'paid':", order.financial_status);
    return res.status(200).json({ ok: true, status: "ignored", reason: "not_paid_on_create", financial_status: order.financial_status });
  }

  console.log("[WEBHOOK orders/create] Order details:", {
    orderId: order.id,
    orderNumber: order.order_number,
    financialStatus: order.financial_status,
    sourceIdentifier: order.source_identifier,
    sourceName: order.source_name,
    tags: order.tags,
  });

  const shippingTitles: string[] = (order.shipping_lines ?? [])
    .map((x) => (x?.title ?? "").trim())
    .filter(Boolean);

  console.log("[WEBHOOK orders/create] Shipping titles:", shippingTitles);

  const isTikTokUnboxing = shippingTitles.some((t) => t.toLowerCase().includes("tiktok live unboxing"));
  const isShippedBySeller = shippingTitles.some((t) => t.toLowerCase().includes("shipped by seller"));
  const isMysteryExcluded = shippingTitles.some((t) => t.toLowerCase().includes("ongeopende mysterybox"));
  const hasNoShippingInfo = shippingTitles.length === 0;

  console.log("[WEBHOOK orders/create] Checks:", {
    isTikTokUnboxing,
    isShippedBySeller,
    isMysteryExcluded,
    hasNoShippingInfo,
  });

  if ((!isTikTokUnboxing && !isShippedBySeller && !hasNoShippingInfo) || isMysteryExcluded) {
    console.log("[WEBHOOK orders/create] Genegeerd — shipping check mislukt of mystery box exclusion");
    return res.status(200).json({ ok: true, status: "ignored", shippingTitles });
  }

  const shopifyOrderId = order.id;
  if (!shopifyOrderId) {
    return res.status(200).json({ ok: true, status: "ignored", reason: "missing_order_id" });
  }

  const orderNumber = safeToString(order.order_number) ?? safeToString(order.name);

  const firstName =
    (order.customer?.first_name ?? "").trim() ||
    (order.shipping_address?.first_name ?? "").trim() ||
    (order.billing_address?.first_name ?? "").trim() ||
    ((order.shipping_address?.name ?? "").trim().split(" ")[0] || "").trim() ||
    `Order #${orderNumber ?? "?"}`;

  const productInfo = formatProductInfo(order.line_items);

  const { error: insertErr } = await supabaseAdmin.from("queue_entries").insert({
    shopify_order_id: shopifyOrderId,
    order_number: orderNumber,
    first_name: firstName,
    product_info: productInfo,
    status: "waiting",
    shop_id: shop.id,
  });

  // Duplicate = ok (order al eerder toegevoegd)
  if (insertErr) {
    const msg = String((insertErr as { message?: unknown }).message ?? "").toLowerCase();
    const isDuplicate = msg.includes("duplicate") || msg.includes("unique");
    if (!isDuplicate) {
      console.error("[WEBHOOK orders/create] Insert error:", insertErr);
      return res.status(500).json({ ok: false, error: insertErr });
    }
    console.log("[WEBHOOK orders/create] Duplicate order genegeerd:", shopifyOrderId);
    return res.status(200).json({ ok: true, status: "duplicate_ignored" });
  }

  console.log("[WEBHOOK orders/create] Order toegevoegd aan wachtrij:", { firstName, orderNumber });

  return res.status(200).json({
    ok: true,
    status: "eligible",
    firstName,
    orderNumber,
    productInfo,
    shippingTitles,
    shopName: shop.name,
  });
}
