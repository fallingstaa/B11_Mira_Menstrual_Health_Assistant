// Khmer Unicode block (U+1780–U+17FF) plus Khmer Symbols (U+19E0–U+19FF).
const KHMER_SCRIPT = /[ក-៿᧠-᧿]/;

const SUPPORTED = ["en", "km"];

/** True if `text` contains any Khmer script at all. */
function containsKhmer(text) {
  return KHMER_SCRIPT.test(text || "");
}

/**
 * Which language Yumi should answer in. A question typed in Khmer always gets a Khmer answer,
 * whatever the app is set to; otherwise it follows the app language the client sent
 * (`requested`, "en" or "km"). Anything else falls back to English.
 */
function resolveReplyLanguage(question, requested) {
  if (containsKhmer(question)) return "km";
  return SUPPORTED.includes(requested) ? requested : "en";
}

module.exports = { containsKhmer, resolveReplyLanguage };
