// Detects sensitive data patterns in a given text using regex.
// Returns an object: { isSensitive: boolean, reasons: string[], risk: 'LOW'|'MEDIUM'|'HIGH' }
// Email, phone, API keys (sk-..., AIza...), and keywords (password, token, secret, bearer, api key)

(function () {
  function detectSensitive(text) {
    if (!text || typeof text !== "string") {
      return { isSensitive: false, reasons: [], risk: "LOW" };
    }

    const reasons = [];
    const checks = [
      {
        name: "Email address",
        regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
      },
      {
        name: "Phone number",
        // simple broad matcher for international and local (7+ digits) with separators
        regex: /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g
      },
      {
        name: "OpenAI key (sk-...)",
        regex: /\bsk-[A-Za-z0-9]{16,}\b/g
      },
      {
        name: "Google API key (AIza...)",
        regex: /\bAIza[0-9A-Za-z\-_]{20,}\b/g
      },
      {
        name: "Bearer token",
        regex: /\bBearer\s+[A-Za-z0-9\-_\.=]{10,}\b/g
      },
      {
        name: "Password keyword",
        regex: /\b(password|passwd|passcode)\b\s*[:=]?\s*[^\s]{4,}/gi
      },
      {
        name: "Secret/Token keyword",
        regex: /\b(secret|token|apikey|api_key|authorization)\b\s*[:=]?\s*[^\s]{4,}/gi
      }
    ];

    for (const check of checks) {
      if (check.regex.test(text)) {
        reasons.push(check.name);
      }
    }

    let risk = "LOW";
    const highSignals = ["OpenAI key (sk-...)", "Google API key (AIza...)", "Bearer token"];
    const mediumSignals = ["Email address", "Phone number", "Password keyword", "Secret/Token keyword"];

    if (reasons.some(r => highSignals.includes(r))) {
      risk = "HIGH";
    } else if (reasons.some(r => mediumSignals.includes(r))) {
      risk = "MEDIUM";
    }

    return {
      isSensitive: reasons.length > 0,
      reasons,
      risk
    };
  }

  // Expose globally
  window.detectSensitive = detectSensitive;
})();

