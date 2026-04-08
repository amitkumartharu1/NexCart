/**
 * HTML sanitization to prevent XSS.
 * Applied to any user-submitted rich content:
 * - product descriptions (admin-editable)
 * - reviews
 * - support messages
 * - ticket bodies
 * - blog content
 *
 * Server-only.
 */

import DOMPurify from "isomorphic-dompurify";

// Strict: allows NO HTML — use for plain text fields (names, titles, etc.)
export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

// Standard: allows basic formatting — use for reviews, support messages
export function sanitizeBasicHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

// Rich: allows more formatting — use for product/service descriptions, blog content
export function sanitizeRichHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "b", "i", "em", "strong", "u", "s",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
    ADD_ATTR: ["target"],
  });
}
