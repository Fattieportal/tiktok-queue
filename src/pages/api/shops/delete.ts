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
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Shop ID is required" });
    }

    const { error } = await supabase
      .from("shops")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return res.status(500).json({ error: "Failed to delete shop" });
  }
}
