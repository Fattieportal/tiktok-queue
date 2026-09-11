import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

interface ShopifyOrder {
  id: number;
  total_price: string;
  currency: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch all shops with their Shopify credentials
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from("shops")
      .select("id, name, shopify_shop_domain");

    if (shopsError || !shops) {
      return res.status(500).json({ error: "Failed to fetch shops" });
    }

    let totalUpdated = 0;
    const results = [];

    // For each shop, fetch orders missing prices
    for (const shop of shops) {
      if (!shop.shopify_shop_domain) {
        results.push({ shop: shop.name, status: "skipped", reason: "no_domain" });
        continue;
      }

      // Get all orders in this shop without prices
      const { data: ordersWithoutPrices, error: ordersError } = await supabaseAdmin
        .from("queue_entries")
        .select("id, shopify_order_id, order_number")
        .eq("shop_id", shop.id)
        .is("total_price", null);

      if (ordersError) {
        results.push({ shop: shop.name, status: "error", error: ordersError });
        continue;
      }

      if (!ordersWithoutPrices || ordersWithoutPrices.length === 0) {
        results.push({ shop: shop.name, status: "no_orders_to_update", count: 0 });
        continue;
      }

      let shopUpdated = 0;

      // For each order, fetch from Shopify and update
      for (const order of ordersWithoutPrices) {
        if (!order.shopify_order_id) continue;

        try {
          // Fetch order from Shopify
          const shopifyUrl = `https://${shop.shopify_shop_domain}/admin/api/2024-01/orders/${order.shopify_order_id}.json`;
          const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
          const secret = process.env[secretKey];

          if (!secret) {
            console.log(`[BACKFILL] No secret for shop ${shop.name}`);
            continue;
          }

          const shopifyRes = await fetch(shopifyUrl, {
            headers: {
              "X-Shopify-Access-Token": secret,
            },
          });

          if (!shopifyRes.ok) {
            console.log(`[BACKFILL] Failed to fetch order ${order.shopify_order_id} from Shopify`);
            continue;
          }

          const shopifyData = (await shopifyRes.json()) as { order: ShopifyOrder };
          const shopifyOrder = shopifyData.order;

          if (!shopifyOrder || !shopifyOrder.total_price) {
            continue;
          }

          const totalPrice = parseFloat(shopifyOrder.total_price);
          const currency = (shopifyOrder.currency || "EUR").toUpperCase();

          // Update the order in our database
          const { error: updateError } = await supabaseAdmin
            .from("queue_entries")
            .update({
              total_price: totalPrice,
              currency: currency,
            })
            .eq("id", order.id);

          if (updateError) {
            console.error(`[BACKFILL] Error updating order ${order.id}:`, updateError);
            continue;
          }

          shopUpdated++;
          totalUpdated++;

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[BACKFILL] Error processing order ${order.id}:`, error);
          continue;
        }
      }

      results.push({ shop: shop.name, status: "success", updated: shopUpdated });
    }

    return res.status(200).json({
      ok: true,
      message: `Backfill complete. Total orders updated: ${totalUpdated}`,
      results,
    });
  } catch (error) {
    console.error("[BACKFILL] Error:", error);
    return res.status(500).json({ error: "Backfill failed", details: error });
  }
}
