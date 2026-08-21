const {
  generateAIReport,
} = require("./ai.service");


async function generateHealthReport(
  conversation
) {

  const reportPrompt = `
Generate a COMPLETE preliminary health screening report
from the conversation below.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT use code fences.
- Complete every field.
- Do NOT stop before the JSON is complete.
- Keep every value concise.
- Do NOT invent information.
- If information is missing, use "Not reported".
- This is NOT a medical diagnosis.

Return EXACTLY this structure:

{
  "mainConcern": "",
  "duration": "",
  "severity": "",
  "symptoms": [],
  "medicalHistory": "",
  "medications": "",
  "riskFactors": "",
  "redFlags": [],
  "conversationSummary": "",
  "recommendations": ""
}

Rules:

mainConcern:
The main problem reported by the user.

duration:
How long the problem has existed.

severity:
Severity reported by the user.

symptoms:
Only symptoms explicitly mentioned.

medicalHistory:
Relevant medical history explicitly mentioned.

medications:
Medications explicitly mentioned.

riskFactors:
Relevant risk factors explicitly mentioned.

redFlags:
Emergency or warning symptoms explicitly mentioned.

conversationSummary:
Maximum 2 concise sentences.

recommendations:
Maximum 2 concise sentences.
Do not prescribe medicines or dosages.

If something was not mentioned:
use "Not reported".

CONVERSATION:

${conversation
  .filter(
    (message) =>
      message.role !== "system"
  )
  .map(
    (message) =>
      `${message.role.toUpperCase()}: ${message.content}`
  )
  .join("\n")}
`;


  const response =
    await generateAIReport([
      {
        role: "system",
        content: reportPrompt,
      },
    ]);


  console.log(
    "📋 Raw report response:",
    response
  );


  // =========================================
  // CLEAN RESPONSE
  // =========================================

  let cleaned =
    response
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();


  // =========================================
  // PARSE JSON
  // =========================================

  try {

    const report =
      JSON.parse(cleaned);


    console.log(
      "✅ Report JSON parsed successfully"
    );


    return report;

  } catch (error) {

    console.error(
      "❌ Report JSON parsing failed:"
    );

    console.error(
      cleaned
    );

    throw new Error(
      "Could not generate health report"
    );
  }
}


module.exports = {
  generateHealthReport,
};