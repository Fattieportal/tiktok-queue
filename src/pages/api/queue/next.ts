import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

function isAdmin(req: NextApiRequest) {
  const key = req.query.key;
  return typeof key === "string" && key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });

  // 1) Mark current active as done (if any)
  const { data: activeRow, error: activeErr } = await supabase
    .from("queue_entries")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeErr) return res.status(500).json({ ok: false, error: activeErr });

  if (activeRow?.id) {
    const { error: doneErr } = await supabase
      .from("queue_entries")
      .update({ status: "done" })
      .eq("id", activeRow.id);

    if (doneErr) return res.status(500).json({ ok: false, error: doneErr });
  }

  // 2) Promote next waiting to active (if any)
  const { data: nextRow, error: nextErr } = await supabase
    .from("queue_entries")
    .select("id")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextErr) return res.status(500).json({ ok: false, error: nextErr });

  if (nextRow?.id) {
    const { error: promoteErr } = await supabase
      .from("queue_entries")
      .update({ status: "active" })
      .eq("id", nextRow.id);

    if (promoteErr) return res.status(500).json({ ok: false, error: promoteErr });
  }

  return res.status(200).json({ ok: true });
}
