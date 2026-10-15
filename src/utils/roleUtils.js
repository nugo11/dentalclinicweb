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

/**
 * Returns the Georgian translated label for a given role identifier
 * @param {string} role 
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  if (!role) return "თანამშრომელი";
  const normalized = String(role).trim().toLowerCase();
  return ROLE_LABELS_GEORGIAN[normalized] || role;
};
