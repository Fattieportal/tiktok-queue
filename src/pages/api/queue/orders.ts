import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const shopId = req.query.shopId as string | undefined;

  if (!shopId) {
    return res.status(400).json({ error: "Missing shopId" });
  }

  try {
    // Haal alle waiting orders op, gesorteerd op created_at
    const { data, error } = await supabaseAdmin
      .from("queue_entries")
      .select("id, order_number, first_name, product_info, created_at, status")
      .eq("shop_id", shopId)
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ 
      orders: data || [] 
    });
  } catch (error) {
    console.error("Error fetching queue orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}
