import crypto from "node:crypto";
import { applyCors, verifyBearerToken } from "./_utils.js";

/**
 * Extracts a Cloudinary public_id from a valid Cloudinary image delivery URL.
 */
function extractPublicId(imageUrl, cloudName) {
  const prefix = `https://res.cloudinary.com/${cloudName}/`;
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith(prefix)) {
    return "";
  }

  try {
    const parsed = new URL(imageUrl);
    const uploadMarker = "/upload/";
    const idx = parsed.pathname.indexOf(uploadMarker);
    if (idx === -1) {
      const lastSeg = parsed.pathname.split("/").filter(Boolean).pop() || "";
      return lastSeg.replace(/\.[^/.]+$/, "");
    }

    const afterUpload = parsed.pathname.slice(idx + uploadMarker.length).replace(/^\/+/, "");
    const segments = afterUpload.split("/").filter(Boolean);
    // Skip optional transformation or version segment (e.g. v1700000000)
    const filtered = segments.filter((seg, sIdx) => !(sIdx === segments.length - 2 && /^v\d+$/.test(seg)) && !(sIdx === 0 && /^v\d+$/.test(seg)));
    const joined = filtered.join("/");
    return joined.replace(/\.[^/.]+$/, "");
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  applyCors(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await verifyBearerToken(req);

    const { imageUrl } = req.body || {};
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dxyhm9ftw";
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      return res.status(400).json({ error: "არასწორი Cloudinary URL" });
    }

    if (!apiKey || !apiSecret) {
      return res.status(200).json({
        ok: false,
        skipped: true,
        message: "Cloudinary credentials not configured on server",
      });
    }

    const publicId = extractPublicId(imageUrl, cloudName);
    if (!publicId) {
      return res.status(400).json({ error: "სურათის public_id ვერ მოიძებნა" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    const params = new URLSearchParams();
    params.set("public_id", publicId);
    params.set("signature", signature);
    params.set("api_key", apiKey);
    params.set("timestamp", String(timestamp));

    const destroyRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await destroyRes.json().catch(() => ({}));
    return res.status(200).json({
      ok: result.result === "ok",
      result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Cloudinary delete failed" });
  }
}
