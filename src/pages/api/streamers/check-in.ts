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

  const { streamerName, shopId, startOrderId } = req.body;

  if (!streamerName || !shopId) {
    return res.status(400).json({ error: "Missing streamerName or shopId" });
  }

  if (!startOrderId) {
    return res.status(400).json({ error: "Missing startOrderId - selecteer een startorder" });
  }

  try {
    // Verificeer dat de start order bestaat en van de juiste shop is
    const { data: startOrder } = await supabaseAdmin
      .from("queue_entries")
      .select("*")
      .eq("id", startOrderId)
      .eq("shop_id", shopId)
      .single();

    if (!startOrder) {
      return res.status(400).json({ error: "Start order niet gevonden of verkeerde shop" });
    }

    // Check-out alle andere actieve streamers voor deze shop
    await supabaseAdmin
      .from("streamers")
      .update({ 
        is_active: false, 
        checked_out_at: new Date().toISOString() 
      })
      .eq("shop_id", shopId)
      .eq("is_active", true);

    // Check of streamer al bestaat voor deze shop
    const { data: existing } = await supabaseAdmin
      .from("streamers")
      .select("*")
      .eq("name", streamerName)
      .eq("shop_id", shopId)
      .single();

    let streamer;

    if (existing) {
      // Update bestaande streamer
      const { data, error } = await supabaseAdmin
        .from("streamers")
        .update({
          is_active: true,
          checked_in_at: new Date().toISOString(),
          checked_out_at: null,
          start_order_id: startOrderId,
          end_order_id: null, // Reset end order
          session_count: (existing.session_count || 0) + 1,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      streamer = data;
    } else {
      // Maak nieuwe streamer
      const { data, error } = await supabaseAdmin
        .from("streamers")
        .insert({
          name: streamerName,
          shop_id: shopId,
          is_active: true,
          checked_in_at: new Date().toISOString(),
          start_order_id: startOrderId,
          session_count: 1,
        })
        .select()
        .single();

      if (error) throw error;
      streamer = data;
    }

    // BACKFILL: Wijs alle orders vanaf start order toe aan deze streamer
    // Dit zorgt ervoor dat orders die binnenkwamen vóór check-in maar ná de start-order
    // alsnog worden toegewezen aan de streamer
    const { data: startOrderData } = await supabaseAdmin
      .from("queue_entries")
      .select("created_at")
      .eq("id", startOrderId)
      .single();

    if (startOrderData) {
      await supabaseAdmin
        .from("queue_entries")
        .update({ streamer_id: streamer.id })
        .eq("shop_id", shopId)
        .gte("created_at", startOrderData.created_at)
        .is("streamer_id", null); // Alleen orders zonder streamer
    }

    return res.status(200).json({ 
      success: true, 
      streamer,
      message: `${streamerName} is nu ingecheckt!`
    });
  } catch (error) {
    console.error("Error checking in streamer:", error);
    return res.status(500).json({ error: "Failed to check in streamer" });
  }
}
