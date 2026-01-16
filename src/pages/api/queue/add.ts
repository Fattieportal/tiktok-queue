import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

function getAdminKey(req: NextApiRequest): string {
  const v = req.query.key;
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function isAuthorized(req: NextApiRequest): boolean {
  const key = getAdminKey(req);
  const expected = process.env.ADMIN_KEY ?? "";
  return Boolean(expected) && key === expected;
}

type AddBody = { firstName?: string; shopId?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const body: AddBody = typeof req.body === "object" && req.body !== null ? (req.body as AddBody) : {};
  const firstName = (body.firstName ?? "").trim();
  const shopId = body.shopId;

  if (!firstName) return res.status(400).json({ ok: false, error: "Missing firstName" });
  if (!shopId) return res.status(400).json({ ok: false, error: "Missing shopId" });

  const ins = await supabaseAdmin
    .from("queue_entries")
    .insert({
      first_name: firstName,
      status: "waiting",
      order_number: "MANUAL",
      shopify_order_id: null,
      shop_id: shopId,
    })
    .select("id")
    .single();

  if (ins.error) return res.status(500).json({ ok: false, error: ins.error.message });

  const log = await supabaseAdmin.from("queue_actions").insert({
    action_type: "add",
    payload: { insertedId: ins.data.id },
    shop_id: shopId,
  });

  if (log.error) return res.status(500).json({ ok: false, error: log.error.message });

  return res.status(200).json({ ok: true, insertedId: ins.data.id });
}
