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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[BACKFILL] Starting price backfill...");

    const { data: shops } = await supabaseAdmin
      .from("shops")
      .select("id, name, shopify_shop_domain");

    if (!shops) {
      return res.status(500).json({ error: "No shops found" });
    }

    let totalUpdated = 0;
    const shopResults = [];

    for (const shop of shops) {
      if (!shop.shopify_shop_domain) {
        console.log(`[BACKFILL] Skipping ${shop.name} - no domain`);
        shopResults.push({ shop: shop.name, status: "skipped", reason: "no_domain" });
        continue;
      }

      const secretKey = `SHOPIFY_SECRET_${shop.name.toUpperCase()}`;
      const secret = process.env[secretKey];

      if (!secret) {
        console.log(`[BACKFILL] Skipping ${shop.name} - no secret`);
        shopResults.push({ shop: shop.name, status: "skipped", reason: "no_secret" });
        continue;
      }

      // Get orders without prices
      const { data: ordersWithoutPrices } = await supabaseAdmin
        .from("queue_entries")
        .select("id, shopify_order_id")
        .eq("shop_id", shop.id)
        .is("total_price", null)
        .limit(50); // Limit to avoid timeout

      if (!ordersWithoutPrices || ordersWithoutPrices.length === 0) {
        console.log(`[BACKFILL] ${shop.name}: no orders to update`);
        shopResults.push({ shop: shop.name, status: "no_orders", count: 0 });
        continue;
      }

      console.log(`[BACKFILL] ${shop.name}: processing ${ordersWithoutPrices.length} orders`);
      let shopUpdated = 0;

      // Process each order one by one
      for (const order of ordersWithoutPrices) {
        if (!order.shopify_order_id) continue;

        try {
          const shopifyUrl = `https://${shop.shopify_shop_domain}/admin/api/2024-01/orders/${order.shopify_order_id}.json`;

          console.log(`[BACKFILL] Fetching order ${order.shopify_order_id}...`);

          const shopifyRes = await fetch(shopifyUrl, {
            headers: {
              "X-Shopify-Access-Token": secret,
            },
          });

          if (!shopifyRes.ok) {
            const errorText = await shopifyRes.text();
            console.log(
              `[BACKFILL] Failed to fetch order ${order.shopify_order_id}: ${shopifyRes.status} - ${errorText}`
            );
            continue;
          }

          const data = (await shopifyRes.json()) as ShopifyOrderResponse;
          const shopifyOrder = data.order;
          
          console.log(
            `[BACKFILL] Got response for order ${order.shopify_order_id}:`,
            JSON.stringify(shopifyOrder)
          );

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
            shopUpdated++;
            totalUpdated++;
          }

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[BACKFILL] Error processing order ${order.shopify_order_id}:`, error);
        }
      }

      shopResults.push({
        shop: shop.name,
        status: "success",
        updated: shopUpdated,
        total: ordersWithoutPrices.length,
      });
    }

    console.log(`[BACKFILL] ✅ Complete! Total orders updated: ${totalUpdated}`);

    return res.status(200).json({
      ok: true,
      message: `Backfill complete! ${totalUpdated} orders updated.`,
      details: shopResults,
    });
  } catch (error) {
    console.error("[BACKFILL] Critical error:", error);
    return res.status(500).json({
      error: "Backfill failed",
      details: String(error),
    });
  }
}
