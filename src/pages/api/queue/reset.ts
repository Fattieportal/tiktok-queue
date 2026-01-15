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

type QueueRow = { id: number; status: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Get ids that will be cleared (for undo)
  const rows = await supabaseAdmin
    .from("queue_entries")
    .select("id,status")
    .in("status", ["waiting", "active"]);

  if (rows.error) return res.status(500).json({ ok: false, error: rows.error.message });

  const data = (rows.data ?? []) as QueueRow[];

  const ids = data.map((r) => r.id);
  const previousStatuses = data.reduce<Record<string, string>>((acc, r) => {
    acc[String(r.id)] = r.status;
    return acc;
  }, {});

  // Clear them
  if (ids.length > 0) {
    const upd = await supabaseAdmin.from("queue_entries").update({ status: "done" }).in("id", ids);
    if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });
  }

  // Log reset action for undo
  const log = await supabaseAdmin.from("queue_actions").insert({
    action_type: "reset",
    payload: { ids, previousStatuses },
  });

  if (log.error) return res.status(500).json({ ok: false, error: log.error.message });

  return res.status(200).json({ ok: true, cleared: ids.length });
}
