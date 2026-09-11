import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get sample orders to see what shopify_order_id looks like
    const { data: sampleOrders } = await supabaseAdmin
      .from("queue_entries")
      .select("id, shopify_order_id, order_number, total_price, shop_id")
      .is("total_price", null)
      .limit(10);

    if (!sampleOrders) {
      return res.status(200).json({ message: "No orders without price" });
    }

    console.log("[DEBUG] Sample orders:", sampleOrders);

    // Also check shops
    const { data: shops } = await supabaseAdmin
      .from("shops")
      .select("id, name, shopify_shop_domain");

    return res.status(200).json({
      sample_orders: sampleOrders,
      shops: shops,
      note: "Check if shopify_order_id format matches what Shopify expects",
    });
  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return res.status(500).json({ error: String(error) });
  }
}
