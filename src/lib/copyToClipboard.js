/**
 * copyToClipboard.js
 *
 * Safe clipboard copy utility with automatic fallback.
 *
 * Strategy:
 * 1. Try the modern Clipboard API (requires HTTPS or localhost + user gesture).
 * 2. If that fails (HTTP, permission denied, older browser), fall back to
 *    the legacy document.execCommand('copy') via a temporary <textarea>.
 *
 * Returns a Promise<boolean> — true if copy succeeded, false if it failed.
 */

export async function copyToClipboard(text) {
  // ── Modern Clipboard API (HTTPS / localhost only) ──────────────────────
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // ── Legacy execCommand fallback (works on HTTP too) ────────────────────
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Make it off-screen but still selectable
    textarea.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
