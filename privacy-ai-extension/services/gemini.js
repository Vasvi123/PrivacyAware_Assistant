// Gemini API service
// Uses Gemini 1.5 Flash model
// Exposes global function: callGemini(prompt, apiKey)

(function () {

  
  const API_URL =
"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

  function extractText(data) {
    try {
      return (
        data.candidates[0].content.parts[0].text ||
        "No response from Gemini."
      );
    } catch (e) {
      return "No response from Gemini.";
    }
  }

  async function callGemini(prompt, apiKey) {

    if (!apiKey) {
      throw new Error("Missing Gemini API key.");
    }

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return extractText(data);
  }

  self.callGemini = callGemini;

})();