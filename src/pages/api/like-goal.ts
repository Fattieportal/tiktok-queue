import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

// GET /api/like-goal?store=<storeIdOrName>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const store = (req.query.store as string) || "default";

    // Try to find a shop where id === store OR name === store
    // Use Supabase .or to allow either match. If not found, fall back to default goal.
    let goal: string | null = null;

    if (store && store !== "default") {
      const orQuery = `id.eq.${store},name.eq.${store}`;
      const { data: shops, error } = await supabase.from("shops").select("*").or(orQuery).limit(1);
      if (error) {
        console.error("Error querying shops for like-goal:", error);
      } else if (shops && shops.length > 0) {
        // Expect a column like "like_goal" on the shops table. If not present, it will be undefined.
        goal = (shops[0] as any).like_goal ?? null;
      }
    }

    // If no specific goal found, fall back to a default from env or a hardcoded message
    if (!goal) {
      goal = process.env.DEFAULT_LIKE_GOAL || "No active like-goal";
    }

    // Cache for short period on edge/CDN
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=59");
    res.status(200).json({ goal });
  } catch (err) {
    console.error("/api/like-goal error:", err);
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=59");
    res.status(500).json({ error: "Failed to fetch like-goal" });
  }
}
