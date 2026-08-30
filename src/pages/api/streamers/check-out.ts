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

  const { streamerId } = req.body;

  if (!streamerId) {
    return res.status(400).json({ error: "Missing streamerId" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("streamers")
      .update({
        is_active: false,
        checked_out_at: new Date().toISOString(),
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
