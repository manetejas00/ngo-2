/**
 * Avinya Care Foundation - Server-Side Gemini AI Provider Client
 * Communicates directly with Gemini API (gemini-2.5-flash / gemini-1.5-flash) via Node.js native https.
 * Enforces a strict 5-second timeout and structured JSON response mode.
 */

import https from 'node:https';

/**
 * Calls Gemini API to generate structured content.
 * @param {string} promptText - The prompt text for Gemini
 * @param {string} systemInstruction - System instruction setting the persona & safety guidelines
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<Object|null>} Parsed JSON object or null on failure/timeout
 */
export async function callGeminiAI(promptText, systemInstruction = "", timeoutMs = 5000) {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;
  const apiKey = (rawKey && !rawKey.startsWith('YOUR_') && rawKey.trim().length > 10) ? rawKey.trim() : null;

  if (!apiKey) {
    console.warn('[Gemini AI Provider] No active API key configured in environment. Using safe fallback email generator.');
    return null;
  }

  const postBody = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3, // Lower temperature to avoid hallucination & ensure structured compliance
      maxOutputTokens: 1024
    }
  };

  if (systemInstruction) {
    postBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const postData = JSON.stringify(postBody);

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    let req;

    const timer = setTimeout(() => {
      if (req) {
        req.destroy();
        console.warn(`[Gemini AI Provider] Timeout (${timeoutMs}ms) exceeded. Aborting request.`);
      }
      resolve(null);
    }, timeoutMs);

    req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timer);
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const jsonResult = JSON.parse(textResponse);
              resolve(jsonResult);
              return;
            }
          } else {
            console.warn(`[Gemini AI Provider] API returned status ${res.statusCode}:`, data.slice(0, 200));
          }
        } catch (err) {
          console.warn('[Gemini AI Provider] Parse error:', err.message);
        }
        resolve(null);
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      console.warn('[Gemini AI Provider] Network request error:', err.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}
