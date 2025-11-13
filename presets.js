/**
 * Preset management for Radiarc Epicycle Snake.
 * Handles saving, loading, listing, deleting, exporting, and importing presets via localStorage and JSON files.
 */

const PRESETS_STORAGE_KEY = "radiarc_setting_presets";

function getPresets() {
    let presets = [];
    try {
        presets = JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY)) || [];
    } catch (e) {}
    return presets;
}

function savePreset(name) {
    // Collect settings from current UI
    let vectorParams = [];
    for (let i = 0; i < 8; i++) {
        vectorParams.push({
            length: document.getElementById(`length${i}`).value,
            N: document.getElementById(`N${i}`).value,
            D: document.getElementById(`D${i}`).value
        });
    }
    let pixelSize = document.getElementById('pixelSize').value;
    let snakeLength = document.getElementById('snakeLength').value;
    let drawSpeed = document.getElementById('drawSpeed').value;

    let presets = getPresets();
    // Update if name exists, else add new
    let idx = presets.findIndex(p => p.name === name);
    let presetObj = { name, vectorParams, pixelSize, snakeLength, drawSpeed };
    if (idx !== -1) {
        presets[idx] = presetObj;
    } else {
        presets.push(presetObj);
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    refreshPresetList();
}

function loadPreset(index) {
    let presets = getPresets();
    let preset = presets[index];
    if (!preset) return;
    // Fill UI with preset data
    for (let i = 0; i < 8; i++) {
        document.getElementById(`length${i}`).value = preset.vectorParams[i].length;
        document.getElementById(`N${i}`).value = preset.vectorParams[i].N;
        document.getElementById(`D${i}`).value = preset.vectorParams[i].D;
    }
    document.getElementById('pixelSize').value = preset.pixelSize;
    document.getElementById('snakeLength').value = preset.snakeLength;
    document.getElementById('drawSpeed').value = preset.drawSpeed;

    // Optionally, reload settings to update UI if needed
    if (typeof loadSettings === "function") loadSettings();
}

function deletePreset(index) {
    let presets = getPresets();
    if (index < 0 || index >= presets.length) return;
    presets.splice(index, 1);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    refreshPresetList();
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
}

// Import settings from JSON file
function importPresets(event) {
    const file = event.target.files[0];
    if (!file) return;
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
    };
    reader.readAsText(file);
}

// Attach UI event handlers when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Save handler
    const saveBtn = document.getElementById('savePresetBtn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const name = document.getElementById('presetName').value.trim();
            if (!name) { alert("Please give the preset a name."); return; }
            savePreset(name);
            document.getElementById('presetName').value = "";
        };
    }
    // Load handler
    const loadBtn = document.getElementById('loadPresetBtn');
    if (loadBtn) {
        loadBtn.onclick = () => {
            const idx = document.getElementById('presetList').value;
            if (idx === "" || idx == null) return;
            loadPreset(Number(idx));
        };
    }
    // Delete handler
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
    // Export handler
    const exportBtn = document.getElementById('exportPresetsBtn');
    if (exportBtn) {
        exportBtn.onclick = exportPresets;
    }
    // Import handler
    const importBtn = document.getElementById('importPresetsBtn');
    if (importBtn) {
        importBtn.onclick = () => {
            document.getElementById('importPresetsInput').click();
        };
    }
    // File input handler
    const fileInput = document.getElementById('importPresetsInput');
    if (fileInput) {
        fileInput.onchange = importPresets;
    }
    // Initial listing
    refreshPresetList();
});