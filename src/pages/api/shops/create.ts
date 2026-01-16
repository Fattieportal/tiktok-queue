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

  try {
    const { name, displayName, shopifyShopDomain } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: "Name and displayName are required" });
    }

    // Name moet lowercase en zonder spaties
    const normalizedName = name.toLowerCase().replace(/\s+/g, "_");

    const { data: shop, error } = await supabase
      .from("shops")
      .insert({
        name: normalizedName,
        display_name: displayName,
        shopify_shop_domain: shopifyShopDomain || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Shop with this name already exists" });
      }
      throw error;
    }

    return res.status(200).json({ shop });
  } catch (error) {
    console.error("Error creating shop:", error);
    return res.status(500).json({ error: "Failed to create shop" });
  }
}
