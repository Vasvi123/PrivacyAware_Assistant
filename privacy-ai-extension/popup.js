// Popup script: orchestrates selection retrieval, detection, masking, messaging to background, and storage.

const els = {
  input: null,
  output: null,
  reasons: null,
  riskBadge: null,
  btnMask: null,
  btnSend: null,
  spinner: null
};

function setRiskBadge(risk) {
  const badge = els.riskBadge;
  badge.classList.remove("badge-low", "badge-medium", "badge-high");
  let cls = "badge-low";
  if (risk === "MEDIUM") cls = "badge-medium";
  if (risk === "HIGH") cls = "badge-high";
  badge.classList.add(cls);
  badge.textContent = risk || "LOW";
}

function renderReasons(reasons) {
  if (!reasons || reasons.length === 0) {
    els.reasons.textContent = "No sensitive patterns detected.";
    return;
  }
  els.reasons.textContent = `Sensitive indicators: ${reasons.join(", ")}`;
}

function analyzeAndRender(text) {
  const result = window.detectSensitive(text);
  setRiskBadge(result.risk);
  renderReasons(result.reasons);
  return result;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0];
}

async function fetchSelection() {
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) return "";

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    return results[0]?.result || "";
  } catch (e) {
    console.log("Selection error:", e);
    return "";
  }
}

function setLoading(isLoading) {
  els.spinner.classList.toggle("hidden", !isLoading);
  els.btnSend.disabled = isLoading;
  els.btnMask.disabled = isLoading;
}

async function saveState(inputText, outputText) {
  try {
    await chrome.storage.local.set({ privacyAi_last: { inputText, outputText, ts: Date.now() } });
  } catch {}
}

async function restoreState() {
  try {
    const data = await chrome.storage.local.get(["privacyAi_last"]);
    return data.privacyAi_last || null;
  } catch {
    return null;
  }
}

async function init() {
  els.input = document.getElementById("inputText");
  els.output = document.getElementById("output");
  els.reasons = document.getElementById("reasons");
  els.riskBadge = document.getElementById("riskBadge");
  els.btnMask = document.getElementById("btnMask");
  els.btnSend = document.getElementById("btnSend");
  els.spinner = document.getElementById("spinner");

  // Attempt to fetch current selection
  const selected = await fetchSelection();
  if (selected) {
    els.input.value = selected;
  } else {
    // Restore previous session if available
    const saved = await restoreState();
    if (saved && saved.inputText) {
      els.input.value = saved.inputText;
      if (saved.outputText) {
        els.output.textContent = saved.outputText;
      }
    }
  }

  analyzeAndRender(els.input.value || "");

  els.input.addEventListener("input", () => {
    analyzeAndRender(els.input.value || "");
  });

  els.btnMask.addEventListener("click", () => {
    const original = els.input.value || "";
    const masked = window.maskData(original);
    if (masked !== original) {
      els.input.value = masked;
    }
    analyzeAndRender(els.input.value || "");
  });

  els.btnSend.addEventListener("click", async () => {
    const text = (els.input.value || "").trim();
    if (!text) return;
    setLoading(true);
    els.output.textContent = "";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "CALL_GEMINI",
        payload: {
          prompt: `Analyze this text and explain if it contains sensitive data and summarize it safely.\n\nText:\n${text}`
        }
      });

      let aiText = "No response from AI.";
      if (response && response.ok === false && response.error) {
        aiText = response.error;
      } else if (response && response.text) {
        aiText = response.text;
      }
      els.output.textContent = aiText;
      await saveState(text, aiText);
    } catch (e) {
      els.output.textContent = "Error contacting AI service.";
    } finally {
      setLoading(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

