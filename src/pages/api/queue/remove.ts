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

type RemoveBody = { id?: number };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const shopId = req.query.shopId as string | undefined;
  if (!shopId) return res.status(400).json({ ok: false, error: "Missing shopId" });

  const body: RemoveBody = typeof req.body === "object" && req.body !== null ? (req.body as RemoveBody) : {};
  const id = body.id;

  if (!id || typeof id !== "number") {
    return res.status(400).json({ ok: false, error: "Missing or invalid id" });
  }

  // Haal eerst de huidige status op voor logging
  const current = await supabaseAdmin
    .from("queue_entries")
    .select("id,status,first_name")
    .eq("id", id)
    .eq("shop_id", shopId)
    .single();

  if (current.error) {
    return res.status(404).json({ ok: false, error: "Entry not found" });
  }

  const previousStatus = current.data.status;

  // Verwijder de entry (markeer als removed)
  const upd = await supabaseAdmin
    .from("queue_entries")
    .update({ status: "removed" })
    .eq("id", id);

  if (upd.error) return res.status(500).json({ ok: false, error: upd.error.message });

  // Log de actie voor undo functionaliteit
  const log = await supabaseAdmin.from("queue_actions").insert({
    action_type: "remove",
    payload: { removedId: id, previousStatus },
    shop_id: shopId,
  });

  if (log.error) return res.status(500).json({ ok: false, error: log.error.message });

  return res.status(200).json({ ok: true, removedId: id });
}
