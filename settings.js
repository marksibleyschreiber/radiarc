// settings.js

window.vectorCount = 9;

// ✨ Settings cache + dirty flag
window.settingsCache = {
    vectorParams: [],
    pixelSize: 1,
    snakeLength: 0,
    drawSpeed: 0,
    timeUnit: 1,
    pixelThickness: 1,
    colorSegments: [{ length: 1, pixelColor: [255, 0, 0] }],
    colorStep: 1
};

window.settingsDirty = true; // ✨ Flag to trigger resetVectors only when needed

function pauseAnimation() { if (typeof noLoop === "function") noLoop(); }
function resumeAnimation() { if (typeof loop === "function") loop(); }

function syncCacheFromDOM() {
    let vectorParams = [];
    for (let i = 0; i < window.vectorCount; i++) {
        vectorParams.push({
            length: document.getElementById(`length${i}`).value,
            N: document.getElementById(`N${i}`).value,
            D: document.getElementById(`D${i}`).value
        });
    }
    window.settingsCache = {
        vectorParams,
        pixelSize: document.getElementById('pixelSize').value,
        snakeLength: document.getElementById('snakeLength').value,
        drawSpeed: document.getElementById('drawSpeed').value,
        timeUnit: document.getElementById('timeUnit').value,
        pixelThickness: document.getElementById('pixelThickness').value,
        colorSegments: window.colorSegments,
        colorStep: document.getElementById('colorStep').value
    };
    window.settingsDirty = true; // ✨ Mark as dirty when changed
}

function syncDOMFromCache() {
    const cache = window.settingsCache;
    for (let i = 0; i < window.vectorCount; i++) {
        if (i < cache.vectorParams.length) {
            document.getElementById(`length${i}`).value = cache.vectorParams[i].length;
            document.getElementById(`N${i}`).value = cache.vectorParams[i].N;
            document.getElementById(`D${i}`).value = cache.vectorParams[i].D;
        }
    }
    document.getElementById('pixelSize').value = cache.pixelSize;
    document.getElementById('snakeLength').value = cache.snakeLength;
    document.getElementById('drawSpeed').value = cache.drawSpeed;
    document.getElementById('timeUnit').value = cache.timeUnit;
    document.getElementById('pixelThickness').value = cache.pixelThickness;
    document.getElementById('colorStep').value = cache.colorStep;
    window.colorSegments = cache.colorSegments;
    if (typeof renderColorSegments === "function") renderColorSegments();
}

window.addEventListener('DOMContentLoaded', function() {
    let tbody = document.querySelector("#vector-controls tbody");
    for (let i = 0; i < window.vectorCount; i++) {
        let tr = document.createElement("tr");
        tr.innerHTML = `
          <td>V${i+1}</td>
          <td><input type="number" id="length${i}" style="width:60px;"></td>
          <td><input type="number" id="N${i}" style="width:90px;"></td>
          <td><input type="number" id="D${i}" style="width:90px;"></td>
        `;
        tbody.appendChild(tr);
    }
    loadSettings();

    // Attach change listeners
    for (let i = 0; i < window.vectorCount; i++) {
        document.getElementById(`length${i}`).addEventListener('input', syncCacheFromDOM);
        document.getElementById(`N${i}`).addEventListener('input', syncCacheFromDOM);
        document.getElementById(`D${i}`).addEventListener('input', syncCacheFromDOM);
    }
    document.getElementById('pixelSize').addEventListener('input', syncCacheFromDOM);
    document.getElementById('snakeLength').addEventListener('input', syncCacheFromDOM);
    document.getElementById('drawSpeed').addEventListener('input', syncCacheFromDOM);
    document.getElementById('timeUnit').addEventListener('input', syncCacheFromDOM);
    document.getElementById('pixelThickness').addEventListener('input', syncCacheFromDOM);
    document.getElementById('colorStep').addEventListener('input', syncCacheFromDOM);

    const settingsDiv = document.getElementById('controls');
    const toggleBtn = document.getElementById('control-toggle');
    toggleBtn.onclick = () => {
        if (settingsDiv.hasAttribute('hidden')) {
            settingsDiv.removeAttribute('hidden');
            toggleBtn.textContent = "Hide Settings";
        } else {
            settingsDiv.setAttribute('hidden', '');
            toggleBtn.textContent = "Show Settings";
        }
    };
    document.getElementById('saveParams').onclick = saveSettings;
});

function getStartingColorStep() {
    let step = parseInt(localStorage.getItem('colorStep'), 10);
    if (step && step >= 1) return step;
    const stepInput = document.getElementById('colorStep');
    let domStep = parseInt(stepInput?.value, 10);
    return (domStep && domStep >= 1) ? domStep : 1;
}

function saveSettings() {
    pauseAnimation();
    syncCacheFromDOM();
    localStorage.setItem('vectorParams', JSON.stringify(window.settingsCache.vectorParams));
    localStorage.setItem('pixelSize', window.settingsCache.pixelSize);
    localStorage.setItem('snakeLength', window.settingsCache.snakeLength);
    localStorage.setItem('drawSpeed', window.settingsCache.drawSpeed);
    localStorage.setItem('timeUnit', window.settingsCache.timeUnit);
    localStorage.setItem('pixelThickness', window.settingsCache.pixelThickness);
    localStorage.setItem('presetName', document.getElementById('presetName').value);
    localStorage.setItem('colorSegments', JSON.stringify(window.settingsCache.colorSegments));
    localStorage.setItem('colorStep', window.settingsCache.colorStep);
    resumeAnimation();
}

function loadSettings() {
    let vectorParams = [];
    try {
        vectorParams = JSON.parse(localStorage.getItem('vectorParams'));
    } catch (e) {}
    
    window.settingsCache.vectorParams = vectorParams || [];
    for (let i = 0; i < window.vectorCount; i++) {
        if (!window.settingsCache.vectorParams[i]) {
            window.settingsCache.vectorParams[i] = { length: 1, N: 1, D: 0 };
        }
    }
    
    window.settingsCache.pixelSize = localStorage.getItem('pixelSize') || 1;
    window.settingsCache.snakeLength = localStorage.getItem('snakeLength') || 0;
    window.settingsCache.drawSpeed = localStorage.getItem('drawSpeed') || 0;
    window.settingsCache.timeUnit = localStorage.getItem('timeUnit') || 1;
    window.settingsCache.pixelThickness = localStorage.getItem('pixelThickness') || 1;
    
    try {
        let cs = JSON.parse(localStorage.getItem('colorSegments'));
        if (Array.isArray(cs)) window.settingsCache.colorSegments = cs;
    } catch (e) {}
    
    window.settingsCache.colorStep = localStorage.getItem('colorStep') || 1;
    
    syncDOMFromCache();
    
    let presetName = localStorage.getItem('presetName');
    if (presetName) {
        document.getElementById('presetName').value = presetName;
        document.getElementById('title-stat').value = presetName;
    }
    
    if (typeof updateColorConfig === "function") updateColorConfig();
    window.settingsDirty = true; // ✨ Mark dirty after load
}