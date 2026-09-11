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

  try {
    // Test with mysteryboxnl first
    const domain = "00tmfy-0h.myshopify.com";
    const token = process.env.SHOPIFY_SECRET_MYSTERYBOXNL;
    const orderId = "8125658136914"; // One of the orders from earlier

    if (!token) {
      return res.status(500).json({ error: "No token for mysteryboxnl" });
    }

    const url = `https://${domain}/admin/api/2024-01/orders/${orderId}.json`;

    console.log("[TEST] Calling:", url);
    console.log("[TEST] Token:", token.substring(0, 20) + "...");

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
      },
    });

    console.log("[TEST] Response status:", response.status);

    const responseText = await response.text();
    console.log("[TEST] Response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return res.status(200).json({
      url,
      status: response.status,
      response: responseData,
    });
  } catch (error) {
    console.error("[TEST] Error:", error);
    return res.status(500).json({ error: String(error) });
  }
}
