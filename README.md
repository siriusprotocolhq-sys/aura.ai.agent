# 🌟 Aura AI - Premium Text to Image & Video Workspace

Aura AI is an agentic, premium web application built to generate stunning images and cinematic videos from text prompts. It features an integrated **AI Prompt Enhancer** (powered by Gemini) and supports multiple generation engines like **Pollinations.ai**, **Hugging Face**, **Replicate**, and **Fal.ai**.

---

## ✨ Features

- **Futuristic Glassmorphism UI**: A dark cyber-themed interface with smooth micro-animations and glowing indicators.
- **AI Prompt Enhancer**: Refines short prompts into detailed, descriptive ones for better generation quality.
- **Dual Creation Modes**: Toggle seamlessly between **Image** and **Video** generation.
- **Multi-Engine Integrations**:
  - **Images**: Pollinations (Free, no token), Hugging Face (FLUX.1-schnell), Replicate (FLUX), and Fal.ai.
  - **Videos**: Fal.ai (Kling AI) and Replicate (CogVideoX).
- **Secure Browser-based Keys**: API keys are saved locally in the browser's `localStorage` (or server-side `.env` file).
- **Automatic Downloads**: Download generated images and videos directly from the canvas overlay.

---

## 🛠️ Local Setup Instructions

Follow these steps to run the application locally on your computer:

### 1. Prerequisites
Make sure you have **Python 3.10+** installed on your system.

### 2. Clone/Download the Code
Download all the project files into a folder on your computer.

### 3. Install Dependencies
Open your terminal/command prompt in the project folder and run:
```bash
pip install -r requirements.txt
```

### 4. Setup API Keys (Optional)
Create a file named `.env` in the root folder and add your keys (refer to `.env.example`):
```env
GEMINI_API_KEY=your_key
FAL_KEY=your_key
REPLICATE_API_TOKEN=your_key
HUGGINGFACE_API_KEY=your_key
```
*Note: If you don't add keys here, you can still add them in the UI settings panel!*

### 5. Start the Server
Run the FastAPI server using Uvicorn:
```bash
python -m uvicorn main:app --reload
```

### 6. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** in your web browser.

---

## 🚀 How to Deploy on Render.com (Free Hosting)

1. Create a new repository on **GitHub** and upload all these files (except the `.env` file).
2. Login to **[Render.com](https://render.com/)** using your GitHub account.
3. Click **New +** -> **Web Service** and connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `aura-ai-agent` (or your custom subdomain)
   - **Language**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. *(Optional)* Scroll down to **Environment Variables** and add your API keys there to keep them secure.
6. Click **Deploy Web Service**. Render will make your app live in a few minutes!
