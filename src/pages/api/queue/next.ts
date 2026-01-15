import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function getAdminKey(req: NextApiRequest): string {
  const v = req.query.key;
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.ADMIN_KEY ?? "";
  return Boolean(expected) && getAdminKey(req) === expected;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Find current active (oldest)
  const active = await supabaseAdmin
    .from("queue_entries")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: number }>();

  if (active.error) return res.status(500).json({ ok: false, error: active.error.message });

  const prevActiveId: number | null = active.data?.id ?? null;

  // Mark current active as done
  if (prevActiveId) {
    const done = await supabaseAdmin.from("queue_entries").update({ status: "done" }).eq("id", prevActiveId);
    if (done.error) return res.status(500).json({ ok: false, error: done.error.message });
  }

  // Promote oldest waiting to active
  const next = await supabaseAdmin
    .from("queue_entries")
    .select("id")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: number }>();

  if (next.error) return res.status(500).json({ ok: false, error: next.error.message });

  const newActiveId: number | null = next.data?.id ?? null;

  if (newActiveId) {
    const upd = await supabaseAdmin.from("queue_entries").update({ status: "active" }).eq("id", newActiveId);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });
  }

  // Log action for undo
  const log = await supabaseAdmin.from("queue_actions").insert({
    action_type: "next",
    payload: { prevActiveId, newActiveId },
  });

  if (log.error) return res.status(500).json({ ok: false, error: log.error.message });

  return res.status(200).json({ ok: true, prevActiveId, newActiveId });
}
