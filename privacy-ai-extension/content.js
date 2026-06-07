// Content script: responds with current selected text when asked by the popup.
// It keeps no persistent state; selection is read on-demand.

function getSelectedText() {
  try {
    const selection = window.getSelection();
    return selection ? selection.toString() : "";
  } catch {
    return "";
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) return;
  if (message.type === "GET_SELECTION") {
    sendResponse({ text: getSelectedText() || "" });
  }
  // Returning true is unnecessary here because we respond synchronously.
});

