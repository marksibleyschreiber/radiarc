// settings.js

window.vectorCount = 8;
window.colorStep = 1;

// Utility to pause and resume animation safely
function pauseAnimation() { if (typeof noLoop === "function") noLoop(); }
function resumeAnimation() { if (typeof loop === "function") loop(); }

window.addEventListener('DOMContentLoaded', function() {
    let tbody = document.querySelector("#vector-controls tbody");
    for (let i = 0; i < window.vectorCount; i++) {
        let tr = document.createElement("tr");
/*
        tr.innerHTML = `
          <td>V${i+1}</td>
          <td><input type="number" id="length${i}" min="0" max="400" value="100"></td>
          <td><input type="number" id="N${i}" min="-20" max="20" value="1"></td>
          <td><input type="number" id="D${i}" min="1" max="1000" value="300"></td>
        `;
 */
        tr.innerHTML = `
          <td>V${i+1}</td>
          <td><input type="number" id="length${i}" style="width:60px;"></td>
          <td><input type="number" id="N${i}" style="width:90px;"></td>
          <td><input type="number" id="D${i}" style="width:90px;"></td>
        `;
        tbody.appendChild(tr);
    }
//     loadSettings();

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
    window.colorStep = getStartingColorStep();
    document.getElementById('colorStep').value = window.colorStep;
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
    localStorage.setItem('colorSegments', JSON.stringify(window.colorSegments)); // Save color settings
    localStorage.setItem('colorStep', window.colorStep);
    resumeAnimation();
}

function loadSettings() {
    let vectorParams = [];
    try {
      vectorParams = JSON.parse(localStorage.getItem('vectorParams'));
    } catch (e) {}
    for (let i = 0; i < window.vectorCount; i++) {
        if (vectorParams && vectorParams[i]) {
            document.getElementById(`length${i}`).value = vectorParams[i].length ?? 100;
            document.getElementById(`N${i}`).value = vectorParams[i].N ?? 1;
            document.getElementById(`D${i}`).value = vectorParams[i].D ?? 300;
        } else {
            document.getElementById(`length${i}`).value = 100;
            document.getElementById(`N${i}`).value = 1;
            document.getElementById(`D${i}`).value = 300;
        }
    }
    let pixelSize = localStorage.getItem('pixelSize');
    if (pixelSize) document.getElementById('pixelSize').value = pixelSize;
    let snakeLength = localStorage.getItem('snakeLength');
    if (snakeLength) document.getElementById('snakeLength').value = snakeLength;
    let drawSpeed = localStorage.getItem('drawSpeed');
    if (drawSpeed) document.getElementById('drawSpeed').value = drawSpeed;
    // Load color settings
    try {
        let cs = JSON.parse(localStorage.getItem('colorSegments'));
        if (Array.isArray(cs)) window.colorSegments = cs;
    } catch (e) {}
    let step = localStorage.getItem('colorStep');
/*
    if (step) window.colorStep = parseInt(step);
    let step = parseInt(localStorage.getItem('colorStep'), 10);
 */
    setColorStepFromUpdation(step);
    if (typeof renderColorSegments === "function") renderColorSegments();
    if (typeof updateColorConfig === "function") updateColorConfig();
}

// On loadSettings/loadPreset:
function setColorStepFromUpdation(val) {
    window.colorStep = (val && val >= 1) ? val : 1;
    document.getElementById('colorStep').value = window.colorStep;
}
