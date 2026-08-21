import {
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../socket";
import useVoiceRecorder from "../hooks/useVoiceRecorder";

function Home() {
  const [connected, setConnected] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [screeningCompleted, setScreeningCompleted] = useState(false);

  const [messages, setMessages] = useState([]);
  const [healthReport, setHealthReport] = useState(null);

  const [pdfData, setPdfData] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const callStartedRef = useRef(false);
  const messagesEndRef = useRef(null);

  const {
    startRecording,
    stopRecording,
    isRecording,
  } = useVoiceRecorder();

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  

  useEffect(() => {
    const handleConnect = () => {
      console.log("🟢 Connected to server");
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Disconnected from server");
      setConnected(false);
    };

    const handleCallStarted = (data) => {
      console.log("📞", data.message);
    };

    const handleTranscription = (data) => {
      console.log("👤 USER:", data.text);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: data.text,
        },
      ]);
    };

    const handleAIResponse = (data) => {
      console.log("🤖 AI:", data.text);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text,
        },
      ]);
    };

    const handleAIAudio = async (data) => {
      console.log("🔊 AI audio received");

      if (!data.audio) {
        console.error("❌ No AI audio received");
        return;
      }

      try {
        setIsAiSpeaking(true);

        const audio = new Audio(
          `data:audio/wav;base64,${data.audio}`
        );

        audio.onended = async () => {
          console.log("🔊 AI finished speaking");

          setIsAiSpeaking(false);

          if (
            callStartedRef.current &&
            !screeningCompleted
          ) {
            try {
              await startRecording();
            } catch (error) {
              console.error(
                "❌ Could not start recording:",
                error
              );
            }
          }
        };

        audio.onerror = (error) => {
          console.error(
            "❌ Audio playback error:",
            error
          );

          setIsAiSpeaking(false);
        };

        await audio.play();
      } catch (error) {
        console.error(
          "❌ Could not play AI audio:",
          error
        );

        setIsAiSpeaking(false);
      }
    };

    const handleScreeningCompleted = (data) => {
      console.log(
        "✅ Screening completed:",
        data.summary
      );

      setScreeningCompleted(true);
      setIsAiSpeaking(false);
    };

    const handleHealthReport = (data) => {
      console.log(
        "📋 Health report received:",
        data.report
      );

      setHealthReport(data.report);
      setPdfGenerating(true);
    };

    const handleHealthReportPDF = (data) => {
      console.log("📄 PDF received");

      if (!data.pdf) {
        setPdfGenerating(false);
        return;
      }

      setPdfData({
        pdf: data.pdf,
        filename:
          data.filename ||
          "AI-Health-Screening-Report.pdf",
      });

      setPdfGenerating(false);
    };

    const handleReportError = (data) => {
      console.error(
        "❌ Report error:",
        data.message
      );

      setPdfGenerating(false);
    };

    const handlePDFError = (data) => {
      console.error(
        "❌ PDF error:",
        data.message
      );

      setPdfGenerating(false);
    };

    const handleSTTError = (data) => {
      console.error(
        "❌ Conversation error:",
        data.message
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("call-started", handleCallStarted);
    socket.on("transcription", handleTranscription);
    socket.on("ai-response", handleAIResponse);
    socket.on("ai-audio", handleAIAudio);
    socket.on(
      "screening-completed",
      handleScreeningCompleted
    );
    socket.on(
      "health-report",
      handleHealthReport
    );
    socket.on(
      "health-report-pdf",
      handleHealthReportPDF
    );
    socket.on(
      "report-error",
      handleReportError
    );
    socket.on(
      "pdf-error",
      handlePDFError
    );
    socket.on(
      "stt-error",
      handleSTTError
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "call-started",
        handleCallStarted
      );
      socket.off(
        "transcription",
        handleTranscription
      );
      socket.off(
        "ai-response",
        handleAIResponse
      );
      socket.off(
        "ai-audio",
        handleAIAudio
      );
      socket.off(
        "screening-completed",
        handleScreeningCompleted
      );
      socket.off(
        "health-report",
        handleHealthReport
      );
      socket.off(
        "health-report-pdf",
        handleHealthReportPDF
      );
      socket.off(
        "report-error",
        handleReportError
      );
      socket.off(
        "pdf-error",
        handlePDFError
      );
      socket.off(
        "stt-error",
        handleSTTError
      );
    };
  }, [startRecording, screeningCompleted]);



  const startCall = async () => {
    console.log("📞 Starting call...");

    setMessages([]);
    setHealthReport(null);
    setPdfData(null);
    setPdfGenerating(false);
    setScreeningCompleted(false);
    setIsAiSpeaking(false);

    callStartedRef.current = true;

    socket.emit("start-call");
    setCallStarted(true);

    try {
      await startRecording();
    } catch (error) {
      console.error(
        "❌ Could not start recording:",
        error
      );

      callStartedRef.current = false;
      setCallStarted(false);
    }
  };



  const endCall = () => {
    console.log("📞 Ending call...");

    callStartedRef.current = false;

    socket.emit("end-call");

    stopRecording();

    setIsAiSpeaking(false);
    setCallStarted(false);
  };

  

  const downloadPDF = () => {
    if (!pdfData?.pdf) {
      console.error("❌ PDF unavailable");
      return;
    }

    try {
      const byteCharacters = atob(pdfData.pdf);
      const byteNumbers = new Array(
        byteCharacters.length
      );

      for (
        let i = 0;
        i < byteCharacters.length;
        i++
      ) {
        byteNumbers[i] =
          byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(
        byteNumbers
      );

      const blob = new Blob([byteArray], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download =
        pdfData.filename ||
        "AI-Health-Screening-Report.pdf";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "❌ PDF download failed:",
        error
      );
    }
  };



  const startNewScreening = () => {
    setMessages([]);
    setHealthReport(null);
    setPdfData(null);
    setPdfGenerating(false);
    setScreeningCompleted(false);
    setIsAiSpeaking(false);
  };



  const getStatusText = () => {
    if (!callStarted) {
      return "Ready to listen";
    }

    if (isAiSpeaking) {
      return "AI is speaking";
    }

    if (isRecording) {
      return "Listening to you";
    }

    return "Processing";
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7faff] text-slate-900">

     

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-200/30 blur-3xl" />

        <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-100/30 blur-3xl" />

      </div>


     

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="relative">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl shadow-lg shadow-blue-200">
                🩺
              </div>

              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />

            </div>

            <div>

              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                AI Health Assistant
              </h1>

              <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                Intelligent voice health screening
              </p>

            </div>

          </div>


          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 ${
              connected
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >

            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />

            <span
              className={`hidden text-xs font-bold sm:block ${
                connected
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {connected
                ? "System Online"
                : "Offline"}
            </span>

          </div>

        </div>

      </header>


   

      {!messages.length && !healthReport && (

        <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 lg:px-8 lg:pb-16 lg:pt-20">

          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* LEFT */}

            <div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                AI-powered health screening
              </div>


              <h2 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">

                Your health.

                <br />

                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Your voice.
                </span>

                <br />

                Smarter screening.

              </h2>


              <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">

                Talk naturally about how you're feeling.
                Our AI listens, asks relevant questions,
                understands your responses and creates a
                structured preliminary health report.

              </p>


              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <button
                  onClick={startCall}
                  disabled={!connected}
                  className="group rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <span className="flex items-center justify-center gap-2">

                    <span className="text-lg transition-transform group-hover:scale-110">
                      🎙️
                    </span>

                    Start Screening

                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>

                  </span>

                </button>


                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-500 shadow-sm">

                  <span>🔒</span>
                  Voice-first experience

                </div>

              </div>


              {/* TRUST POINTS */}

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-400">

                <span>✓ Natural conversation</span>
                <span>✓ AI-powered analysis</span>
                <span>✓ PDF report</span>

              </div>

            </div>


            {/* RIGHT VISUAL */}

            <div className="relative flex min-h-[390px] items-center justify-center">

              {/* glow */}

              <div className="absolute h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />


              {/* orbit */}

              <div className="absolute h-72 w-72 rounded-full border border-blue-200/70 sm:h-80 sm:w-80" />

              <div className="absolute h-56 w-56 rounded-full border border-indigo-200/60 sm:h-64 sm:w-64" />


              {/* main orb */}

              <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 shadow-2xl shadow-indigo-300 sm:h-60 sm:w-60">

                <div className="absolute inset-5 rounded-full border border-white/20" />

                <div className="absolute inset-10 rounded-full bg-white/10 backdrop-blur-sm" />

                <span className="relative text-7xl">
                  🩺
                </span>

              </div>


              {/* floating cards */}

              <div className="absolute left-0 top-12 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-xl backdrop-blur">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Voice
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  🎙️ Listening
                </p>

              </div>


              <div className="absolute bottom-12 right-0 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-xl backdrop-blur">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Intelligence
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  🧠 AI Analysis
                </p>

              </div>

            </div>

          </div>


          {/* FEATURE CARDS */}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">

            <FeatureCard
              icon="🎙️"
              title="Speak naturally"
              text="No forms or typing. Just explain what you're experiencing."
            />

            <FeatureCard
              icon="🧠"
              title="Smart screening"
              text="The assistant asks relevant follow-up questions."
            />

            <FeatureCard
              icon="📄"
              title="Get a report"
              text="Receive a structured screening summary as a PDF."
            />

          </div>

        </section>

      )}


      {callStarted && (

        <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
                Live session
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                Health screening in progress
              </h2>

            </div>

            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">

              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

              {getStatusText()}

            </div>

          </div>


          <div className="grid gap-6 lg:grid-cols-[350px_1fr]">

            {/* CALL PANEL */}

            <div className="h-fit rounded-[30px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">

              <div className="flex flex-col items-center text-center">

                <VoiceOrb
                  isRecording={isRecording}
                  isAiSpeaking={isAiSpeaking}
                />

                <h3 className="mt-7 text-xl font-black">
                  {getStatusText()}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isAiSpeaking
                    ? "Listen to the assistant. Your microphone will activate when it finishes."
                    : isRecording
                    ? "Tell me about your symptoms or concerns."
                    : "Processing your response..."}
                </p>


                <button
                  onClick={endCall}
                  className="mt-7 w-full rounded-2xl bg-red-500 py-4 font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-600"
                >
                  📞 End Screening
                </button>


                <div className="mt-5 grid w-full grid-cols-2 gap-3">

                  <StatusCard
                    icon="🎙️"
                    title="Microphone"
                    active={isRecording}
                  />

                  <StatusCard
                    icon="🔊"
                    title="AI Voice"
                    active={isAiSpeaking}
                  />

                </div>

              </div>

            </div>


            {/* CHAT */}

            <div className="min-w-0 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                <div>

                  <h3 className="font-black text-slate-900">
                    Conversation
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Live transcription and AI responses
                  </p>

                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                  {messages.length} messages
                </div>

              </div>


              <div className="max-h-[580px] min-h-[400px] overflow-y-auto bg-gradient-to-b from-white to-slate-50/80 p-5 sm:p-7">

                {messages.map(
                  (message, index) => {

                    const isUser =
                      message.role === "user";

                    return (
                      <div
                        key={index}
                        className={`mb-5 flex ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-[88%] rounded-2xl px-5 py-4 shadow-sm ${
                            isUser
                              ? "rounded-br-sm bg-slate-900 text-white"
                              : "rounded-bl-sm border border-blue-100 bg-blue-50 text-slate-900"
                          }`}
                        >

                          <div className="mb-2 flex items-center gap-2">

                            <span className="text-sm">
                              {isUser
                                ? "👤"
                                : "🩺"}
                            </span>

                            <span
                              className={`text-[11px] font-bold ${
                                isUser
                                  ? "text-slate-300"
                                  : "text-blue-600"
                              }`}
                            >
                              {isUser
                                ? "You"
                                : "AI Health Assistant"}
                            </span>

                          </div>

                          <p className="text-sm leading-7 sm:text-base">
                            {message.text}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

                <div ref={messagesEndRef} />

              </div>

            </div>

          </div>

        </section>

      )}


      {screeningCompleted && healthReport && (

        <section className="mx-auto max-w-5xl px-5 py-10 lg:px-8">

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
              ✅
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Screening complete
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Your health screening report
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Here's a structured summary generated from
              your conversation with the AI assistant.
            </p>

          </div>


          {/* REPORT */}

          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">

            {/* report hero */}

            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-8 text-white sm:px-9">

              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  📋
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-widest text-blue-100">
                    AI screening result
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Health Assessment
                  </h3>

                </div>

              </div>

            </div>


            <div className="p-6 sm:p-9">

              {/* stats */}

              <div className="grid gap-4 sm:grid-cols-3">

                <ReportStat
                  label="Main concern"
                  value={
                    healthReport.mainConcern ||
                    "Not reported"
                  }
                  style="blue"
                />

                <ReportStat
                  label="Duration"
                  value={
                    healthReport.duration ||
                    "Not reported"
                  }
                  style="violet"
                />

                <ReportStat
                  label="Severity"
                  value={
                    healthReport.severity ||
                    "Not reported"
                  }
                  style="orange"
                />

              </div>


              {/* symptoms */}

              <div className="mt-8">

                <SectionTitle>
                  🩺 Symptoms reported
                </SectionTitle>

                <div className="mt-4 flex flex-wrap gap-2">

                  {Array.isArray(
                    healthReport.symptoms
                  ) &&
                  healthReport.symptoms.length ? (
                    healthReport.symptoms.map(
                      (symptom, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          {symptom}
                        </span>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-400">
                      No symptoms reported.
                    </p>
                  )}

                </div>

              </div>


              {/* details */}

              <div className="mt-8 grid gap-4 md:grid-cols-2">

                <ReportBox
                  icon="🧬"
                  title="Medical History"
                  text={
                    healthReport.medicalHistory ||
                    "Not reported"
                  }
                />

                <ReportBox
                  icon="💊"
                  title="Medications"
                  text={
                    healthReport.medications ||
                    "Not reported"
                  }
                />

                <ReportBox
                  icon="⚠️"
                  title="Risk Factors"
                  text={
                    healthReport.riskFactors ||
                    "Not reported"
                  }
                />

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

                  <h4 className="font-bold text-red-900">
                    🚨 Red Flags
                  </h4>

                  {Array.isArray(
                    healthReport.redFlags
                  ) &&
                  healthReport.redFlags.length ? (
                    <ul className="mt-3 space-y-2">
                      {healthReport.redFlags.map(
                        (flag, index) => (
                          <li
                            key={index}
                            className="text-sm leading-6 text-red-700"
                          >
                            • {flag}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      No red-flag symptoms were reported.
                    </p>
                  )}

                </div>

              </div>


              {/* summary */}

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">

                <SectionTitle>
                  📝 Conversation summary
                </SectionTitle>

                <p className="mt-3 text-sm leading-7 text-blue-900/75">
                  {healthReport.conversationSummary ||
                    "Not available."}
                </p>

              </div>


              {/* recommendations */}

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

                <SectionTitle>
                  💡 General next steps
                </SectionTitle>

                <p className="mt-3 text-sm leading-7 text-emerald-900/75">
                  {healthReport.recommendations ||
                    "Not available."}
                </p>

              </div>


              {/* disclaimer */}

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <p className="text-xs leading-6 text-amber-800">

                  <strong>⚠️ Important:</strong>{" "}
                  This report is for preliminary screening
                  and informational purposes only. It is
                  not a medical diagnosis and should not
                  replace professional medical advice.

                </p>

              </div>


          

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

                {pdfGenerating ? (

                  <button
                    disabled
                    className="rounded-2xl bg-slate-100 px-7 py-4 font-bold text-slate-400"
                  >
                    ⏳ Preparing PDF...
                  </button>

                ) : pdfData ? (

                  <button
                    onClick={downloadPDF}
                    className="group rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:shadow-2xl"
                  >

                    <span className="flex items-center justify-center gap-2">

                      📄 Download PDF

                      <span className="transition-transform group-hover:translate-y-0.5">
                        ↓
                      </span>

                    </span>

                  </button>

                ) : (

                  <span className="py-4 text-center text-sm text-slate-400">
                    Preparing report PDF...
                  </span>

                )}


                <button
                  onClick={startNewScreening}
                  className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  🔄 Start New Screening
                </button>

              </div>

            </div>

          </div>

        </section>

      )}


    

      {!callStarted &&
        !healthReport && (

          <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">

            <div className="mb-7 text-center">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
                Simple process
              </p>

              <h3 className="mt-2 text-2xl font-black">
                How it works
              </h3>

            </div>


            <div className="grid gap-4 md:grid-cols-3">

              <StepCard
                number="01"
                icon="🎙️"
                title="Start talking"
                text="Start a voice screening and describe what you're experiencing."
              />

              <StepCard
                number="02"
                icon="🧠"
                title="Answer questions"
                text="The AI asks relevant follow-up questions based on your responses."
              />

              <StepCard
                number="03"
                icon="📄"
                title="Get your report"
                text="Receive a structured preliminary report and downloadable PDF."
              />

            </div>

          </section>

        )}



      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 text-center lg:px-8">

          <div className="flex items-center justify-center gap-2">

            <span className="text-lg">
              🩺
            </span>

            <span className="font-bold text-slate-700">
              AI Health Assistant
            </span>

          </div>

          <p className="mt-2 text-xs text-slate-400">
            Preliminary screening only • Not a medical diagnosis
          </p>

        </div>

      </footer>

    </div>
  );
}




function VoiceOrb({
  isRecording,
  isAiSpeaking,
}) {
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">

      {(isRecording || isAiSpeaking) && (
        <>
          <div
            className={`absolute inset-8 animate-ping rounded-full opacity-30 ${
              isAiSpeaking
                ? "bg-emerald-400"
                : "bg-blue-500"
            }`}
          />

          <div
            className={`absolute inset-4 rounded-full border-2 border-dashed ${
              isAiSpeaking
                ? "border-emerald-300"
                : "border-blue-300"
            } animate-[spin_8s_linear_infinite]`}
          />
        </>
      )}

      <div
        className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500 ${
          isAiSpeaking
            ? "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-200"
            : isRecording
            ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-200"
            : "bg-gradient-to-br from-slate-100 to-slate-200"
        }`}
      >
        <span className="text-5xl">
          {isAiSpeaking
            ? "🔊"
            : isRecording
            ? "🎙️"
            : "🩺"}
        </span>
      </div>

    </div>
  );
}


function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl transition group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}


function StatusCard({
  icon,
  title,
  active,
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <div className="text-lg">
        {icon}
      </div>

      <p className="mt-1 text-[11px] font-bold text-slate-500">
        {active
          ? `Active ${title}`
          : title}
      </p>
    </div>
  );
}


function ReportStat({
  label,
  value,
  style,
}) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    violet:
      "border-violet-100 bg-violet-50 text-violet-600",
    orange:
      "border-orange-100 bg-orange-50 text-orange-600",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[style]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </p>

      <p className="mt-2 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}


function ReportBox({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <h4 className="font-bold text-slate-900">
        {icon} {title}
      </h4>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {text}
      </p>

    </div>
  );
}


function SectionTitle({
  children,
}) {
  return (
    <h4 className="font-bold text-slate-900">
      {children}
    </h4>
  );
}


function StepCard({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-xl">
          {icon}
        </div>

        <span className="text-3xl font-black text-slate-100">
          {number}
        </span>

      </div>

      <h4 className="mt-5 font-bold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}


export default Home;