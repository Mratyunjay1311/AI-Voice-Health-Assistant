const axios = require("axios");

const generateSpeech = async (text) => {
  try {
    if (!process.env.SARVAM_API_KEY) {
      throw new Error(
        "SARVAM_API_KEY is missing"
      );
    }

    const response = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text: text,
        target_language_code: "en-IN",
        model: "bulbul:v3",
        speaker: "shubh",
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
      "✅ TTS API successful"
    );

    console.log(
      "Number of audio outputs:",
      response.data.audios?.length
    );

    if (
      !response.data.audios ||
      !response.data.audios[0]
    ) {
      throw new Error(
        "Sarvam did not return audio"
      );
    }

    return response.data.audios[0];

  } catch (error) {

    console.error(
      "❌ TTS Error:",
      error.response?.data ||
      error.message
    );

    throw error;
  }
};

module.exports = {
  generateSpeech,
};