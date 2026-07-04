document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const modeImageBtn = document.getElementById("mode-image");
    const modeVideoBtn = document.getElementById("mode-video");
    const groupImageProvider = document.getElementById("group-image-provider");
    const groupVideoProvider = document.getElementById("group-video-provider");
    const selectImageProvider = document.getElementById("select-image-provider");
    const selectVideoProvider = document.getElementById("select-video-provider");
    const selectAspect = document.getElementById("select-aspect");
    const selectStyle = document.getElementById("select-style");
    const apiStatusDot = document.getElementById("api-status-dot");
    const apiStatusText = document.getElementById("api-status-text");

    const canvasPlaceholder = document.getElementById("canvas-placeholder");
    const canvasLoading = document.getElementById("canvas-loading");
    const canvasOutput = document.getElementById("canvas-output");
    const loadingMessage = document.getElementById("loading-message");
    const videoProgressContainer = document.getElementById("video-progress-container");
    const videoProgressBar = document.getElementById("video-progress-bar");
    const videoProgressText = document.getElementById("video-progress-text");

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
    let currentMode = "image"; // "image" or "video"
    let generationActive = false;
    let videoPollInterval = null;
    let secondsElapsed = 0;

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
        const provider = currentMode === "image" ? selectImageProvider.value : selectVideoProvider.value;
        
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

    // Mode Toggle
    function setMode(mode) {
        currentMode = mode;
        if (mode === "image") {
            modeImageBtn.classList.add("active");
            modeVideoBtn.classList.remove("active");
            groupImageProvider.classList.remove("hidden");
            groupVideoProvider.classList.add("hidden");
            generateTypeLabel.innerText = "Image";
        } else {
            modeImageBtn.classList.remove("active");
            modeVideoBtn.classList.add("active");
            groupImageProvider.classList.add("hidden");
            groupVideoProvider.classList.remove("hidden");
            generateTypeLabel.innerText = "Video";
        }
        updateEngineStatus();
    }

    modeImageBtn.addEventListener("click", () => setMode("image"));
    modeVideoBtn.addEventListener("click", () => setMode("video"));
    selectImageProvider.addEventListener("change", updateEngineStatus);
    selectVideoProvider.addEventListener("change", updateEngineStatus);

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

    // Generation Core
    btnGenerate.addEventListener("click", () => {
        if (generationActive) return;
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showToast("Please enter a prompt first!", "error");
            return;
        }

        if (currentMode === "image") {
            generateImage(prompt);
        } else {
            generateVideo(prompt);
        }
    });

    // Image Generation Request
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

    // Video Generation & Polling Request
    async function generateVideo(prompt) {
        setCanvasLoading(true, "Initializing video frames...", true);
        
        const provider = selectVideoProvider.value;
        const api_key = localStorage.getItem(`key_${provider}`) || "";
        
        if (!api_key) {
            showToast(`Please configure the API key for ${provider.toUpperCase()} in settings!`, "error");
            setCanvasLoading(false);
            return;
        }

        secondsElapsed = 0;
        videoProgressText.innerText = "Elapsed: 0s (Estimated: 25-45s)";
        
        // Start an interval clock for tracking duration
        const timer = setInterval(() => {
            secondsElapsed++;
            videoProgressText.innerText = `Elapsed: ${secondsElapsed}s (Estimated: 25-45s)`;
        }, 1000);

        try {
            const response = await fetch("/api/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    provider: provider,
                    api_key: api_key
                })
            });

            const data = await response.json();
            if (response.ok) {
                const taskId = data.task_id;
                pollVideoStatus(provider, taskId, api_key, timer);
            } else {
                clearInterval(timer);
                throw new Error(data.detail || "Video generation failed");
            }
        } catch (err) {
            clearInterval(timer);
            console.error(err);
            showToast(`Error: ${err.message}`, "error");
            setCanvasLoading(false);
        }
    }

    // Poll Endpoint for Video Progress
    function pollVideoStatus(provider, taskId, apiKey, timer) {
        loadingMessage.innerText = "Rendering frames in cloud...";
        
        videoPollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/check-video/${provider}/${taskId}?api_key=${encodeURIComponent(apiKey)}`);
                const data = await response.json();
                
                if (response.ok) {
                    if (data.status === "succeeded") {
                        clearInterval(videoPollInterval);
                        clearInterval(timer);
                        setCanvasLoading(false);
                        displayOutput("video", data.url, promptInput.value);
                        showToast("Video rendered successfully!", "success");
                    } else if (data.status === "failed") {
                        clearInterval(videoPollInterval);
                        clearInterval(timer);
                        setCanvasLoading(false);
                        showToast(`Video generation failed: ${data.error}`, "error");
                    } else {
                        // Still processing, update progress logs if available
                        if (data.progress) {
                            console.log("Model logs:", data.progress);
                        }
                    }
                } else {
                    throw new Error(data.detail || "Failed to check progress");
                }
            } catch (err) {
                console.error(err);
                clearInterval(videoPollInterval);
                clearInterval(timer);
                setCanvasLoading(false);
                showToast(`Polling error: ${err.message}`, "error");
            }
        }, 4000);
    }

    // Display state controls helper
    function setCanvasLoading(isLoading, msg = "", isVideo = false) {
        generationActive = isLoading;
        btnGenerate.disabled = isLoading;
        btnEnhance.disabled = isLoading;
        
        if (isLoading) {
            canvasPlaceholder.classList.add("hidden");
            canvasOutput.classList.add("hidden");
            canvasLoading.classList.remove("hidden");
            loadingMessage.innerText = msg;
            
            if (isVideo) {
                videoProgressContainer.classList.remove("hidden");
            } else {
                videoProgressContainer.classList.add("hidden");
            }
        } else {
            canvasLoading.classList.add("hidden");
        }
    }

    // Injects generated elements into DOM with an interactive download bar overlay
    function displayOutput(type, url, prompt) {
        canvasPlaceholder.classList.add("hidden");
        canvasLoading.classList.add("hidden");
        canvasOutput.classList.remove("hidden");

        let mediaElement = "";
        if (type === "image") {
            mediaElement = `<img src="${url}" alt="Generated Image: ${prompt.substring(0, 30)}">`;
        } else {
            mediaElement = `<video src="${url}" controls autoplay loop></video>`;
        }

        // Overlay with actions
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
        
        // Remove toast after 4s
        setTimeout(() => {
            toast.style.animation = "fade-out 0.3s ease-out forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Run Load API Keys on Startup
    loadApiKeys();
});
