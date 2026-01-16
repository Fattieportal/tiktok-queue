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
    const { id, primaryColor, textColor, backgroundColor } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Shop ID is required" });
    }

    const updateData: Record<string, string> = {};
    if (primaryColor) updateData.primary_color = primaryColor;
    if (textColor) updateData.text_color = textColor;
    if (backgroundColor) updateData.background_color = backgroundColor;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No colors provided to update" });
    }

    const { data: shop, error } = await supabase
      .from("shops")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ shop });
  } catch (error) {
    console.error("Error updating shop colors:", error);
    return res.status(500).json({ error: "Failed to update shop colors" });
  }
}
