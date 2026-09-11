import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get a sample order to see what data we have
    const { data: sampleOrders, error: sampleError } = await supabaseAdmin
      .from("queue_entries")
      .select("id, order_number, first_name, total_price, currency, streamer_id, created_at")
      .limit(5)
      .order("created_at", { ascending: false });

    if (sampleError) {
      return res.status(500).json({ 
        error: "Failed to get sample orders",
        details: sampleError 
      });
    }

    // Check if columns exist by trying to select them
    const { data: columnTest } = await supabaseAdmin
      .from("queue_entries")
      .select("total_price, currency")
      .limit(1);

    return res.status(200).json({
      success: true,
      message: "Schema check complete",
      sampleOrders,
      columnsExist: columnTest !== null,
      note: "If columnsExist is false, the columns don't exist and need to be added via ADD_PRICE_TRACKING.sql",
    });
  } catch (error) {
    console.error("Schema check error:", error);
    return res.status(500).json({ error: String(error) });
  }
}
