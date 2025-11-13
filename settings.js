window.onload = function() {
    let tbody = document.querySelector("#vector-controls tbody");
    for (let i = 0; i < 8; i++) {
        let tr = document.createElement("tr");
        tr.innerHTML = `
          <td>V${i+1}</td>
          <td><input type="number" id="length${i}" min="0" max="400" value="100"></td>
          <td><input type="number" id="N${i}" min="-20" max="20" value="1"></td>
          <td><input type="number" id="D${i}" min="1" max="1000" value="300"></td>
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
};

function saveSettings() {
    let vectorParams = [];
    for (let i = 0; i < 8; i++) {
        const length = document.getElementById(`length${i}`).value;
        const N = document.getElementById(`N${i}`).value;
        const D = document.getElementById(`D${i}`).value;
        vectorParams.push({ length, N, D });
    }
    localStorage.setItem('vectorParams', JSON.stringify(vectorParams));
    localStorage.setItem('pixelSize', document.getElementById('pixelSize').value);
    localStorage.setItem('snakeLength', document.getElementById('snakeLength').value);
    localStorage.setItem('drawSpeed', document.getElementById('drawSpeed').value);
}

function loadSettings() {
    let vectorParams = [];
    try {
      vectorParams = JSON.parse(localStorage.getItem('vectorParams'));
    } catch (e) {}
    for (let i = 0; i < 8; i++) {
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
}
document.getElementById('saveParams').onclick = saveSettings;
