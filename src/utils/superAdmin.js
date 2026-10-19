import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Super Admin identifier - Strictly restricted to this email address
 */
export const SUPERADMIN_EMAIL = "nugoxucishvili@gmail.com";

/**
 * Verifies if the authenticated user qualifies as the platform Super Admin.
 * Dual-layer check:
 * 1. Email MUST match `nugoxucishvili@gmail.com` (case-insensitive).
 * 2. User account in Firestore MUST have admin / superadmin status (role === 'admin' or role === 'superadmin' or isSuperAdmin === true).
 * 
 * @param {object} user - Firebase Auth user object
 * @param {object} userData - Firestore user document data
 * @returns {boolean}
 */
export const isSuperAdminUser = (user, userData) => {
  if (!user || !user.email) return false;
  
  const normalizedEmail = user.email.toLowerCase().trim();
  const isEmailAuthorized = normalizedEmail === SUPERADMIN_EMAIL.toLowerCase().trim();
  if (!isEmailAuthorized) return false;

  // Account must have admin status/role
  const hasAdminRole = 
    userData?.role === "admin" || 
    userData?.role === "superadmin" || 
    userData?.isSuperAdmin === true;

  // If user profile is not yet seeded but auth email matches, allow if marked or admin
  return Boolean(hasAdminRole);
};

/**
 * Hashes a 4-digit PIN code using SHA-256 for secure Firestore storage.
 * @param {string} pin - 4-digit PIN string
 * @returns {Promise<string>} - SHA-256 hex string
 */
export const hashPinSha256 = async (pin) => {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(String(pin).trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Generates a cryptographically strong 4-digit random PIN.
 * @returns {string} - 4-digit string (1000 - 9999)
 */
export const generateSecurePin = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = 1000 + (array[0] % 9000);
  return code.toString();
};

/**
 * Logs a high-priority action performed in the Super Admin panel to `admin_audit_logs`.
 * 
 * @param {object} params
 * @param {string} params.adminEmail - Email of the super admin
 * @param {string} params.action - Action identifier e.g. "CLINIC_STATUS_CHANGE", "PIN_RESET"
 * @param {string} params.targetType - "clinic" | "user" | "inventory"
 * @param {string} params.targetId - ID of target document
 * @param {string} params.targetName - Human-readable label
 * @param {string} [params.clinicId] - Associated clinic ID
 * @param {string} [params.clinicName] - Associated clinic name
 * @param {string} params.details - Human-readable Georgian description
 * @param {object} [params.metadata] - Extra metadata (e.g. oldStatus, newStatus)
 */
export const logAdminAudit = async ({
  adminEmail,
  action,
  targetType,
  targetId,
  targetName,
  clinicId = null,
  clinicName = null,
  details,
  metadata = {},
}) => {
  try {
    await addDoc(collection(db, "admin_audit_logs"), {
      adminEmail: adminEmail || SUPERADMIN_EMAIL,
      action,
      targetType,
      targetId,
      targetName: targetName || "უცნობი",
      clinicId: clinicId || null,
      clinicName: clinicName || null,
      details,
      metadata,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("SuperAdmin Audit Log Error:", error);
  }
};
