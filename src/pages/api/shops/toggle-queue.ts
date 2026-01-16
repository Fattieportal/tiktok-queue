import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = req.query.key as string;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id, queueClosed } = req.body;

  if (!id || typeof queueClosed !== "boolean") {
    return res.status(400).json({ error: "Missing id or queueClosed" });
  }

  try {
    const { data, error } = await supabase
      .from("shops")
      .update({ queue_closed: queueClosed })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, shop: data });
  } catch (error) {
    console.error("Error toggling queue status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
