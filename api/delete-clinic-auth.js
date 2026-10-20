import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin if not already initialized
function getAdminInstance() {
  if (admin.apps.length > 0) {
    return admin;
  }

  // 1. Check for serviceAccountKey.json in root or current dir
  const keyPaths = [
    path.resolve(process.cwd(), "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "serviceAccountKey.json"),
  ];

  for (const kp of keyPaths) {
    if (fs.existsSync(kp)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(kp, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        return admin;
      } catch (e) {
        console.warn("Failed to load serviceAccountKey.json:", e);
      }
    }
  }

  // 2. Check for FIREBASE_SERVICE_ACCOUNT environment variable
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envServiceAccount) {
    try {
      const serviceAccount = JSON.parse(envServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      return admin;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT env:", e);
    }
  }

  return null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ownerId, ownerEmail, superAdminEmail } = req.body || {};

    const adminApp = getAdminInstance();
    if (!adminApp) {
      return res.status(200).json({
        authDeleted: false,
        requiresServiceAccount: true,
        message: "Firebase Admin SDK-ს გასაღები (serviceAccountKey.json) არ არის ატვირთული."
      });
    }

    // Security check: Must be authenticated and verified as platform super admin
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: "არაავტორიზებული მოთხოვნა: Bearer ტოკენი აუცილებელია." });
    }

    let decodedEmail = "";
    try {
      const decoded = await adminApp.auth().verifyIdToken(token);
      decodedEmail = (decoded.email || "").toLowerCase().trim();
    } catch (tokErr) {
      return res.status(401).json({ error: "არასწორი ან ვადაგასული ავტორიზაციის ტოკენი." });
    }

    const SUPERADMIN_EMAILS = ["nugoxucishvili@gmail.com", "khvedelidzezura77@gmail.com"];
    if (!decodedEmail || !SUPERADMIN_EMAILS.includes(decodedEmail)) {
      return res.status(403).json({ error: "წვდომა უარყოფილია: მხოლოდ სუპერ ადმინისტრატორს აქვს წაშლის უფლება." });
    }

    if (!ownerId && !ownerEmail) {
      return res.status(400).json({ error: "საჭიროა ownerId ან ownerEmail" });
    }

    let targetUid = ownerId;
    if (!targetUid && ownerEmail) {
      try {
        const userRecord = await adminApp.auth().getUserByEmail(ownerEmail.toLowerCase().trim());
        targetUid = userRecord.uid;
      } catch (notFound) {
        return res.status(200).json({
          authDeleted: true,
          message: "მომხმარებელი ვერ მოიძებნა Firebase Auth-ში (შესაძლოა უკვე წაშლილია)."
        });
      }
    }

    if (targetUid) {
      try {
        await adminApp.auth().deleteUser(targetUid);
        return res.status(200).json({
          authDeleted: true,
          message: `მომხმარებელი ${ownerEmail || targetUid} წარმატებით წაიშალა Firebase Authentication-იდან.`
        });
      } catch (delErr) {
        if (delErr.code === "auth/user-not-found") {
          return res.status(200).json({
            authDeleted: true,
            message: "მომხმარებელი უკვე აღარ არსებობს Firebase Authentication-ში."
          });
        }
        throw delErr;
      }
    }

    return res.status(404).json({ error: "UID ვერ დადგინდა" });
  } catch (err) {
    console.error("Auth deletion error:", err);
    return res.status(500).json({
      authDeleted: false,
      error: err.message || "შეცდომა Firebase Auth-იდან წაშლისას"
    });
  }
}
