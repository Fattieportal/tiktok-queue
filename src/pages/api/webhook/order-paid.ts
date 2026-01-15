import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabase } from "@/lib/db";

export const config = {
  api: { bodyParser: false }, // IMPORTANT for Shopify HMAC verification
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send("SHOPIFY_WEBHOOK_SECRET missing");

  const rawBody = await readRawBody(req);
  const hmacHeader = (req.headers["x-shopify-hmac-sha256"] as string | undefined) ?? null;

  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  let order: ShopifyOrderPaidWebhook;
  try {
    order = JSON.parse(rawBody.toString("utf8")) as ShopifyOrderPaidWebhook;
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  const shippingTitles: string[] = (order.shipping_lines ?? [])
    .map((x) => (x?.title ?? "").trim())
    .filter(Boolean);

  const isTikTokUnboxing = shippingTitles.some((t) => t.toLowerCase().includes("tiktok live unboxing"));
  const isMysteryExcluded = shippingTitles.some((t) => t.toLowerCase().includes("ongeopende mysterybox"));

  if (!isTikTokUnboxing || isMysteryExcluded) {
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

  const { error: insertErr } = await supabase.from("queue_entries").insert({
    shopify_order_id: shopifyOrderId,
    order_number: orderNumber,
    first_name: firstName,
    status: "waiting",
  });

  // Treat unique/duplicate as ok (Shopify can retry)
  if (insertErr) {
    const msg = String((insertErr as { message?: unknown }).message ?? "").toLowerCase();
    const isDuplicate = msg.includes("duplicate") || msg.includes("unique");
    if (!isDuplicate) return res.status(500).json({ ok: false, error: insertErr });
  }

  return res.status(200).json({
    ok: true,
    status: "eligible",
    firstName,
    orderNumber,
    shippingTitles,
  });
}
