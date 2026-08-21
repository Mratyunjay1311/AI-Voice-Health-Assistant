const axios = require("axios");


// ============================================
// NORMAL AI CONVERSATION
// ============================================

const generateAIResponse = async (messages) => {

  try {

    if (!process.env.SARVAM_API_KEY) {
      throw new Error(
        "SARVAM_API_KEY is missing"
      );
    }


    const response = await axios.post(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        model:
          "sarvam-105b-conversations",

        messages,

        temperature: 0.4,

        // Short responses for voice conversation
        max_tokens: 200,
      },
      {
        headers: {
          "api-subscription-key":
            process.env.SARVAM_API_KEY,

          "Content-Type":
            "application/json",
        },
      }
    );


    console.log(
      "AI Response:",
      response.data
    );


    return response.data
      .choices[0]
      .message
      .content;


  } catch (error) {

    console.error(
      "AI Error:",
      error.response?.data ||
      error.message
    );

    throw error;
  }
};


// ============================================
// HEALTH REPORT GENERATION
// ============================================

const generateAIReport = async (messages) => {

  try {

    if (!process.env.SARVAM_API_KEY) {
      throw new Error(
        "SARVAM_API_KEY is missing"
      );
    }


    const response = await axios.post(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        model:
          "sarvam-105b-conversations",

        messages,

        temperature: 0.2,

        // More tokens for complete JSON report
        max_tokens: 800,
      },
      {
        headers: {
          "api-subscription-key":
            process.env.SARVAM_API_KEY,

          "Content-Type":
            "application/json",
        },
      }
    );


    console.log(
      "Health Report AI Response:",
      response.data
    );


    return response.data
      .choices[0]
      .message
      .content;


  } catch (error) {

    console.error(
      "Health Report AI Error:",
      error.response?.data ||
      error.message
    );

    throw error;
  }
};


module.exports = {
  generateAIResponse,
  generateAIReport,
};