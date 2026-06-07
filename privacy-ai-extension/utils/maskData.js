// Replaces sensitive parts in text with masked equivalents.
// Masking strategy:
// - sk-XXXXXXXX -> sk-**** last 2 visible
// - AIzaXXXXXXXX -> AIza**** last 4 visible
// - emails -> first char, ****, domain kept
// - phones -> mask middle digits
// - bearer tokens and keywords values -> partially mask value

(function () {
  function partialMask(value, visibleStart = 2, visibleEnd = 2) {
    if (!value) return value;
    const start = value.slice(0, visibleStart);
    const end = value.slice(-visibleEnd);
    const middleLen = Math.max(0, value.length - visibleStart - visibleEnd);
    return `${start}${"*".repeat(middleLen)}${end}`;
  }

  function maskEmail(match) {
    const [local, domain] = match.split("@");
    if (!local || !domain) return match;
    const maskedLocal = partialMask(local, 1, Math.min(1, local.length - 1));
    return `${maskedLocal}@${domain}`;
  }

  function maskPhone(match) {
    // Keep formatting, mask digits except first 2 and last 2
    const digits = match.replace(/\D/g, "");
    if (digits.length < 6) return match.replace(/\d/g, "*");
    const maskedDigits = partialMask(digits, 2, 2);
    let i = 0;
    return match.replace(/\d/g, () => maskedDigits[i++]);
  }

  function maskData(text) {
    if (!text || typeof text !== "string") return text;

    let out = text;

    // OpenAI key sk-...
    out = out.replace(/\bsk-([A-Za-z0-9]{8,})\b/g, (m, p1) => {
      return `sk-${partialMask(p1, 0, 2)}`;
    });

    // Google API key AIza...
    out = out.replace(/\b(AIza)([0-9A-Za-z\-_]{12,})\b/g, (m, prefix, rest) => {
      return `${prefix}${partialMask(rest, 0, 4)}`;
    });

    // Bearer tokens
    out = out.replace(/\b(Bearer\s+)([A-Za-z0-9\-_\.=]{10,})\b/g, (m, prefix, token) => {
      return `${prefix}${partialMask(token, 2, 2)}`;
    });

    // Emails
    out = out.replace(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi, (m) => maskEmail(m));

    // Phone numbers
    out = out.replace(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g, (m) => maskPhone(m));

    // password / token / secret / apikey values "key: value"
    out = out.replace(/\b(password|passwd|passcode|secret|token|apikey|api_key|authorization)\b\s*[:=]\s*([^\s,;]{4,})/gi, (m, key, value) => {
      return `${key}: ${partialMask(value, 1, 2)}`;
    });

    return out;
  }

  window.maskData = maskData;
})();

