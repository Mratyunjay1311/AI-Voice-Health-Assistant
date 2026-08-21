import { useRef, useState } from "react";
import socket from "../socket";

function useVoiceRecorder() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const audioChunksRef = useRef([]);

  const silenceTimerRef = useRef(null);
  const hasStartedSpeakingRef = useRef(false);

  const [isRecording, setIsRecording] =
    useState(false);

  // User must remain silent for this long
  // before recording automatically stops.
  const SILENCE_DURATION = 1500;

  // RMS threshold.
  // We will tune this if necessary.
  const SILENCE_THRESHOLD = 0.015;

  // =========================================
  // START RECORDING
  // =========================================

  const startRecording = async () => {
    try {
      console.log("🎙️ Starting microphone...");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      audioChunksRef.current = [];

      hasStartedSpeakingRef.current = false;

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      // =====================================
      // AUDIO DATA
      // =====================================

      mediaRecorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      // =====================================
      // RECORDING START
      // =====================================

      mediaRecorder.onstart = () => {
        console.log(
          "🎙️ Recording started"
        );

        setIsRecording(true);
      };

      // =====================================
      // RECORDING STOP
      // =====================================

      mediaRecorder.onstop = async () => {
        console.log(
          "⏹️ Recording stopped"
        );

        setIsRecording(false);

        // Stop animation frame
        if (
          animationFrameRef.current
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );

          animationFrameRef.current =
            null;
        }

        // Clear silence timer
        if (
          silenceTimerRef.current
        ) {
          clearTimeout(
            silenceTimerRef.current
          );

          silenceTimerRef.current =
            null;
        }

        // =================================
        // CREATE AUDIO BLOB
        // =================================

        const audioBlob =
          new Blob(
            audioChunksRef.current,
            {
              type: "audio/webm",
            }
          );

        console.log(
          "📦 Audio size:",
          audioBlob.size
        );

        // Empty audio protection
        if (audioBlob.size === 0) {
          console.log(
            "⚠️ Empty audio"
          );

          return;
        }

        // =================================
        // BLOB → ARRAY BUFFER
        // =================================

        const arrayBuffer =
          await audioBlob.arrayBuffer();

        console.log(
          "📤 Sending audio to backend..."
        );

        socket.emit(
          "audio-data",
          arrayBuffer
        );

        // =================================
        // STOP MICROPHONE
        // =================================

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          streamRef.current = null;
        }

        // Clear chunks
        audioChunksRef.current = [];
      };

      // =====================================
      // START MEDIA RECORDER
      // =====================================

      mediaRecorder.start();

      // =====================================
      // START SILENCE DETECTION
      // =====================================

      startSilenceDetection(stream);

    } catch (error) {
      console.error(
        "❌ Microphone error:",
        error
      );

      setIsRecording(false);
    }
  };

  // =========================================
  // SILENCE DETECTION
  // =========================================

  const startSilenceDetection = (
    stream
  ) => {
    console.log(
      "👂 Starting silence detection..."
    );

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    const audioContext =
      new AudioContext();

    audioContextRef.current =
      audioContext;

    const analyser =
      audioContext.createAnalyser();

    analyser.fftSize = 2048;

    analyser.smoothingTimeConstant =
      0.8;

    analyserRef.current =
      analyser;

    const microphone =
      audioContext.createMediaStreamSource(
        stream
      );

    microphone.connect(analyser);

    const dataArray =
      new Uint8Array(
        analyser.fftSize
      );

    const detectVolume = () => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current
          .state === "inactive"
      ) {
        return;
      }

      analyser.getByteTimeDomainData(
        dataArray
      );

      // =================================
      // CALCULATE RMS
      // =================================

      let sumSquares = 0;

      for (
        let i = 0;
        i < dataArray.length;
        i++
      ) {
        const normalized =
          (dataArray[i] - 128) /
          128;

        sumSquares +=
          normalized *
          normalized;
      }

      const rms = Math.sqrt(
        sumSquares /
          dataArray.length
      );

      // Debug volume
      console.log(
        "🔊 Volume:",
        rms.toFixed(4)
      );

      // =================================
      // USER IS SPEAKING
      // =================================

      if (
        rms > SILENCE_THRESHOLD
      ) {
        if (
          !hasStartedSpeakingRef.current
        ) {
          console.log(
            "🗣️ User started speaking"
          );
        }

        hasStartedSpeakingRef.current =
          true;

        // User started speaking,
        // cancel pending silence timer.

        if (
          silenceTimerRef.current
        ) {
          clearTimeout(
            silenceTimerRef.current
          );

          silenceTimerRef.current =
            null;

          console.log(
            "❌ Silence timer cancelled"
          );
        }
      }

      // =================================
      // USER IS SILENT
      // =================================

      else if (
        hasStartedSpeakingRef.current
      ) {
        if (
          !silenceTimerRef.current
        ) {
          console.log(
            "🤫 Silence detected..."
          );

          silenceTimerRef.current =
            setTimeout(() => {
              console.log(
                "⏱️ 1.5 sec silence reached"
              );

              stopRecording();
            }, SILENCE_DURATION);
        }
      }

      animationFrameRef.current =
        requestAnimationFrame(
          detectVolume
        );
    };

    detectVolume();
  };

  // =========================================
  // STOP RECORDING
  // =========================================

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      console.log(
        "🛑 Stopping recorder..."
      );

      recorder.stop();
    }
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
  };
}

export default useVoiceRecorder;