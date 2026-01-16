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

  const shopId = req.query.shopId as string | undefined;
  
  if (!shopId) {
    return res.status(400).json({ ok: false, error: "shopId is required" });
  }

  const active = await supabaseAdmin
    .from("queue_entries")
    .select("id,first_name")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (active.error) return res.status(500).send(active.error.message);

  const waiting = await supabaseAdmin
    .from("queue_entries")
    .select("id,first_name")
    .eq("shop_id", shopId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (waiting.error) return res.status(500).send(waiting.error.message);

  return res.status(200).json({
    active: active.data ?? null,
    waiting: waiting.data ?? [],
    totalWaiting: (waiting.data ?? []).length,
  });
}
