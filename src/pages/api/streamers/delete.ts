import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY || key === process.env.STREAMER_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { streamerId } = req.body;

  if (!streamerId) {
    return res.status(400).json({ error: "Missing streamerId" });
  }

  try {
    // First, remove all queue_entries associated with this streamer
    await supabaseAdmin
      .from("queue_entries")
      .update({ streamer_id: null })
      .eq("streamer_id", streamerId);

    // Then delete the streamer
    const { error } = await supabaseAdmin
      .from("streamers")
      .delete()
      .eq("id", streamerId);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: "Streamer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting streamer:", error);
    return res.status(500).json({ error: "Failed to delete streamer" });
  }
}
