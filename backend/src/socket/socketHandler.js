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



    let conversation = [
      {
        role: "system",
        content: HEALTH_SYSTEM_PROMPT,
      },
    ];




    let screeningStatus =
      "idle";



    socket.on(
      "start-call",
      () => {

        console.log(
          "📞 Call started:",
          socket.id
        );


        screeningStatus =
          "screening";



        conversation = [
          {
            role: "system",
            content:
              HEALTH_SYSTEM_PROMPT,
          },
        ];



        socket.emit(
          "call-started",
          {
            message:
              "Call started successfully",
          }
        );

      }
    );



    socket.on(
      "audio-data",
      async (audioData) => {

        try {

          console.log(
            "🎤 Audio received"
          );


   
          const audioBuffer =
            Buffer.from(audioData);


          console.log(
            "Audio buffer size:",
            audioBuffer.length,
            "bytes"
          );


        
          const text =
            await transcribeAudio(
              audioBuffer
            );


          console.log(
            "📝 Transcription:",
            text
          );


     
          socket.emit(
            "transcription",
            {
              text,
            }
          );



          conversation.push({
            role: "user",
            content: text,
          });


          console.log(
            "🧠 Conversation updated"
          );


   
          const aiResponse =
            await generateAIResponse(
              conversation
            );


          console.log(
            "🤖 AI:",
            aiResponse
          );


    
          const isScreeningComplete =
            aiResponse
              .trim()
              .startsWith(
                "SCREENING_COMPLETE:"
              );


    
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


    

          conversation.push({
            role: "assistant",
            content:
              cleanAIResponse,
          });


         

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


      

          if (
            isScreeningComplete
          ) {

            screeningStatus =
              "completed";


            console.log(
              "✅ Health screening completed"
            );


     

            socket.emit(
              "screening-completed",
              {
                summary:
                  cleanAIResponse,
              }
            );


       

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


              

                const pdfBase64 =
                  pdfBuffer.toString(
                    "base64"
                  );



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