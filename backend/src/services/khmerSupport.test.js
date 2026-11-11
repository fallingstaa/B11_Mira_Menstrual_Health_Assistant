// Unit tests for Khmer AI support — no Gemini or database calls; only the pure helpers.
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-key";

const { containsKhmer, resolveReplyLanguage } = require("../utils/language");
const { parseClassifierReply, SAFETY_DISCLAIMER } = require("./safetyService");
const { buildSystemPrompt, NO_CONTEXT_REPLY } = require("./geminiService");

describe("resolveReplyLanguage", () => {
  it("answers a Khmer-script question in Khmer, whatever the app language", () => {
    expect(resolveReplyLanguage("តើរដូវជាអ្វី?", "en")).toBe("km");
    expect(resolveReplyLanguage("តើរដូវជាអ្វី?", undefined)).toBe("km");
  });

  it("follows the app language for a non-Khmer question", () => {
    expect(resolveReplyLanguage("What is a period?", "km")).toBe("km");
    expect(resolveReplyLanguage("What is a period?", "en")).toBe("en");
  });

  it("falls back to English for a missing or unknown language", () => {
    expect(resolveReplyLanguage("What is a period?", undefined)).toBe("en");
    expect(resolveReplyLanguage("What is a period?", "fr")).toBe("en");
  });

  it("detects Khmer mixed into English text", () => {
    expect(containsKhmer("Is tampon ល្អ?")).toBe(true);
    expect(containsKhmer("Is a tampon safe?")).toBe(false);
  });
});

describe("parseClassifierReply", () => {
  const q = "តើខ្ញុំអាចហែលទឹកពេលមករដូវបានទេ?";

  it("reads an ALLOW decision and the English search text", () => {
    const r = parseClassifierReply('{"decision":"ALLOW","english":"Can I swim during my period?"}', q);
    expect(r).toEqual({ unsafe: false, searchQuery: "Can I swim during my period?" });
  });

  it("reads a BLOCK decision", () => {
    const r = parseClassifierReply('{"decision":"BLOCK","english":"What dose of ibuprofen should I take?"}', q);
    expect(r.unsafe).toBe(true);
  });

  it("tolerates a ```json fence around the object", () => {
    const r = parseClassifierReply('```json\n{"decision":"allow","english":"Why do I get cramps?"}\n```', q);
    expect(r).toEqual({ unsafe: false, searchQuery: "Why do I get cramps?" });
  });

  it("fails closed when the reply isn't JSON but says BLOCK", () => {
    expect(parseClassifierReply("BLOCK", q).unsafe).toBe(true);
  });

  it("keeps the original question as the search text when no English comes back", () => {
    expect(parseClassifierReply("ALLOW", q)).toEqual({ unsafe: false, searchQuery: q });
    expect(parseClassifierReply('{"decision":"ALLOW","english":"  "}', q).searchQuery).toBe(q);
  });
});

describe("Khmer replies", () => {
  it("adds the Khmer instruction only for Khmer", () => {
    expect(buildSystemPrompt(1, "km")).toContain("ENTIRE answer in Khmer");
    expect(buildSystemPrompt(1, "en")).not.toContain("ENTIRE answer in Khmer");
    expect(buildSystemPrompt(1)).not.toContain("ENTIRE answer in Khmer");
  });

  it("keeps the later-turn style rule alongside the Khmer instruction", () => {
    const prompt = buildSystemPrompt(2, "km");
    expect(prompt).toContain("not the user's first question");
    expect(prompt).toContain("ENTIRE answer in Khmer");
  });

  it("has Khmer versions of the fixed replies", () => {
    for (const fixed of [NO_CONTEXT_REPLY, SAFETY_DISCLAIMER]) {
      expect(containsKhmer(fixed.km)).toBe(true);
      expect(containsKhmer(fixed.en)).toBe(false);
    }
  });
});
