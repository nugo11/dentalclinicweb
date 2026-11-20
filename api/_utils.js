import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://aident.ge",
  "https://www.aident.ge",
];

/**
 * Checks whether a request Origin is permitted for CORS and applies scoped headers.
 * Never sets Access-Control-Allow-Origin to "*".
 */
export function applyCors(req, res, methods = "POST, OPTIONS") {
  const origin = req.headers?.origin ? String(req.headers.origin).trim() : "";
  const extraOrigins = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);

  const vercelOrigin = process.env.VERCEL_URL
    ? `https://${String(process.env.VERCEL_URL).trim().toLowerCase()}`
    : null;

  const allowedSet = new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...extraOrigins,
    ...(vercelOrigin ? [vercelOrigin] : []),
  ]);

  const lowerOrigin = origin.toLowerCase();
  const isLocalOrigin =
    /^http:\/\/localhost(:\d+)?$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin);

  if (origin && (allowedSet.has(lowerOrigin) || isLocalOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Lazily initializes and returns the Firebase Admin instance if credentials exist.
 */
export function getAdminInstance() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const keyPaths = [
    path.resolve(process.cwd(), "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "serviceAccountKey.json"),
  ];

  for (const kp of keyPaths) {
    if (fs.existsSync(kp)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(kp, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        return admin;
      } catch (e) {
        console.warn("Failed to load serviceAccountKey.json:", e);
      }
    }
  }

  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envServiceAccount) {
    try {
      const serviceAccount = JSON.parse(envServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT env:", e);
    }
  }

  return null;
}

/**
 * Validates the Authorization Bearer token, verifying via Firebase Admin when configured.
 */
export async function verifyBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const err = new Error("არაავტორიზებული მოთხოვნა: Bearer ტოკენი აუცილებელია.");
    err.statusCode = 401;
    throw err;
  }

  const adminApp = getAdminInstance();
  if (!adminApp) {
    return { token, decoded: null, adminConfigured: false };
  }

  try {
    const decoded = await adminApp.auth().verifyIdToken(token);
    return { token, decoded, adminConfigured: true };
  } catch {
    const err = new Error("არასწორი ან ვადაგასული ავტორიზაციის ტოკენი.");
    err.statusCode = 401;
    throw err;
  }
}
