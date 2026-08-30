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
    const { data, error } = await supabaseAdmin
      .from("streamers")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return res.status(200).json({ 
      activeStreamer: data || null 
    });
  } catch (error) {
    console.error("Error fetching active streamer:", error);
    return res.status(500).json({ error: "Failed to fetch active streamer" });
  }
}
