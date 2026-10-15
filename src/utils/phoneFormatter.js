/**
 * Utility functions for Georgian phone number formatting and validation.
 * 
 * Rules:
 * - Mobile numbers start with '5' and have exactly 9 digits (e.g., 595 99 98 62).
 *   Formatted: 5XX XX XX XX (3-2-2-2)
 *   Max length: 9 digits.
 * 
 * - City / landline numbers start with '0' and have up to 10 digits (e.g., 032 2 11 00 11).
 *   Formatted for 032: 032 2 11 00 11 (3-1-2-2-2)
 *   Formatted for other regions: 0XXX XX XX XX or 0XX XX XX XX X (up to 10 digits).
 *   Max length: 10 digits.
 * 
 * - If country code +995 or 995 is pasted or typed, automatically stripped.
 * - Dynamic restriction:
 *   If starts with 5 -> max 9 digits.
 *   If starts with 0 -> max 10 digits.
 *   If starts with other digit -> capped at 10 with clear error message.
 */

export const cleanPhone = (val) => {
  if (!val) return "";
  let digits = String(val).replace(/\D/g, "");

  // If pasted with 995 country code e.g. 995595999862 or 9950322110011 or 995322110011
  if (digits.startsWith("995") && digits.length > 3) {
    digits = digits.slice(3);
    // If it was 995 32 ... (Tbilisi without leading 0), prepend 0
    if (digits.startsWith("32") && digits.length <= 9) {
      digits = "0" + digits;
    }
  }

  // Dynamic max length restriction based on start digit
  if (digits.startsWith("5")) {
    return digits.slice(0, 9);
  } else if (digits.startsWith("0")) {
    return digits.slice(0, 10);
  } else if (digits.length > 0) {
    return digits.slice(0, 10);
  }

  return digits;
};

export const formatPhone = (val) => {
  const digits = cleanPhone(val);
  if (!digits) return "";

  // Mobile number (starts with 5, max 9 digits: 5XX XX XX XX)
  if (digits.startsWith("5")) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 5);
    const p3 = digits.slice(5, 7);
    const p4 = digits.slice(7, 9);
    return [p1, p2, p3, p4].filter(Boolean).join(" ");
  }

  // Landline / city number (starts with 0, max 10 digits)
  if (digits.startsWith("0")) {
    // Tbilisi landline 032 2 11 00 11 (3-1-2-2-2)
    if (digits.startsWith("032")) {
      const p1 = digits.slice(0, 3);
      const p2 = digits.slice(3, 4);
      const p3 = digits.slice(4, 6);
      const p4 = digits.slice(6, 8);
      const p5 = digits.slice(8, 10);
      return [p1, p2, p3, p4, p5].filter(Boolean).join(" ");
    }
    // Other regional city landlines: 4-2-2-2 or 3-2-2-2-1
    if (digits.length <= 4) return digits;
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 6);
    const p3 = digits.slice(6, 8);
    const p4 = digits.slice(8, 10);
    return [p1, p2, p3, p4].filter(Boolean).join(" ");
  }

  // Fallback for non 5/0
  return digits;
};

export const validatePhone = (val, isRequired = false) => {
  const digits = cleanPhone(val);

  if (!digits) {
    return isRequired ? "ტელეფონის ნომრის მითითება სავალდებულოა" : null;
  }

  if (!digits.startsWith("5") && !digits.startsWith("0")) {
    return "ნომერი უნდა იწყებოდეს 5-ით (მობილური) ან 0-ით (ქალაქის)";
  }

  if (digits.startsWith("5")) {
    if (digits.length < 9) {
      return `მობილურის ნომერი უნდა შედგებოდეს 9 ციფრისგან (${digits.length}/9)`;
    }
    return null;
  }

  if (digits.startsWith("0")) {
    const requiredLength = digits.startsWith("032") ? 10 : 9;
    if (digits.length < requiredLength) {
      return `ქალაქის ნომერი უნდა შედგებოდეს ${requiredLength === 10 ? "10" : "9-10"} ციფრისგან (${digits.length}/10)`;
    }
    return null;
  }

  return null;
};
