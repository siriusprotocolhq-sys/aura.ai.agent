# 🌟 Aura AI - Premium Generative Image & Audio Agent

Aura AI is an agentic, premium web application built to generate stunning images and natural voice narrations from text prompts. It features an integrated **AI Prompt Refinement Co-pilot** (powered by Gemini) and supports multiple generation engines, working completely free and out-of-the-box.

---

## 🌟 Key AI Agent Concepts Demonstrated (Kaggle Capstone)

This project has been developed as the Capstone Project for the **Google/Kaggle 5-Day AI Agents Intensive Course**, demonstrating three core agentic workflows:

1. **Agentic Prompt Refinement (Gemini Integration)**:
   Aura AI uses Google **Gemini 1.5 Flash** as an autonomous prompt engineering agent. When a user inputs a simple prompt and selects a style, the agent expands it into a detailed, visually descriptive prompt (specifying lighting, environment, and artistic parameters) before sending it to the generation engines.
   
2. **Tool & Multi-API Orchestration**:
   The FastAPI backend acts as an orchestrator, routing requests dynamically to various external tool endpoints (e.g., Pollinations.ai for image generation, and Google Text-to-Speech library `gTTS` for multi-lingual audio synthesis), downloading binary buffers, and serving outputs locally.

3. **Client-Side Security & Fail-Safe Guardrails**:
   To prioritize user privacy, sensitive API keys are saved strictly in the client's browser `localStorage` and never stored on the server. If no keys are configured, the agent implements a fallback guardrail to route requests to 100% free public engines.

---

## ✨ Features

- **Futuristic Glassmorphism UI**: A dark cyber-themed interface with smooth micro-animations and glowing indicators.
- **AI Prompt Enhancer**: Refines short prompts into detailed, descriptive ones for better generation quality using Gemini.
- **Dual Creation Modes**: Toggle seamlessly between **Image** and **Voice** (Text to Speech) generation.
- **Multi-Engine Integrations**:
  - **Images**: Pollinations (Free, no token), Hugging Face (FLUX.1-schnell), Replicate (FLUX), and Fal.ai.
  - **Voices**: Google TTS (Free, no token, supports English, Hindi, Spanish, French, German, and Japanese).
- **Secure Browser-based Keys**: API keys are saved locally in the browser's `localStorage` (or server-side `.env` file).
- **Interactive Audio Player**: Preview generated speech with a custom wave visualizer that animates during playback.
- **Automatic Downloads**: Download generated images and audio files directly from the canvas interface.

---

## 🛠️ Local Setup Instructions

Follow these steps to run the application locally on your computer:

### 1. Prerequisites
Make sure you have **Python 3.10+** installed on your system.

### 2. Install Dependencies
Open your terminal/command prompt in the project folder and run:
```bash
pip install -r requirements.txt
```

### 3. Start the Server
Run the FastAPI server using Uvicorn:
```bash
python -m uvicorn main:app --reload
```

### 4. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** in your web browser.

---

## 🚀 How to Deploy on Render.com (Free Hosting)

1. Create a new repository on **GitHub** and upload all these files.
2. Login to **[Render.com](https://render.com/)** using your GitHub account.
3. Click **New +** -> **Web Service** and connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `aura-ai-agent` (or your custom subdomain)
   - **Language**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**. Render will make your app live in a few minutes!
