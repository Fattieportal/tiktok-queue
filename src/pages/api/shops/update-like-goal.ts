import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

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

  try {
    const { id, likeGoal } = req.body as { id?: string; likeGoal?: string };
    if (!id) {
      return res.status(400).json({ error: "Missing shop id" });
    }

    const { data, error } = await supabase
      .from("shops")
      .update({ like_goal: likeGoal ?? null })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ shop: data });
  } catch (error) {
    console.error("Error updating like goal:", error);
    return res.status(500).json({ error: "Failed to update like goal" });
  }
}
