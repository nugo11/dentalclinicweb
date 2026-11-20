import { applyCors, verifyBearerToken } from "./_utils.js";

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

    const { phone, text } = req.body || {};
    const digits = String(phone || "").replace(/\D/g, "");
    const normalizedPhone = digits.length === 9 && digits.startsWith("5") ? `995${digits}` : digits;

    if (!/^9955\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: "არასწორი მობილური ნომერი SMS-ისთვის" });
    }

    const messageText = String(text || "").trim();
    if (!messageText || messageText.length > 500) {
      return res.status(400).json({ error: "SMS ტექსტი ცარიელია ან აღემატება 500 სიმბოლოს" });
    }

    const ubillKey = process.env.UBILL_API_KEY || process.env.VITE_UBILL_API_KEY;
    if (!ubillKey) {
      return res.status(200).json({ ok: false, skipped: true, message: "UBill API key not configured" });
    }

    const resp = await fetch(`https://api.ubill.dev/v1/sms/send?key=${encodeURIComponent(ubillKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandID: 2,
        numbers: [normalizedPhone],
        text: messageText,
        otp: true,
      }),
    });

    const data = await resp.json().catch(() => null);
    return res.status(resp.ok ? 200 : 502).json({
      ok: resp.ok && (data?.statusID === undefined || data?.statusID === 0),
      data,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "SMS dispatch failed" });
  }
}
