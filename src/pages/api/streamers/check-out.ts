import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { streamerId, endOrderId } = req.body;

  if (!streamerId) {
    return res.status(400).json({ error: "Missing streamerId" });
  }

  if (!endOrderId) {
    return res.status(400).json({ error: "Missing endOrderId - selecteer een eindorder" });
  }

  try {
    // Haal streamer op om shop_id te krijgen
    const { data: streamer } = await supabaseAdmin
      .from("streamers")
      .select("shop_id")
      .eq("id", streamerId)
      .single();

    if (!streamer) {
      return res.status(404).json({ error: "Streamer not found" });
    }

    // Verificeer dat de end order bestaat en van de juiste shop is
    const { data: endOrder } = await supabaseAdmin
      .from("queue_entries")
      .select("*")
      .eq("id", endOrderId)
      .eq("shop_id", streamer.shop_id)
      .single();

    if (!endOrder) {
      return res.status(400).json({ error: "End order niet gevonden of verkeerde shop" });
    }

    const { data, error } = await supabaseAdmin
      .from("streamers")
      .update({
        is_active: false,
        checked_out_at: new Date().toISOString(),
        end_order_id: endOrderId,
      })
      .eq("id", streamerId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      streamer: data,
      message: "Streamer is uitgecheckt!"
    });
  } catch (error) {
    console.error("Error checking out streamer:", error);
    return res.status(500).json({ error: "Failed to check out streamer" });
  }
}
