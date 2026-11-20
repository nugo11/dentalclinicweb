import { doc, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Reads EHR credentials from the clinic's protected private subcollection,
 * falling back to legacy fields on the clinic document if not yet migrated.
 */
export const getClinicEhrCredentials = async (clinicId, legacyClinicData = null) => {
  if (!clinicId) {
    return { ehrUsername: "", ehrPassword: "" };
  }

  try {
    const privateRef = doc(db, "clinics", clinicId, "private", "ehr");
    const snap = await getDoc(privateRef);
    if (snap.exists()) {
      const data = snap.data() || {};
      if (data.ehrUsername || data.ehrPassword) {
        return {
          ehrUsername: data.ehrUsername || "",
          ehrPassword: data.ehrPassword || "",
        };
      }
    }
  } catch (err) {
    console.warn("Failed to read private EHR credentials:", err);
  }

  return {
    ehrUsername: legacyClinicData?.ehrUsername || "",
    ehrPassword: legacyClinicData?.ehrPassword || "",
  };
};

/**
 * Saves EHR credentials into `clinics/{clinicId}/private/ehr` and removes
 * legacy plaintext credential fields from the public clinic document.
 */
export const saveClinicEhrCredentials = async (clinicId, { ehrUsername = "", ehrPassword = "" }) => {
  if (!clinicId) throw new Error("Missing clinicId");

  const trimmedUser = String(ehrUsername || "").trim();
  const password = String(ehrPassword || "");

  await setDoc(
    doc(db, "clinics", clinicId, "private", "ehr"),
    {
      ehrUsername: trimmedUser,
      ehrPassword: password,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "clinics", clinicId), {
    ehrConfigured: Boolean(trimmedUser && password),
    ehrUsername: deleteField(),
    ehrPassword: deleteField(),
  });
};
