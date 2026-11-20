import crypto from "node:crypto";
import { applyCors } from "./_utils.js";

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;
const recentSends = new Map();

function normalizeGeorgianMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("9955")) {
    return digits.slice(3);
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return digits;
  }
  return "";
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function signPayload(payloadB64, secret) {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/**
 * Builds a signed HMAC challenge token containing a salted hash of the OTP.
 */
export function createOtpChallenge({
  phone,
  code,
  purpose = "register",
  secret,
  ttlMs = DEFAULT_OTP_TTL_MS,
}) {
  const cleanedPhone = normalizeGeorgianMobile(phone);
  if (!cleanedPhone) throw new Error("Invalid mobile phone");
  if (!secret) throw new Error("Missing OTP secret");

  const salt = crypto.randomBytes(16).toString("hex");
  const codeHash = sha256Hex(`${String(code)}:${salt}`);
  const exp = Date.now() + ttlMs;
  const payload = { phone: cleanedPhone, purpose, salt, codeHash, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = signPayload(payloadB64, secret);

  return {
    challengeToken: `${payloadB64}.${sig}`,
    expiresAt: exp,
  };
}

/**
 * Verifies a user-submitted OTP code against the signed HMAC challenge token.
 */
export function verifyOtpChallenge({
  phone,
  code,
  purpose = "register",
  challengeToken,
  secret,
}) {
  const cleanedPhone = normalizeGeorgianMobile(phone);
  if (!cleanedPhone || !challengeToken || !secret) return false;

  const trimmedCode = String(code || "").trim();
  if (!/^\d{6}$/.test(trimmedCode)) return false;

  const parts = String(challengeToken).split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  const expectedSig = signPayload(payloadB64, secret);
  const sigBuf = Buffer.from(sigB64, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) {
    return false;
  }
  if (payload.phone !== cleanedPhone || payload.purpose !== purpose || !payload.salt || !payload.codeHash) {
    return false;
  }

  const candidateHash = sha256Hex(`${trimmedCode}:${payload.salt}`);
  const hashBuf = Buffer.from(candidateHash, "hex");
  const storedBuf = Buffer.from(String(payload.codeHash), "hex");
  if (hashBuf.length === 0 || hashBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}

export default async function handler(req, res) {
  applyCors(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ubillKey = process.env.UBILL_API_KEY || process.env.VITE_UBILL_API_KEY;
  const otpSecret = process.env.OTP_SECRET || ubillKey;
  if (!otpSecret) {
    return res.status(503).json({ error: "SMS სერვისი არ არის კონფიგურირებული სერვერზე." });
  }

  try {
    const { action, phone, code, purpose = "register", challengeToken } = req.body || {};
    const cleanedPhone = normalizeGeorgianMobile(phone);

    if (!cleanedPhone) {
      return res.status(400).json({ error: "SMS-ისთვის საჭიროა 9-ნიშნა მობილურის ნომერი (5XX...)" });
    }

    if (action === "send") {
      if (!ubillKey) {
        return res.status(503).json({ error: "UBill API გასაღები არ არის კონფიგურირებული." });
      }

      const rateKey = `${purpose}:${cleanedPhone}`;
      const lastSentAt = recentSends.get(rateKey) || 0;
      const elapsed = Date.now() - lastSentAt;
      if (elapsed < RATE_LIMIT_MS) {
        const retryAfter = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `გთხოვთ დაიცადოთ ${retryAfter} წამი ხელახლა გაგზავნამდე.`,
          retryAfter,
        });
      }

      const otp = String(crypto.randomInt(100000, 1000000));
      const { challengeToken: token, expiresAt } = createOtpChallenge({
        phone: cleanedPhone,
        code: otp,
        purpose,
        secret: otpSecret,
      });

      const text = purpose === "recovery" ? `AiDent recovery code: ${otp}` : `AiDent code: ${otp}`;
      const smsRes = await fetch(`https://api.ubill.dev/v1/sms/send?key=${encodeURIComponent(ubillKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandID: 2,
          numbers: [`995${cleanedPhone}`],
          text,
          otp: true,
        }),
      });

      const data = await smsRes.json().catch(() => ({}));
      if (!smsRes.ok || data.statusID === 10 || (data.statusID !== undefined && data.statusID !== 0)) {
        return res.status(502).json({
          error: data.message || "SMS-ის გაგზავნა ვერ მოხერხდა.",
        });
      }

      recentSends.set(rateKey, Date.now());
      return res.status(200).json({
        ok: true,
        challengeToken: token,
        expiresAt,
      });
    }

    if (action === "verify") {
      const valid = verifyOtpChallenge({
        phone: cleanedPhone,
        code,
        purpose,
        challengeToken,
        secret: otpSecret,
      });

      if (!valid) {
        return res.status(400).json({ ok: false, error: "კოდი არასწორია ან ვადაგასულია" });
      }

      return res.status(200).json({ ok: true, verified: true });
    }

    return res.status(400).json({ error: "უცნობი action პარამეტრი" });
  } catch (err) {
    console.error("SMS OTP error:", err);
    return res.status(500).json({ error: err.message || "SMS სერვერული შეცდომა" });
  }
}
