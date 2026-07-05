document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements - Mode selectors
    const modeImageBtn = document.getElementById("mode-image");
    const modeSpeechBtn = document.getElementById("mode-speech");
    
    // Sidebar settings panels
    const groupImageSettings = document.getElementById("group-image-settings");
    const groupVoiceSettings = document.getElementById("group-voice-settings");
    
    // Input elements
    const selectImageProvider = document.getElementById("select-image-provider");
    const selectSpeechLang = document.getElementById("select-speech-lang");
    const selectAspect = document.getElementById("select-aspect");
    const selectStyle = document.getElementById("select-style");
    const apiStatusDot = document.getElementById("api-status-dot");
    const apiStatusText = document.getElementById("api-status-text");

    // Output elements
    const canvasPlaceholder = document.getElementById("canvas-placeholder");
    const canvasLoading = document.getElementById("canvas-loading");
    const canvasOutput = document.getElementById("canvas-output");
    const loadingMessage = document.getElementById("loading-message");

    const promptInput = document.getElementById("prompt-input");
    const btnEnhance = document.getElementById("btn-enhance");
    const btnGenerate = document.getElementById("btn-generate");
    const generateTypeLabel = document.getElementById("generate-type-label");

    // Modal elements
    const modalSettings = document.getElementById("modal-settings");
    const btnSettingsOpen = document.getElementById("btn-settings-open");
    const btnSettingsCloseX = document.getElementById("btn-settings-close-x");
    const btnSettingsSave = document.getElementById("btn-settings-save");
    const btnSettingsClear = document.getElementById("btn-settings-clear");
    const keyInputs = {
        gemini: document.getElementById("key-gemini"),
        huggingface: document.getElementById("key-huggingface"),
        replicate: document.getElementById("key-replicate"),
        fal: document.getElementById("key-fal")
    };
    
    // State Variables
    let currentMode = "image"; // "image", "music", or "speech"
    let generationActive = false;

    // Initialize Keys from LocalStorage
    function loadApiKeys() {
        Object.keys(keyInputs).forEach(key => {
            const val = localStorage.getItem(`key_${key}`);
            if (val) keyInputs[key].value = val;
        });
        updateEngineStatus();
    }

    function saveApiKeys() {
        Object.keys(keyInputs).forEach(key => {
            localStorage.setItem(`key_${key}`, keyInputs[key].value.trim());
        });
        showToast("API keys saved successfully!", "success");
        updateEngineStatus();
    }

    function clearApiKeys() {
        Object.keys(keyInputs).forEach(key => {
            keyInputs[key].value = "";
            localStorage.removeItem(`key_${key}`);
        });
        showToast("API keys cleared.", "info");
        updateEngineStatus();
    }

    // Update Status Indicator under Sidebar
    function updateEngineStatus() {
        if (currentMode === "image") {
            const provider = selectImageProvider.value;
            if (provider === "pollinations") {
                apiStatusDot.className = "indicator-dot";
                apiStatusText.innerText = "Using Pollinations (No API Key Required)";
                return;
            }
            const requiredKey = provider === "huggingface" ? "huggingface" : provider;
            const keyVal = localStorage.getItem(`key_${requiredKey}`);
            if (keyVal) {
                apiStatusDot.className = "indicator-dot";
                apiStatusText.innerText = `Using ${provider.toUpperCase()} (API Key Configured)`;
            } else {
                apiStatusDot.className = "indicator-dot warning";
                apiStatusText.innerText = `API Key missing for ${provider.toUpperCase()}! Configure in Settings.`;
            }
        } else if (currentMode === "speech") {
            apiStatusDot.className = "indicator-dot";
            apiStatusText.innerText = "Using Google TTS Engine (No API Key Required)";
        }
    }

    // Toggle Password Visibility
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                icon.className = "fa-regular fa-eye";
            } else {
                input.type = "password";
                icon.className = "fa-regular fa-eye-slash";
            }
        });
    });

    // Modal Control
    btnSettingsOpen.addEventListener("click", () => modalSettings.classList.remove("hidden"));
    btnSettingsCloseX.addEventListener("click", () => modalSettings.classList.add("hidden"));
    modalSettings.addEventListener("click", (e) => {
        if (e.target === modalSettings) modalSettings.classList.add("hidden");
    });
    btnSettingsSave.addEventListener("click", () => {
        saveApiKeys();
        modalSettings.classList.add("hidden");
    });
    btnSettingsClear.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all configured API keys?")) {
            clearApiKeys();
        }
    });

    // Mode Toggle Logic
    function setMode(mode) {
        currentMode = mode;
        
        // Update active class on buttons
        modeImageBtn.classList.remove("active");
        modeSpeechBtn.classList.remove("active");
        
        if (mode === "image") {
            modeImageBtn.classList.add("active");
            groupImageSettings.classList.remove("hidden");
            groupVoiceSettings.classList.add("hidden");
            generateTypeLabel.innerText = "Image";
            promptInput.placeholder = "A futuristic city in the clouds at sunset, highly detailed...";
        } else if (mode === "speech") {
            modeSpeechBtn.classList.add("active");
            groupImageSettings.classList.add("hidden");
            groupVoiceSettings.classList.remove("hidden");
            generateTypeLabel.innerText = "Voice";
            promptInput.placeholder = "Enter the text you want the AI voice to speak out loud...";
        }
        updateEngineStatus();
    }

    modeImageBtn.addEventListener("click", () => setMode("image"));
    modeSpeechBtn.addEventListener("click", () => setMode("speech"));
    selectImageProvider.addEventListener("change", updateEngineStatus);

    // Enhance Prompt Action
    btnEnhance.addEventListener("click", async () => {
        const text = promptInput.value.trim();
        if (!text) {
            showToast("Enter a prompt first to enhance!", "error");
            return;
        }

        btnEnhance.disabled = true;
        const origContent = btnEnhance.innerHTML;
        btnEnhance.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Refining...`;

        try {
            const style = selectStyle.value;
            const geminiKey = localStorage.getItem("key_gemini") || "";
            
            const response = await fetch("/api/enhance-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: text, style: style, api_key: geminiKey })
            });

            const data = await response.json();
            if (response.ok) {
                promptInput.value = data.enhanced_prompt;
                showToast("Prompt enhanced by Aura AI!", "success");
            } else {
                throw new Error(data.detail || "Enhancement failed");
            }
        } catch (err) {
            console.error(err);
            showToast(`Prompt enhancement error: ${err.message}`, "error");
        } finally {
            btnEnhance.disabled = false;
            btnEnhance.innerHTML = origContent;
        }
    });

    // Generation Router
    btnGenerate.addEventListener("click", () => {
        if (generationActive) return;
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showToast("Please enter a prompt first!", "error");
            return;
        }

        if (currentMode === "image") {
            generateImage(prompt);
        } else if (currentMode === "speech") {
            generateSpeech(prompt);
        }
    });

    // 1. Image Generation Request
    async function generateImage(prompt) {
        setCanvasLoading(true, "Generating image pixels...");
        
        const provider = selectImageProvider.value;
        const api_key = provider === "pollinations" ? "" : localStorage.getItem(`key_${provider === "huggingface" ? "huggingface" : provider}`) || "";
        
        if (provider !== "pollinations" && !api_key) {
            showToast(`Please configure the API key for ${provider.toUpperCase()} in settings!`, "error");
            setCanvasLoading(false);
            return;
        }

        const aspectOpt = selectAspect.options[selectAspect.selectedIndex];
        const width = parseInt(aspectOpt.getAttribute("data-w"));
        const height = parseInt(aspectOpt.getAttribute("data-h"));

        try {
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    provider: provider,
                    api_key: api_key,
                    width: width,
                    height: height
                })
            });

            const data = await response.json();
            if (response.ok) {
                displayOutput("image", data.url, prompt);
                showToast("Image generated successfully!", "success");
            } else {
                throw new Error(data.detail || "Image generation failed");
            }
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`, "error");
        } finally {
            setCanvasLoading(false);
        }
    }



    // 3. Text to Speech Generation Request
    async function generateSpeech(prompt) {
        setCanvasLoading(true, "Converting text to speech MP3...");
        const lang = selectSpeechLang.value;

        try {
            const response = await fetch("/api/text-to-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: prompt,
                    lang: lang
                })
            });

            const data = await response.json();
            if (response.ok) {
                displayOutput("audio", data.url, prompt, `AI Voice Narration (${lang.toUpperCase()})`);
                showToast("Voice audio created successfully!", "success");
            } else {
                throw new Error(data.detail || "Speech generation failed");
            }
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`, "error");
        } finally {
            setCanvasLoading(false);
        }
    }

    // Loading State Helper
    function setCanvasLoading(isLoading, msg = "") {
        generationActive = isLoading;
        btnGenerate.disabled = isLoading;
        btnEnhance.disabled = isLoading;
        
        if (isLoading) {
            canvasPlaceholder.classList.add("hidden");
            canvasOutput.classList.add("hidden");
            canvasLoading.classList.remove("hidden");
            loadingMessage.innerText = msg;
        } else {
            canvasLoading.classList.add("hidden");
        }
    }

    // Injects generated output elements into DOM
    function displayOutput(type, url, prompt, title = "Audio Track") {
        canvasPlaceholder.classList.add("hidden");
        canvasLoading.classList.add("hidden");
        canvasOutput.classList.remove("hidden");

        if (type === "image") {
            const mediaElement = `<img src="${url}" alt="Generated Image: ${prompt.substring(0, 30)}">`;
            const overlay = `
                <div class="output-overlay">
                    <button class="btn-overlay" id="btn-copy-prompt" title="Copy Prompt">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <a href="${url}" download class="btn-overlay" id="btn-download-output" title="Download Output">
                        <i class="fa-solid fa-download"></i>
                    </a>
                </div>
            `;
            canvasOutput.innerHTML = mediaElement + overlay;
        } else if (type === "audio") {
            // Premium audio card with waves visualizer
            const audioHtml = `
                <div class="audio-card" id="audio-output-card">
                    <div class="audio-header-title">
                        <i class="fa-solid fa-volume-high"></i>
                        <span>${title}</span>
                    </div>
                    <div class="audio-prompt-quote">"${prompt}"</div>
                    <div class="visualizer-container">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                    <audio src="${url}" id="audio-output-element" controls></audio>
                </div>
                <div class="output-overlay">
                    <button class="btn-overlay" id="btn-copy-prompt" title="Copy Prompt">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <a href="${url}" download class="btn-overlay" id="btn-download-output" title="Download Audio">
                        <i class="fa-solid fa-download"></i>
                    </a>
                </div>
            `;
            
            canvasOutput.innerHTML = audioHtml;

            // Connect Audio visualizer play/pause state triggers
            const audioEl = document.getElementById("audio-output-element");
            const cardEl = document.getElementById("audio-output-card");

            if (audioEl && cardEl) {
                audioEl.addEventListener("play", () => cardEl.classList.add("playing"));
                audioEl.addEventListener("pause", () => cardEl.classList.remove("playing"));
                audioEl.addEventListener("ended", () => cardEl.classList.remove("playing"));
            }
        }

        // Attach listener to copy prompt
        document.getElementById("btn-copy-prompt").addEventListener("click", () => {
            navigator.clipboard.writeText(prompt);
            showToast("Prompt copied to clipboard!", "success");
        });
    }

    // Toast Utility System
    function showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "fa-circle-info";
        if (type === "success") icon = "fa-circle-check";
        if (type === "error") icon = "fa-triangle-exclamation";
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = "fade-out 0.3s ease-out forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Run Load API Keys on Startup
    loadApiKeys();
});
