const {
  transcribeAudio,
} = require("../services/speech.service");

const {
  generateAIResponse,
} = require("../services/ai.service");

const {
  HEALTH_SYSTEM_PROMPT,
} = require("../services/healthPrompt");

const {
  generateSpeech,
} = require("../services/tts.service");

const {
  generateHealthReport,
} = require("../services/report.service");

const {
  generateHealthReportPDF,
} = require("../services/pdf.service");


function socketHandler(io) {

  io.on("connection", (socket) => {

    console.log(
      "🟢 User connected:",
      socket.id
    );


    // =========================================
    // CONVERSATION MEMORY
    // =========================================

    let conversation = [
      {
        role: "system",
        content: HEALTH_SYSTEM_PROMPT,
      },
    ];


    // =========================================
    // SCREENING STATUS
    // =========================================

    let screeningStatus =
      "idle";


    // =========================================
    // START CALL
    // =========================================

    socket.on(
      "start-call",
      () => {

        console.log(
          "📞 Call started:",
          socket.id
        );


        // Reset screening

        screeningStatus =
          "screening";


        // Reset conversation

        conversation = [
          {
            role: "system",
            content:
              HEALTH_SYSTEM_PROMPT,
          },
        ];


        // Tell frontend

        socket.emit(
          "call-started",
          {
            message:
              "Call started successfully",
          }
        );

      }
    );


    // =========================================
    // AUDIO RECEIVED
    // =========================================

    socket.on(
      "audio-data",
      async (audioData) => {

        try {

          console.log(
            "🎤 Audio received"
          );


          // =====================================
          // 1. AUDIO → BUFFER
          // =====================================

          const audioBuffer =
            Buffer.from(audioData);


          console.log(
            "Audio buffer size:",
            audioBuffer.length,
            "bytes"
          );


          // =====================================
          // 2. AUDIO → TEXT
          // =====================================

          const text =
            await transcribeAudio(
              audioBuffer
            );


          console.log(
            "📝 Transcription:",
            text
          );


          // =====================================
          // 3. SEND USER TEXT TO FRONTEND
          // =====================================

          socket.emit(
            "transcription",
            {
              text,
            }
          );


          // =====================================
          // 4. SAVE USER MESSAGE
          // =====================================

          conversation.push({
            role: "user",
            content: text,
          });


          console.log(
            "🧠 Conversation updated"
          );


          // =====================================
          // 5. GENERATE AI RESPONSE
          // =====================================

          const aiResponse =
            await generateAIResponse(
              conversation
            );


          console.log(
            "🤖 AI:",
            aiResponse
          );


          // =====================================
          // 6. CHECK SCREENING COMPLETION
          // =====================================

          const isScreeningComplete =
            aiResponse
              .trim()
              .startsWith(
                "SCREENING_COMPLETE:"
              );


          // =====================================
          // 7. CLEAN AI RESPONSE
          // =====================================

          let cleanAIResponse =
            aiResponse;


          if (
            isScreeningComplete
          ) {

            cleanAIResponse =
              aiResponse
                .replace(
                  "SCREENING_COMPLETE:",
                  ""
                )
                .trim();

          }


          // =====================================
          // 8. SAVE AI MESSAGE
          // =====================================

          conversation.push({
            role: "assistant",
            content:
              cleanAIResponse,
          });


          // =====================================
          // 9. SEND AI TEXT
          // =====================================

          socket.emit(
            "ai-response",
            {
              text:
                cleanAIResponse,
            }
          );


          console.log(
            "📤 AI text sent to frontend"
          );


          // =====================================
          // 10. SCREENING COMPLETED
          // =====================================

          if (
            isScreeningComplete
          ) {

            screeningStatus =
              "completed";


            console.log(
              "✅ Health screening completed"
            );


            // -----------------------------------
            // Send completion event
            // -----------------------------------

            socket.emit(
              "screening-completed",
              {
                summary:
                  cleanAIResponse,
              }
            );


            // ===================================
            // 11. GENERATE HEALTH REPORT
            // ===================================

            try {

              console.log(
                "📋 Generating health report..."
              );


              const healthReport =
                await generateHealthReport(
                  conversation
                );


              console.log(
                "✅ Health report generated"
              );


              // ---------------------------------
              // Send JSON report to frontend
              // ---------------------------------

              socket.emit(
                "health-report",
                {
                  report:
                    healthReport,
                }
              );


              console.log(
                "📤 Health report sent to frontend"
              );


              // =================================
              // 12. GENERATE PDF
              // =================================

              try {

                console.log(
                  "📄 Generating PDF..."
                );


                const pdfBuffer =
                  await generateHealthReportPDF(
                    healthReport
                  );


                if (
                  !pdfBuffer ||
                  !Buffer.isBuffer(
                    pdfBuffer
                  )
                ) {

                  throw new Error(
                    "PDF service did not return a valid Buffer"
                  );

                }


                console.log(
                  "✅ PDF generated successfully"
                );


                console.log(
                  "PDF size:",
                  pdfBuffer.length,
                  "bytes"
                );


                // -------------------------------
                // BUFFER → BASE64
                // -------------------------------

                const pdfBase64 =
                  pdfBuffer.toString(
                    "base64"
                  );


                // -------------------------------
                // SEND PDF TO FRONTEND
                // -------------------------------

                socket.emit(
                  "health-report-pdf",
                  {
                    pdf:
                      pdfBase64,

                    filename:
                      "AI-Health-Screening-Report.pdf",
                  }
                );


                console.log(
                  "📤 PDF sent to frontend"
                );


              } catch (
                pdfError
              ) {

                console.error(
                  "❌ PDF generation failed:",
                  pdfError.response?.data ||
                  pdfError.message ||
                  pdfError
                );


                socket.emit(
                  "pdf-error",
                  {
                    message:
                      "Could not generate PDF report",
                  }
                );

              }


            } catch (
              reportError
            ) {

              console.error(
                "❌ HEALTH REPORT ERROR:",
                reportError.response?.data ||
                reportError.message ||
                reportError
              );


              socket.emit(
                "report-error",
                {
                  message:
                    "Health report could not be generated",
                }
              );

            }

          }


          // =====================================
          // 13. AI TEXT → SPEECH
          // =====================================

          console.log(
            "🔊 Generating AI speech..."
          );


          const audioBase64 =
            await generateSpeech(
              cleanAIResponse
            );


          console.log(
            "✅ AI speech generated"
          );


          console.log(
            "Audio length:",
            audioBase64.length
          );


          // =====================================
          // 14. SEND AI AUDIO
          // =====================================

          socket.emit(
            "ai-audio",
            {
              audio:
                audioBase64,
            }
          );


          console.log(
            "📤 AI audio sent to frontend"
          );


        } catch (
          error
        ) {

          console.error(
            "❌ Conversation Error:",
            error.response?.data ||
            error.message ||
            error
          );


          socket.emit(
            "stt-error",
            {
              message:
                "Could not process your message",
            }
          );

        }

      }
    );


    // =========================================
    // END CALL
    // =========================================

    socket.on(
      "end-call",
      () => {

        console.log(
          "📞 Call ended:",
          socket.id
        );


        screeningStatus =
          "completed";


        socket.emit(
          "call-ended",
          {
            message:
              "Call ended successfully",
          }
        );

      }
    );


    // =========================================
    // DISCONNECT
    // =========================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "🔴 User disconnected:",
          socket.id
        );

      }
    );

  });

}


module.exports =
  socketHandler;