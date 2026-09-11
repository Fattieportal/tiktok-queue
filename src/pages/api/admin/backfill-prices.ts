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

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

export const config = {
  maxDuration: 300, // 5 minute timeout for backfill
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Start backfill in background - don't wait for completion
  setImmediate(async () => {
    try {
      // Fetch all shops with their Shopify credentials
      const { data: shops, error: shopsError } = await supabaseAdmin
        .from("shops")
        .select("id, name, shopify_shop_domain");

      if (shopsError || !shops) {
        console.error("[BACKFILL] Failed to fetch shops:", shopsError);
        return;
      }

      let totalUpdated = 0;

      // For each shop, fetch orders missing prices
      for (const shop of shops) {
        if (!shop.shopify_shop_domain) {
          console.log(`[BACKFILL] Shop ${shop.name} has no domain, skipping`);
          continue;
        }

        const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
        const secret = process.env[secretKey];

        if (!secret) {
          console.log(`[BACKFILL] No secret for shop ${shop.name}`);
          continue;
        }

        // Get all orders in this shop without prices
        const { data: ordersWithoutPrices, error: ordersError } = await supabaseAdmin
          .from("queue_entries")
          .select("id, shopify_order_id, order_number")
          .eq("shop_id", shop.id)
          .is("total_price", null)
          .limit(250);

        if (ordersError) {
          console.error(`[BACKFILL] Error fetching orders for shop ${shop.name}:`, ordersError);
          continue;
        }

        if (!ordersWithoutPrices || ordersWithoutPrices.length === 0) {
          console.log(`[BACKFILL] Shop ${shop.name}: no orders to update`);
          continue;
        }

        console.log(`[BACKFILL] Shop ${shop.name}: processing ${ordersWithoutPrices.length} orders`);

        // Build list of shopify order IDs
        const shopifyIds = ordersWithoutPrices
          .map((o) => o.shopify_order_id)
          .filter(Boolean);

        if (shopifyIds.length === 0) continue;

        try {
          // Fetch all orders from Shopify in one call (more efficient)
          const ids = shopifyIds.join(" OR ");
          const shopifyUrl = `https://${shop.shopify_shop_domain}/admin/api/2024-01/orders.json?status=any&fields=id,total_price,currency&query=${encodeURIComponent(ids)}`;

          const shopifyRes = await fetch(shopifyUrl, {
            headers: {
              "X-Shopify-Access-Token": secret,
            },
          });

          if (!shopifyRes.ok) {
            console.log(`[BACKFILL] Failed to fetch orders from Shopify for shop ${shop.name}`);
            continue;
          }

          const shopifyData = (await shopifyRes.json()) as ShopifyOrdersResponse;
          const shopifyOrders = shopifyData.orders || [];

          // Create a map of shopify_order_id -> order data
          const priceMap = new Map(
            shopifyOrders.map((o) => [
              String(o.id),
              {
                price: parseFloat(o.total_price),
                currency: (o.currency || "EUR").toUpperCase(),
              },
            ])
          );

          console.log(`[BACKFILL] Got ${shopifyOrders.length} orders from Shopify`);

          // Update all orders with their prices
          for (const order of ordersWithoutPrices) {
            if (!order.shopify_order_id) continue;

            const priceData = priceMap.get(String(order.shopify_order_id));
            if (!priceData) {
              console.log(`[BACKFILL] No price data for order ${order.shopify_order_id}`);
              continue;
            }

            const { error: updateError } = await supabaseAdmin
              .from("queue_entries")
              .update({
                total_price: priceData.price,
                currency: priceData.currency,
              })
              .eq("id", order.id);

            if (updateError) {
              console.error(`[BACKFILL] Error updating order ${order.id}:`, updateError);
            } else {
              totalUpdated++;
            }
          }

          console.log(`[BACKFILL] Shop ${shop.name}: updated ${totalUpdated} orders so far`);
        } catch (error) {
          console.error(`[BACKFILL] Error fetching orders from Shopify for shop ${shop.name}:`, error);
          continue;
        }
      }

      console.log(`[BACKFILL] Complete! Total orders updated: ${totalUpdated}`);
    } catch (error) {
      console.error("[BACKFILL] Critical error:", error);
    }
  });

  // Return immediately
  return res.status(202).json({
    ok: true,
    message: "Backfill started in background. Check console logs for progress.",
    note: "This will process all shops and their orders with Shopify API queries.",
  });
}
