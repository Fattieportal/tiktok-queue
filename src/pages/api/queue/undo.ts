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

type ActionType = "next" | "skip" | "reset" | "add" | "remove";

type ActionRow = {
  id: number;
  action_type: ActionType;
  payload: Record<string, unknown>;
  undone_at: string | null;
};

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNumberArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  const nums: number[] = [];
  for (const item of v) {
    const n = toNumberOrNull(item);
    if (n !== null) nums.push(n);
  }
  return nums;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Latest not-undone action
  const a = await supabaseAdmin
    .from("queue_actions")
    .select("id,action_type,payload,undone_at")
    .is("undone_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ActionRow>();

  if (a.error) return res.status(500).json({ ok: false, error: a.error.message });
  if (!a.data) return res.status(200).json({ ok: true, undone: false, reason: "No actions" });

  const action = a.data;
  const payload = action.payload ?? {};

  // Undo logic per action type
  if (action.action_type === "add") {
    const insertedId = toNumberOrNull(payload["insertedId"]);
    if (insertedId !== null) {
      const u1 = await supabaseAdmin.from("queue_entries").update({ status: "undone" }).eq("id", insertedId);
      if (u1.error) return res.status(500).json({ ok: false, error: u1.error.message });
    }
  }

  if (action.action_type === "skip") {
    const skippedId = toNumberOrNull(payload["skippedId"]);
    if (skippedId !== null) {
      const u1 = await supabaseAdmin.from("queue_entries").update({ status: "waiting" }).eq("id", skippedId);
      if (u1.error) return res.status(500).json({ ok: false, error: u1.error.message });
    }
  }

  if (action.action_type === "next") {
    const prevActiveId = toNumberOrNull(payload["prevActiveId"]);
    const newActiveId = toNumberOrNull(payload["newActiveId"]);

    // revert new active back to waiting
    if (newActiveId !== null) {
      const u1 = await supabaseAdmin.from("queue_entries").update({ status: "waiting" }).eq("id", newActiveId);
      if (u1.error) return res.status(500).json({ ok: false, error: u1.error.message });
    }

    // restore previous active (if it existed)
    if (prevActiveId !== null) {
      const u2 = await supabaseAdmin.from("queue_entries").update({ status: "active" }).eq("id", prevActiveId);
      if (u2.error) return res.status(500).json({ ok: false, error: u2.error.message });
    }
  }

  if (action.action_type === "reset") {
    const ids = toNumberArray(payload["ids"]);
    const prevRaw = payload["previousStatuses"];
    const previousStatuses: Record<string, unknown> =
      typeof prevRaw === "object" && prevRaw !== null ? (prevRaw as Record<string, unknown>) : {};

    for (const id of ids) {
      const prevStatus = previousStatuses[String(id)];
      if (typeof prevStatus === "string" && prevStatus.length > 0) {
        const u1 = await supabaseAdmin.from("queue_entries").update({ status: prevStatus }).eq("id", id);
        if (u1.error) return res.status(500).json({ ok: false, error: u1.error.message });
      }
    }
  }

  if (action.action_type === "remove") {
    const removedId = toNumberOrNull(payload["removedId"]);
    const previousStatus = payload["previousStatus"];
    if (removedId !== null && typeof previousStatus === "string") {
      const u1 = await supabaseAdmin.from("queue_entries").update({ status: previousStatus }).eq("id", removedId);
      if (u1.error) return res.status(500).json({ ok: false, error: u1.error.message });
    }
  }

  // Mark action undone
  const u = await supabaseAdmin
    .from("queue_actions")
    .update({ undone_at: new Date().toISOString() })
    .eq("id", action.id);

  if (u.error) return res.status(500).json({ ok: false, error: u.error.message });

  return res.status(200).json({ ok: true, undone: true, action: action.action_type });
}
