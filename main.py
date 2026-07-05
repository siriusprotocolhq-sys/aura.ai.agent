import os
import uuid
import urllib.parse
import requests
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import API clients
try:
    from huggingface_hub import InferenceClient
except ImportError:
    InferenceClient = None

try:
    import replicate
except ImportError:
    replicate = None

try:
    import fal_client
except ImportError:
    fal_client = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

# Load environment variables
load_dotenv()

app = FastAPI(title="Aura AI - Creative Agent API")

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Output directory for saved generations
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper function to download file from URL
def download_file(url: str, suffix: str) -> str:
    filename = f"{uuid.uuid4()}{suffix}"
    filepath = os.path.join(OUTPUT_DIR, filename)
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return f"/outputs/{filename}"
    else:
        raise Exception(f"Failed to download generated file. HTTP {response.status_code}")

# Models definitions
class EnhancePromptRequest(BaseModel):
    prompt: str
    style: Optional[str] = "None"
    api_key: Optional[str] = None

class ImageGenerateRequest(BaseModel):
    prompt: str
    provider: str  # pollinations, huggingface, replicate, fal
    api_key: Optional[str] = None
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    steps: Optional[int] = 20


class SpeechGenerateRequest(BaseModel):
    text: str
    lang: Optional[str] = "en"

# Local rule-based prompt enhancer fallback
STYLE_PROMPTS = {
    "Cinematic": "cinematic lighting, dramatic composition, film grain, shot on 35mm lens, highly detailed, photorealistic, 8k resolution",
    "Cyberpunk": "cyberpunk style, neon glowing lights, futuristic cityscape background, dark rainy streets, high-tech gadgets, vibrant cyan and magenta colors",
    "Anime": "modern anime aesthetic, vibrant colors, detailed line art, studio ghibli or makoto shinkai style, hand-drawn look, high quality",
    "Fantasy": "epic fantasy art style, mystical atmosphere, magical particles, whimsical, detailed landscapes, ethereal lighting, concept art",
    "3D Render": "octane render, unreal engine 5 style, highly detailed 3D modeling, smooth textures, ray tracing, studio lighting",
    "None": ""
}

@app.post("/api/enhance-prompt")
def enhance_prompt(req: EnhancePromptRequest):
    prompt = req.prompt.strip()
    style_suffix = STYLE_PROMPTS.get(req.style, "")
    
    # Try using Gemini API if key is available
    api_key = req.api_key or os.getenv("GEMINI_API_KEY")
    
    if genai and api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            system_instruction = (
                "You are an expert AI prompt engineer. Your job is to rewrite the user's short prompt "
                "into a highly descriptive, visually rich prompt for image/video/audio generation models. "
                "Describe the atmosphere, mood, style, elements, and specific details. "
                "Keep the core subject exactly the same. Do not add any conversational text, explanations, or greeting. "
                "Output ONLY the enhanced prompt."
            )
            
            user_prompt = f"Original prompt: '{prompt}'"
            if style_suffix:
                user_prompt += f"\nDesired style: {req.style}. (Incorporate: {style_suffix})"
                
            response = model.generate_content(
                contents=[system_instruction, user_prompt]
            )
            
            enhanced_text = response.text.strip()
            if enhanced_text:
                return {"enhanced_prompt": enhanced_text}
        except Exception as e:
            # Fallback to local rule-based if Gemini fails
            print(f"Gemini enhancement failed: {e}")
    
    # Rule-based fallback
    enhanced = prompt
    if style_suffix:
        enhanced = f"{prompt}, {style_suffix}"
    else:
        enhanced = f"{prompt}, highly detailed, volumetric lighting, artistic style"
        
    return {"enhanced_prompt": enhanced}

@app.post("/api/generate-image")
def generate_image(req: ImageGenerateRequest):
    prompt = req.prompt.strip()
    provider = req.provider.lower()
    
    if provider == "pollinations":
        try:
            encoded_prompt = urllib.parse.quote(prompt)
            url = f"https://image.pollinations.ai/p/{encoded_prompt}?width={req.width}&height={req.height}&nologo=true"
            local_url = download_file(url, ".jpg")
            return {"url": local_url, "provider": "pollinations"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pollinations generation failed: {str(e)}")
            
    elif provider == "huggingface":
        api_key = req.api_key or os.getenv("HUGGINGFACE_API_KEY")
        if not InferenceClient:
            raise HTTPException(status_code=500, detail="huggingface_hub library is not available.")
            
        try:
            client = InferenceClient(token=api_key if api_key else None)
            # Use FLUX.1-schnell model
            image = client.text_to_image(
                prompt,
                model="black-forest-labs/FLUX.1-schnell",
                width=req.width,
                height=req.height
            )
            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            image.save(filepath)
            return {"url": f"/outputs/{filename}", "provider": "huggingface"}
        except Exception as e:
            try:
                print(f"Flux failed, trying SDXL: {e}")
                image = client.text_to_image(
                    prompt,
                    model="stabilityai/stable-diffusion-xl-base-1.0",
                    width=req.width,
                    height=req.height
                )
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(OUTPUT_DIR, filename)
                image.save(filepath)
                return {"url": f"/outputs/{filename}", "provider": "huggingface (SDXL)"}
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Hugging Face generation failed: {str(e2)}")
                
    elif provider == "replicate":
        api_key = req.api_key or os.getenv("REPLICATE_API_TOKEN")
        if not api_key:
            raise HTTPException(status_code=400, detail="Replicate API token is required.")
        if not replicate:
            raise HTTPException(status_code=500, detail="replicate library is not available.")
            
        try:
            os.environ["REPLICATE_API_TOKEN"] = api_key
            output = replicate.run(
                "black-forest-labs/flux-schnell",
                input={
                    "prompt": prompt,
                    "width": req.width,
                    "height": req.height,
                    "num_inference_steps": req.steps,
                    "output_format": "webp"
                }
            )
            if output and len(output) > 0:
                img_url = output[0]
                local_url = download_file(img_url, ".webp")
                return {"url": local_url, "provider": "replicate"}
            else:
                raise Exception("No image returned from Replicate.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Replicate generation failed: {str(e)}")

    elif provider == "fal":
        api_key = req.api_key or os.getenv("FAL_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="Fal.ai API key is required.")
        if not fal_client:
            raise HTTPException(status_code=500, detail="fal-client library is not available.")
            
        try:
            os.environ["FAL_KEY"] = api_key
            handler = fal_client.submit(
                "fal-ai/flux/schnell",
                arguments={
                    "prompt": prompt,
                    "image_size": {"width": req.width, "height": req.height},
                    "num_inference_steps": req.steps
                }
            )
            result = handler.get()
            if "images" in result and len(result["images"]) > 0:
                img_url = result["images"][0]["url"]
                local_url = download_file(img_url, ".png")
                return {"url": local_url, "provider": "fal"}
            else:
                raise Exception("No image returned from Fal.ai.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fal.ai generation failed: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="Invalid provider specified.")


@app.post("/api/text-to-speech")
def text_to_speech(req: SpeechGenerateRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Please enter some text to speak.")
        
    if not gTTS:
        raise HTTPException(status_code=500, detail="gTTS library is not installed on the server.")
        
    try:
        # Generate speech using gTTS (Google Text-to-Speech)
        tts = gTTS(text=text, lang=req.lang)
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        tts.save(filepath)
        return {"url": f"/outputs/{filename}", "provider": "google-tts"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-Speech failed: {str(e)}")

# Serve outputs
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")
os.makedirs(FRONTEND_DIR, exist_ok=True)

# Mount frontend files (CSS, JS)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(
        content={"message": "FastAPI is running! Create index.html in frontend folder to view the UI."},
        status_code=200
    )
