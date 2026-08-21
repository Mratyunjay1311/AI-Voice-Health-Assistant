# 🩺 AI Voice Health Assistant

> A real-time, voice-powered AI health screening assistant that allows users to have a natural conversation with an AI agent, receive AI-generated voice responses, and get a structured health screening report with a downloadable PDF.

<p align="center">

![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-STT%20%7C%20LLM%20%7C%20TTS-orange?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</p>

---

## 🌐 Live Demo

🚀 **Live Application:**  
https://ai-voice-health-assistant.netlify.app

💻 **GitHub Repository:**  
https://github.com/Mratyunjay1311/AI-Voice-Health-Assistant

🎥 **Demo Video:**  
_Paste your Google Drive / OneDrive video link here_

---

# 📌 About The Project

**AI Voice Health Assistant** is a full-stack conversational AI application built to demonstrate a real-time voice-based health screening experience.

Instead of filling out a traditional medical form, the user can simply speak with the AI assistant.

The application captures the user's voice, converts it into text, sends the conversation to an AI model, maintains conversation context, generates a response, converts that response into speech, and plays the AI response back to the user.

Once the screening is complete, the application generates a structured health report and converts it into a downloadable PDF.

---

# ✨ Features

### 🎙️ Voice-Based Interaction

Users can speak naturally with the AI health assistant using their microphone.

### 📝 Speech-to-Text

User speech is converted into text using **Sarvam AI Speech-to-Text**.

### 🧠 Conversational AI

The AI understands the conversation context and asks relevant follow-up questions instead of following a fixed questionnaire.

### 💬 Conversation Memory

The backend maintains the conversation history throughout the screening session so the AI can use previous answers when generating its next response.

### 🔊 AI Voice Response

AI-generated responses are converted into natural speech using **Sarvam AI Text-to-Speech**.

### ⚡ Real-Time Communication

The frontend and backend communicate using **Socket.IO** for real-time voice and conversation events.

### 🔄 Automatic Conversation Loop

After the AI finishes speaking, the application automatically starts listening for the user's next response.

### 📋 Health Screening Report

After completing the screening, the application generates a structured report containing:

- Main concern
- Duration
- Severity
- Symptoms
- Medical history
- Medications
- Risk factors
- Red flags
- Conversation summary
- Recommendations

### 📄 PDF Report

The generated health report can be converted into a downloadable PDF.

### 📱 Responsive UI

The interface is designed to work across desktop and mobile screen sizes.

### 🔐 Secure API Architecture

AI API keys remain on the backend and are stored using environment variables.

---

# 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │       USER          │
                         │  Microphone + UI    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │  Vite + Tailwind    │
                         └──────────┬──────────┘
                                    │
                               Socket.IO
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js Backend   │
                         │      Express        │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
        ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
        │  Sarvam STT│      │  Sarvam LLM │      │  Sarvam TTS │
        │   Speech   │      │     AI      │      │    Voice    │
        └─────────────┘      └─────────────┘      └─────────────┘
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Conversation Memory │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Health Report     │
                         │      Generator      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    PDF Generator    │
                         └─────────────────────┘



                         🔄 How It Works


                         User starts screening
        ↓
Microphone starts recording
        ↓
User speaks
        ↓
Audio sent through Socket.IO
        ↓
Backend receives audio
        ↓
Sarvam Speech-to-Text
        ↓
Transcribed text
        ↓
Conversation memory updated
        ↓
Sarvam AI generates response
        ↓
AI response displayed in UI
        ↓
Sarvam Text-to-Speech
        ↓
AI voice sent to frontend
        ↓
AI voice plays
        ↓
Recording starts again
        ↓
Next user response
        ↓
...
        ↓
Screening completed
        ↓
Health report generated
        ↓
PDF generated
        ↓
PDF downloaded


🛠️ Tech Stack
Frontend
React
Vite
JavaScript
Tailwind CSS
Socket.IO Client
Web APIs / MediaRecorder
Backend
Node.js
Express.js
Socket.IO
Axios
PDF generation
Environment variables
AI & Voice
Sarvam AI Speech-to-Text
Sarvam AI LLM
Sarvam AI Text-to-Speech
Deployment
GitHub
Netlify
Render
