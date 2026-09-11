import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.STREAMER_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { streamerName, shopId } = req.body;

  if (!streamerName || !shopId) {
    return res.status(400).json({ error: "Missing streamerName or shopId" });
  }

  try {
    // Check of streamer al bestaat voor deze shop
    const { data: existing } = await supabaseAdmin
      .from("streamers")
      .select("*")
      .eq("name", streamerName)
      .eq("shop_id", shopId)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Streamer bestaat al voor deze shop" });
    }

    // Maak nieuwe streamer aan (NIET actief)
    const { data, error } = await supabaseAdmin
      .from("streamers")
      .insert({
        name: streamerName,
        shop_id: shopId,
        is_active: false,
        checked_in_at: null,
        checked_out_at: null,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      streamer: data,
      message: `Streamer "${streamerName}" toegevoegd!`
    });
  } catch (error) {
    console.error("Error creating streamer:", error);
    return res.status(500).json({ error: "Failed to create streamer" });
  }
}
