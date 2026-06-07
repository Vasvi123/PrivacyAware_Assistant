// Background service worker: handles Gemini API calls and messages

// Provide your Gemini API key here or load it from chrome.storage (optional enhancement)
// For now, use a placeholder. The user should replace with their own key.
const GEMINI_API_KEY = "AIzaSyAHmazVrb4FHsRjLj99WUkE9jGvXssn34E"; // TODO: Insert your Gemini API key

// Load the Gemini service
try {
  importScripts("services/gemini.js");
} catch (e) {
  // MV3 service workers support importScripts; if this fails, log the error
  console.warn("Failed to import Gemini service:", e);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === "CALL_GEMINI") {
    const prompt = message.payload && message.payload.prompt ? message.payload.prompt : "";
    (async () => {
      try {
        const text = await self.callGemini(prompt, GEMINI_API_KEY);
        sendResponse({ ok: true, text });
      } catch (err) {
        sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
      }
    })();
    // Indicate we'll respond asynchronously
    return true;
  }
});

