/**
 * HTML, XML and URL sanitization helpers for print templates and SOAP requests.
 */

const HTML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const XML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * Escapes unsafe HTML characters in untrusted values.
 */
export const escapeHtml = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[&<>"']/g, (ch) => HTML_ENTITY_MAP[ch]);
};

/**
 * Escapes unsafe XML characters in untrusted values.
 */
export const escapeXml = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[&<>"']/g, (ch) => XML_ENTITY_MAP[ch]);
};

/**
 * Allows only http(s) URLs or root-relative paths and escapes HTML attribute characters.
 */
export const sanitizeUrl = (url) => {
  if (url === null || url === undefined) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const isAllowed =
    lower.startsWith("https://") ||
    lower.startsWith("http://") ||
    (trimmed.startsWith("/") && !trimmed.startsWith("//"));

  if (!isAllowed) return "";
  return escapeHtml(trimmed);
};
