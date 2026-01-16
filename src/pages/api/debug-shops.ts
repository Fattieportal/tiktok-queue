import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // List all shops in database
  const { data: shops, error } = await supabaseAdmin
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  // List all environment variables starting with SHOPIFY_SECRET_
  const envVars: Record<string, boolean> = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith("SHOPIFY_SECRET_")) {
      envVars[key] = true;
    }
  });

  return res.status(200).json({
    ok: true,
    shops: shops || [],
    envVars,
    totalShops: shops?.length || 0
  });
}
