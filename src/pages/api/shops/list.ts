import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: shops, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ shops: shops || [] });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return res.status(500).json({ error: "Failed to fetch shops" });
  }
}
