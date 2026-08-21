const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const transcribeAudio = async (audioBuffer) => {
  const tempFilePath = path.join(
    __dirname,
    "../../temp-audio.webm"
  );

  try {
    // Save audio temporarily
    fs.writeFileSync(
      tempFilePath,
      audioBuffer
    );

    // Create multipart form
    const form = new FormData();

    form.append(
      "file",
      fs.createReadStream(tempFilePath),
      {
        filename: "recording.webm",
        contentType: "audio/webm",
      }
    );

    form.append(
      "model",
      "saaras:v3"
    );

    form.append(
      "mode",
      "transcribe"
    );

    // Sarvam API request
    const response = await axios.post(
      "https://api.sarvam.ai/speech-to-text",
      form,
      {
        headers: {
          ...form.getHeaders(),

          "api-subscription-key":
            process.env.SARVAM_API_KEY,
        },

        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log(
      "Sarvam response:",
      response.data
    );

    return response.data.transcript;

  } catch (error) {

    console.error(
      "Sarvam STT Error:",
      error.response?.data ||
      error.message
    );

    throw error;

  } finally {

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

  }
};

module.exports = {
  transcribeAudio,
};