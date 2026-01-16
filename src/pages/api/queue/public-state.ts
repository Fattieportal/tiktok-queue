import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const shopId = req.query.shopId as string | undefined;
  
  if (!shopId) {
    return res.status(400).json({ ok: false, error: "shopId is required" });
  }

  // Get shop colors
  const shopData = await supabaseAdmin
    .from("shops")
    .select("primary_color,text_color,background_color,show_name_background,show_more_background,queue_closed")
    .eq("id", shopId)
    .single();

  if (shopData.error) return res.status(500).send(shopData.error.message);

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
    queueClosed: shopData.data.queue_closed ?? false,
    colors: {
      primary: shopData.data.primary_color || "#FFD400",
      text: shopData.data.text_color || "#000000",
      background: shopData.data.background_color || "rgba(0, 0, 0, 0.6)",
      showNameBg: shopData.data.show_name_background ?? true,
      showMoreBg: shopData.data.show_more_background ?? true,
    },
  });
}
