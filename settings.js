// settings.js

window.vectorCount = 9;

// Utility to pause and resume animation safely
function pauseAnimation() { if (typeof noLoop === "function") noLoop(); }
function resumeAnimation() { if (typeof loop === "function") loop(); }

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

    // Toggle settings window
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
    let vectorParams = [];
    for (let i = 0; i < window.vectorCount; i++) {
        const length = document.getElementById(`length${i}`).value;
        const N = document.getElementById(`N${i}`).value;
        const D = document.getElementById(`D${i}`).value;
        vectorParams.push({ length, N, D });
    }
    localStorage.setItem('vectorParams', JSON.stringify(vectorParams));
    localStorage.setItem('pixelSize', document.getElementById('pixelSize').value);
    localStorage.setItem('snakeLength', document.getElementById('snakeLength').value);
    localStorage.setItem('drawSpeed', document.getElementById('drawSpeed').value);
    localStorage.setItem('presetName', document.getElementById('presetName').value);
    localStorage.setItem('colorSegments', JSON.stringify(window.colorSegments));
    localStorage.setItem('colorStep', document.getElementById('colorStep').value);
    resumeAnimation();
}

function loadSettings() {
    let vectorParams = [];
    try {
      vectorParams = JSON.parse(localStorage.getItem('vectorParams'));
    } catch (e) {}
    for (let i = 0; i < window.vectorCount; i++) {
        if (vectorParams && vectorParams[i] && i < vectorParams.length) {
            document.getElementById(`length${i}`).value = vectorParams[i].length ?? 1;
            document.getElementById(`N${i}`).value = vectorParams[i].N ?? 1;
            document.getElementById(`D${i}`).value = vectorParams[i].D ?? 0;
        } else {
            document.getElementById(`length${i}`).value = 1;
            document.getElementById(`N${i}`).value = 1;
            document.getElementById(`D${i}`).value = 0;
        }
    }
    let pixelSize = localStorage.getItem('pixelSize');
    if (pixelSize) document.getElementById('pixelSize').value = pixelSize;
    let snakeLength = localStorage.getItem('snakeLength');
    if (!isNaN(snakeLength) && snakeLength >= 0) document.getElementById('snakeLength').value = snakeLength;
    let drawSpeed = localStorage.getItem('drawSpeed');
    if (!isNaN(drawSpeed) && drawSpeed >= 0) document.getElementById('drawSpeed').value = drawSpeed;
    // Load preset name
    let presetName = localStorage.getItem('presetName');
    if (presetName) document.getElementById('presetName').value = presetName;
    if (presetName) document.getElementById('title-stat').value = presetName;
    // Load color settings
    try {
        let cs = JSON.parse(localStorage.getItem('colorSegments'));
        if (Array.isArray(cs)) window.colorSegments = cs;
    } catch (e) {}
    let step = localStorage.getItem('colorStep');
    document.getElementById('colorStep').value = step;
    if (typeof renderColorSegments === "function") renderColorSegments();
    if (typeof updateColorConfig === "function") updateColorConfig();
}
