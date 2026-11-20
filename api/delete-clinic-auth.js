import { applyCors, getAdminInstance } from "./_utils.js";

const SUPERADMIN_EMAILS = ["nugoxucishvili@gmail.com", "khvedelidzezura77@gmail.com"];

export default async function handler(req, res) {
  applyCors(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ownerId, ownerEmail } = req.body || {};

    const adminApp = getAdminInstance();
    if (!adminApp) {
      return res.status(200).json({
        authDeleted: false,
        requiresServiceAccount: true,
        message: "Firebase Admin SDK-ს გასაღები (serviceAccountKey.json) არ არის ატვირთული.",
      });
    }

    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: "არაავტორიზებული მოთხოვნა: Bearer ტოკენი აუცილებელია." });
    }

    let decodedEmail = "";
    try {
      const decoded = await adminApp.auth().verifyIdToken(token);
      decodedEmail = (decoded.email || "").toLowerCase().trim();
    } catch {
      return res.status(401).json({ error: "არასწორი ან ვადაგასული ავტორიზაციის ტოკენი." });
    }

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
      } catch {
        return res.status(200).json({
          authDeleted: true,
          message: "მომხმარებელი ვერ მოიძებნა Firebase Auth-ში (შესაძლოა უკვე წაშლილია).",
        });
      }
    }

    if (targetUid) {
      try {
        await adminApp.auth().deleteUser(targetUid);
        return res.status(200).json({
          authDeleted: true,
          message: `მომხმარებელი ${ownerEmail || targetUid} წარმატებით წაიშალა Firebase Authentication-იდან.`,
        });
      } catch (delErr) {
        if (delErr.code === "auth/user-not-found") {
          return res.status(200).json({
            authDeleted: true,
            message: "მომხმარებელი უკვე აღარ არსებობს Firebase Authentication-ში.",
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
      error: err.message || "შეცდომა Firebase Auth-იდან წაშლისას",
    });
  }
}
