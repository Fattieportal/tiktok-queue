import type { NextApiRequest, NextApiResponse } from "next";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check which env vars exist
  const secrets = {
    SHOPIFY_SECRET_MYSTERYBOXNL: !!process.env.SHOPIFY_SECRET_MYSTERYBOXNL,
    SHOPIFY_SECRET_SECRETBOXES: !!process.env.SHOPIFY_SECRET_SECRETBOXES,
    SHOPIFY_SECRET_TCG: !!process.env.SHOPIFY_SECRET_TCG,
    ADMIN_KEY: !!process.env.ADMIN_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const values = {
    SHOPIFY_SECRET_MYSTERYBOXNL: process.env.SHOPIFY_SECRET_MYSTERYBOXNL?.substring(0, 20) + "...",
    SHOPIFY_SECRET_SECRETBOXES: process.env.SHOPIFY_SECRET_SECRETBOXES?.substring(0, 20) + "..." || "NOT SET",
    SHOPIFY_SECRET_TCG: process.env.SHOPIFY_SECRET_TCG?.substring(0, 20) + "..." || "NOT SET",
  };

  return res.status(200).json({
    secrets_exist: secrets,
    secret_preview: values,
  });
}
