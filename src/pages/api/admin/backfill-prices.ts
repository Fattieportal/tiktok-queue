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

interface ShopifyOrderResponse {
  order: ShopifyOrder;
}

export const config = {
  maxDuration: 300,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Start backfill in background
  setImmediate(async () => {
    try {
      console.log("[BACKFILL] Starting price backfill...");

      const { data: shops } = await supabaseAdmin
        .from("shops")
        .select("id, name, shopify_shop_domain");

      if (!shops) {
        console.error("[BACKFILL] No shops found");
        return;
      }

      let totalUpdated = 0;

      for (const shop of shops) {
        if (!shop.shopify_shop_domain) {
          console.log(`[BACKFILL] Skipping ${shop.name} - no domain`);
          continue;
        }

        const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
        const secret = process.env[secretKey];

        if (!secret) {
          console.log(`[BACKFILL] Skipping ${shop.name} - no secret`);
          continue;
        }

        // Get orders without prices
        const { data: ordersWithoutPrices } = await supabaseAdmin
          .from("queue_entries")
          .select("id, shopify_order_id")
          .eq("shop_id", shop.id)
          .is("total_price", null)
          .limit(500);

        if (!ordersWithoutPrices || ordersWithoutPrices.length === 0) {
          console.log(`[BACKFILL] ${shop.name}: no orders to update`);
          continue;
        }

        console.log(`[BACKFILL] ${shop.name}: updating ${ordersWithoutPrices.length} orders`);

        // Process each order one by one
        for (const order of ordersWithoutPrices) {
          if (!order.shopify_order_id) continue;

          try {
            const shopifyUrl = `https://${shop.shopify_shop_domain}/admin/api/2024-01/orders/${order.shopify_order_id}.json`;

            console.log(`[BACKFILL] Fetching order ${order.shopify_order_id} from Shopify...`);

            const shopifyRes = await fetch(shopifyUrl, {
              headers: {
                "X-Shopify-Access-Token": secret,
              },
            });

            if (!shopifyRes.ok) {
              console.log(
                `[BACKFILL] Failed to fetch order ${order.shopify_order_id}: ${shopifyRes.status}`
              );
              continue;
            }

            const data = (await shopifyRes.json()) as ShopifyOrderResponse;
            const shopifyOrder = data.order;

            if (!shopifyOrder || shopifyOrder.total_price === undefined) {
              console.log(`[BACKFILL] Order ${order.shopify_order_id} has no total_price`);
              continue;
            }

            const totalPrice = parseFloat(shopifyOrder.total_price);
            const currency = (shopifyOrder.currency || "EUR").toUpperCase();

            console.log(
              `[BACKFILL] Order ${order.shopify_order_id}: €${totalPrice} ${currency}`
            );

            const { error: updateError } = await supabaseAdmin
              .from("queue_entries")
              .update({
                total_price: totalPrice,
                currency: currency,
              })
              .eq("id", order.id);

            if (updateError) {
              console.error(`[BACKFILL] Error updating order ${order.id}:`, updateError);
            } else {
              totalUpdated++;
              console.log(`[BACKFILL] Updated order ${order.id} - total so far: ${totalUpdated}`);
            }

            // Small delay between requests
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`[BACKFILL] Error processing order ${order.shopify_order_id}:`, error);
          }
        }
      }

      console.log(`[BACKFILL] ✅ Complete! Total orders updated: ${totalUpdated}`);
    } catch (error) {
      console.error("[BACKFILL] Critical error:", error);
    }
  });

  return res.status(202).json({
    ok: true,
    message: "Backfill started in background",
  });
}
