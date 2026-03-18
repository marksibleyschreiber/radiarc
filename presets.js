/**
 * Preset management for Radiarc Epicycle Snake.
 * ✨ OPTIMIZED: Load directly into settingsCache, bypassing DOM reads
 */

window.time = -1;
const PRESETS_STORAGE_KEY = "radiarc_setting_presets";

function flashInput(id) {
    // Keep as-is or remove if not needed
}

function getPresets() {
    let presets = [];
    try {
        presets = JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY)) || [];
    } catch (e) {}
    return presets;
}

function savePreset(name) {
    pauseAnimation();
    syncCacheFromDOM(); // Ensure cache reflects current state

    let presets = getPresets();
    let idx = presets.findIndex(p => p.name === name);

    // ✨ Save directly from cache
    let presetObj = {
        name,
        vectorParams: window.settingsCache.vectorParams,
        pixelSize: window.settingsCache.pixelSize,
        snakeLength: window.settingsCache.snakeLength,
        drawSpeed: window.settingsCache.drawSpeed,
        timeUnit: window.settingsCache.timeUnit,
        pixelThickness: window.settingsCache.pixelThickness,
        colorSegments: window.settingsCache.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: [...seg.pixelColor] })),
        colorStep: window.settingsCache.colorStep
    };

    if (idx !== -1) {
        presets[idx] = presetObj;
    } else {
        presets.push(presetObj);
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    refreshPresetList();
    resumeAnimation();
}

function loadPreset(index) {
    pauseAnimation();
    let presets = getPresets();
    let preset = presets[index];
    if (!preset) return;

    // ✨ Load directly into cache (NO DOM reads!)
    window.settingsCache = {
        vectorParams: preset.vectorParams.map(v => ({...v})),
        pixelSize: preset.pixelSize,
        snakeLength: preset.snakeLength,
        drawSpeed: preset.drawSpeed,
        timeUnit: preset.timeUnit,
        pixelThickness: preset.pixelThickness,
        colorSegments: preset.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: [...seg.pixelColor] })),
        colorStep: preset.colorStep
    };

    resetVectors();
    window.settingsDirty = false;

/*
    clear();
    drawingContext.imageSmoothingEnabled = false;
    window.time = -1;
    background(30);
 */

    // Update DOM for display only
    syncDOMFromCache();

    document.getElementById('presetName').value = preset.name;
    document.getElementById('title-stat').value = preset.name;

    if (typeof saveSettings === 'function') saveSettings();
    resumeAnimation();
}

function deletePreset(index) {
    pauseAnimation();
    let presets = getPresets();
    if (index < 0 || index >= presets.length) {
        resumeAnimation();
        return;
    }
    presets.splice(index, 1);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    refreshPresetList();
    resumeAnimation();
}

function refreshPresetList() {
    let presets = getPresets();
    const select = document.getElementById('presetList');
    if (!select) return;
    select.innerHTML = "";
    presets.forEach((preset, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = preset.name;
        select.appendChild(option);
    });
}

function exportPresets() {
    pauseAnimation();
    const presets = getPresets();
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radiarc_presets.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    resumeAnimation();
}

function importPresets(event) {
    pauseAnimation();
    const file = event.target.files[0];
    if (!file) {
        resumeAnimation();
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(imported));
                refreshPresetList();
                alert("Presets imported successfully!");
            } else {
                alert("Invalid preset format.");
            }
        } catch (err) {
            alert("Error reading file: " + err);
        }
        resumeAnimation();
    };
    reader.readAsText(file);
}

// Event handlers (keep as-is)
window.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('savePresetBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const name = document.getElementById('presetName').value.trim();
            if (!name) { alert("Please give the preset a name."); return; }
            savePreset(name);
            document.getElementById('presetName').value = name;
            document.getElementById('title-stat').value = name;
        };
    }
    const loadBtn = document.getElementById('loadPresetBtn');
    if (loadBtn) {
        loadBtn.onclick = () => {
            const idx = document.getElementById('presetList').value;
            if (idx === "" || idx == null) return;
            setTimeout(() => loadPreset(Number(idx)), 0);
        };
    }
    const delBtn = document.getElementById('deletePresetBtn');
    if (delBtn) {
        delBtn.onclick = () => {
            const idx = document.getElementById('presetList').value;
            if (idx === "" || idx == null) return;
            if (confirm("Are you sure you want to delete this preset?")) {
                deletePreset(Number(idx));
            }
        };
    }
    const exportBtn = document.getElementById('exportPresetsBtn');
    if (exportBtn) {
        exportBtn.onclick = exportPresets;
    }
    const importBtn = document.getElementById('importPresetsBtn');
    if (importBtn) {
        importBtn.onclick = () => {
            document.getElementById('importPresetsInput').click();
        };
    }
    const fileInput = document.getElementById('importPresetsInput');
    if (fileInput) {
        fileInput.onchange = importPresets;
    }
    refreshPresetList();
});