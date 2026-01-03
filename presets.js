/**
 * Preset management for Radiarc Epicycle Snake.
 * Handles saving, loading, listing, deleting, exporting, and importing presets via localStorage and JSON files.
 */

const PRESETS_STORAGE_KEY = "radiarc_setting_presets";

// Helper to flash/highlight updated input fields for visibility
function flashInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.backgroundColor = "#ccedff";
    setTimeout(() => { el.style.backgroundColor = ""; }, 450);
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
    // Collect settings from current UI
    let vectorParams = [];
    for (let i = 0; i < window.vectorCount; i++) {
        vectorParams.push({
            length: document.getElementById(`length${i}`).value,
            N: document.getElementById(`N${i}`).value,
            D: document.getElementById(`D${i}`).value
        });
    }
    let pixelSize = document.getElementById('pixelSize').value;
    let snakeLength = document.getElementById('snakeLength').value;
    let drawSpeed = document.getElementById('drawSpeed').value;

    // --- NOW SAVE CURRENT COLOR SETTINGS ---
    let colorSegments = Array.isArray(window.colorSegments)
        ? window.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor)
            ? [...seg.pixelColor] : [255, 0, 0] })) // Deep copy
        : [{ length: 1, pixelColor: [255, 0, 0] }];

    let presets = getPresets();
    let idx = presets.findIndex(p => p.name === name);
    let colorStep = document.getElementById('colorStep').value;
//     let colorIndex = 0;
    let presetObj = {
        name,
        vectorParams,
        pixelSize,
        snakeLength,
        drawSpeed,
        colorSegments, // Save user's actual color segments
        colorStep      // Save user's actual colorStep
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
    if (!preset) {
        resumeAnimation();
        return;
    }
    document.getElementById('presetName').value = preset.name;
    document.getElementById('title-stat').value = preset.name;
    for (let i = 0; i < window.vectorCount; i++) {
        if (i < preset.vectorParams.length) {
            document.getElementById(`length${i}`).value = preset.vectorParams[i].length;
            document.getElementById(`N${i}`).value = preset.vectorParams[i].N;
            document.getElementById(`D${i}`).value = preset.vectorParams[i].D;
        } else {
            document.getElementById(`length${i}`).value = 1;
            document.getElementById(`N${i}`).value = 1;
            document.getElementById(`D${i}`).value = 0;
        }
        flashInput(`length${i}`);
        flashInput(`N${i}`);
        flashInput(`D${i}`);
    }
    document.getElementById('pixelSize').value = preset.pixelSize;
    flashInput('pixelSize');
    document.getElementById('snakeLength').value = preset.snakeLength;
    flashInput('snakeLength');
    document.getElementById('drawSpeed').value = preset.drawSpeed;
    flashInput('drawSpeed');

    // --- RESTORE COLOR SETTINGS FROM PRESET ---
    window.colorSegments = Array.isArray(preset.colorSegments)
        ? preset.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor)
            ? [...seg.pixelColor] : [255, 0, 0] }))
        : [{ length: 1, pixelColor: [255, 0, 0] }];
    document.getElementById('colorStep').value = preset.colorStep;
    // Re-render color segments UI if the function is available
    if (typeof renderColorSegments === "function") {
        renderColorSegments();
    }

    // --- INITIALIZE STATISTICS ---
    document.getElementById('maxrad-stat').value = 0;

    if (typeof saveSettings === 'function') saveSettings();
    if (typeof loadSettings === "function") loadSettings();

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

// Export settings to JSON file
function exportPresets() {
    pauseAnimation();
    const presets = getPresets();
    const data = JSON.stringify(presets, null, 2); // Pretty print
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

// Import settings from JSON file
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

// Attach UI event handlers when DOM is ready
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
            loadPreset(Number(idx));
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