/**
 * Role translations and helpers for AiDent Dental Platform
 */
export const ROLE_LABELS_GEORGIAN = {
  admin: "ადმინისტრატორი",
  manager: "მენეჯერი",
  doctor: "ექიმი",
  receptionist: "რეგისტრატორი",
  accountant: "ბუღალტერი",
  assistant: "ასისტენტი",
};

const GEORGIAN_TO_ROLE = {
  "ადმინისტრატორი": "admin",
  "მენეჯერი": "manager",
  "ექიმი": "doctor",
  "რეგისტრატორი": "receptionist",
  "ბუღალტერი": "accountant",
  "ასისტენტი": "assistant",
};

export const FINANCE_ROLES = ["admin", "manager", "accountant"];

/**
 * Normalizes a role identifier or Georgian label to a canonical lowercase role key
 * @param {string} role
 * @returns {string}
 */
export const normalizeRole = (role) => {
  if (!role) return "";
  const raw = String(role).trim();
  if (GEORGIAN_TO_ROLE[raw]) return GEORGIAN_TO_ROLE[raw];
  return raw.toLowerCase();
};

/**
 * Returns true if the given role represents a doctor
 * @param {string} role
 * @returns {boolean}
 */
export const isDoctorRole = (role) => normalizeRole(role) === "doctor";

/**
 * Returns the Georgian translated label for a given role identifier
 * @param {string} role 
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  if (!role) return "თანამშრომელი";
  const normalized = normalizeRole(role);
  return ROLE_LABELS_GEORGIAN[normalized] || role;
};
