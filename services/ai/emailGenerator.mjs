/**
 * Avinya Care Foundation - AI Email Generation Engine
 * Generates personalized, context-aware user and admin emails using Gemini AI with fallback protection.
 */

import { callGeminiAI } from './aiProvider.mjs';
import { generateFallbackEmails } from './fallbackGenerator.mjs';

const SYSTEM_INSTRUCTION = `You are the email communication assistant for Avinya Care Foundation, an Indian NGO focused on cancer awareness, support, education, care and community impact.

Generate professional, compassionate and trustworthy email content based ONLY on the supplied form data.

STRICT SAFETY AND INTEGRITY RULES:
1. Do NOT invent information under any circumstances (never guess missing names, phone numbers, emails, donation amounts, transaction IDs, locations, hospitals, medical facts, or NGO programs).
2. Do NOT provide medical diagnosis, treatment advice, symptom interpretation, or medication recommendations.
3. Do NOT make promises about response times or specific guarantees.
4. Use natural Indian English with a warm, respectful, professional, human, simple, and compassionate tone. Avoid American corporate jargon.
5. Keep user emails concise (approx 100-250 words) and admin emails operational (approx 100-300 words).
6. If the form contains sensitive patient support details, do NOT repeat sensitive medical text in admin summary; write a safe administrative summary instructing the team to review the submission securely in the dashboard.
7. For donation emails, rely ONLY on the application-supplied payment status (SUCCESS, PENDING, or FAILED). Never infer payment success.

Your response MUST be a valid JSON object matching this exact schema:
{
  "user": {
    "subject": "Brief compelling subject line",
    "greeting": "Greeting with user's name",
    "body": "Personalized compassionate body paragraphs acknowledging submission",
    "closing": "Warm respectful closing"
  },
  "admin": {
    "subject": "Operational summary subject line",
    "summary": "Clear summary of the submission without dumping raw data",
    "recommendedAction": "Suggested next operational step based on context",
    "closing": "Admin closing signoff"
  }
}`;

/**
 * Generates AI emails for a form submission.
 * @param {Object} formData - Validated form input fields
 * @param {string} formType - Form type
 * @param {string} submissionId - Unique submission ID
 * @param {string} timestampIST - Formatted IST timestamp string
 * @returns {Promise<{ user: Object, admin: Object, isAIGenerated: boolean }>} Structured emails
 */
export async function generateFormEmails(formData, formType, submissionId, timestampIST) {
  const formTypeLower = (formType || 'contact').toLowerCase();
  
  // Format supplied input data for the prompt safely
  const cleanedContext = {};
  for (const [key, value] of Object.entries(formData)) {
    if (value !== undefined && value !== null && value !== '' && key !== 'password') {
      cleanedContext[key] = value;
    }
  }

  const promptText = `Form Submission Context:
Form Type: ${formTypeLower}
Submission ID: ${submissionId}
Submitted At (IST): ${timestampIST}
Form Data Supplied:
${JSON.stringify(cleanedContext, null, 2)}

Instructions for Form Type "${formTypeLower}":
- User Email: Acknowledge the ${formTypeLower} submission warmly, thank the individual, address them respectfully using Indian English, and outline general next steps supported by the application.
- Admin Email: Summarize the submission clearly for the Avinya Care team and recommend an appropriate operational next action.

Generate the JSON response now.`;

  try {
    const aiResult = await callGeminiAI(promptText, SYSTEM_INSTRUCTION, 5000);

    if (aiResult && isValidAIResponse(aiResult)) {
      return {
        user: {
          subject: sanitizeText(aiResult.user.subject),
          greeting: sanitizeText(aiResult.user.greeting),
          body: sanitizeText(aiResult.user.body),
          closing: sanitizeText(aiResult.user.closing)
        },
        admin: {
          subject: sanitizeText(aiResult.admin.subject),
          summary: sanitizeText(aiResult.admin.summary),
          recommendedAction: sanitizeText(aiResult.admin.recommendedAction),
          closing: sanitizeText(aiResult.admin.closing)
        },
        isAIGenerated: true
      };
    } else {
      console.warn(`[AI Email Engine] Gemini returned invalid schema for form type "${formTypeLower}". Falling back to predefined template.`);
    }
  } catch (err) {
    console.warn(`[AI Email Engine] Exception during AI generation for "${formTypeLower}":`, err.message);
  }

  // Safe Fallback Generator
  const fallback = generateFallbackEmails(formData, formTypeLower, submissionId, timestampIST);
  return {
    ...fallback,
    isAIGenerated: false
  };
}

/**
 * Validates that AI output contains required JSON properties.
 */
function isValidAIResponse(res) {
  return (
    res &&
    typeof res === 'object' &&
    res.user &&
    typeof res.user.subject === 'string' &&
    typeof res.user.greeting === 'string' &&
    typeof res.user.body === 'string' &&
    typeof res.user.closing === 'string' &&
    res.admin &&
    typeof res.admin.subject === 'string' &&
    typeof res.admin.summary === 'string' &&
    typeof res.admin.recommendedAction === 'string' &&
    typeof res.admin.closing === 'string'
  );
}

/**
 * Basic text sanitizer to clean up unwanted character sequences.
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}
