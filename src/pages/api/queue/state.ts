import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data: active } = await supabase
    .from("queue_entries")
    .select("id, first_name")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: waiting } = await supabase
    .from("queue_entries")
    .select("id, first_name")
    .eq("status", "waiting")
    .order("created_at", { ascending: true });

  res.status(200).json({
    active: active?.[0] ?? null,
    waiting: waiting ?? [],
    totalWaiting: waiting?.length ?? 0,
  });
}
