import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY || key === process.env.STREAMER_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const shopId = req.query.shopId as string | undefined;

  try {
    let query = supabaseAdmin
      .from("streamer_stats")
      .select("*")
      .order("checked_in_at", { ascending: false });

    if (shopId) {
      query = query.eq("shop_id", shopId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ streamers: data || [] });
  } catch (error) {
    console.error("Error fetching streamers:", error);
    return res.status(500).json({ error: "Failed to fetch streamers" });
  }
}
