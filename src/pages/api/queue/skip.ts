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

type IdRow = { id: number };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const shopId = req.query.shopId as string | undefined;
  if (!shopId) return res.status(400).json({ ok: false, error: "Missing shopId" });

  // Oldest waiting
  const w = await supabaseAdmin
    .from("queue_entries")
    .select("id")
    .eq("shop_id", shopId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle<IdRow>();

  if (w.error) return res.status(500).json({ ok: false, error: w.error.message });
  if (!w.data) return res.status(200).json({ ok: true, skipped: false });

  const skippedId = w.data.id;

  const upd = await supabaseAdmin.from("queue_entries").update({ status: "skipped" }).eq("id", skippedId);
  if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });

  const log = await supabaseAdmin.from("queue_actions").insert({
    action_type: "skip",
    payload: { skippedId },
    shop_id: shopId,
  });

  if (log.error) return res.status(500).json({ ok: false, error: log.error.message });

  return res.status(200).json({ ok: true, skipped: true, skippedId });
}
