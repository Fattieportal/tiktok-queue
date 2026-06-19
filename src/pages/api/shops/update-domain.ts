import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/db";

function isAuthorized(req: NextApiRequest): boolean {
  const key = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  return key === process.env.ADMIN_KEY;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { shopId, shopifyDomain } = req.body;

  if (!shopId) {
    return res.status(400).json({ error: "shopId is required" });
  }

  if (!shopifyDomain) {
    return res.status(400).json({ error: "shopifyDomain is required" });
  }

  try {
    const { error } = await supabase
      .from("shops")
      .update({ shopify_shop_domain: shopifyDomain })
      .eq("id", shopId);

    if (error) throw error;

    return res.status(200).json({ 
      ok: true, 
      message: "Shopify domain updated successfully",
      shopId,
      shopifyDomain 
    });
  } catch (error) {
    console.error("Error updating shopify domain:", error);
    return res.status(500).json({ error: "Failed to update shopify domain" });
  }
}
