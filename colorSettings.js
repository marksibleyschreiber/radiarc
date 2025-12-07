// colorSettings.js
// UI controls for color segments (delete, insert, update) and color Step

window.colorSegments = [{ length: 10, pixelColor: [255, 0, 0] }];

// Render color segments panel
function renderColorSegments() {
    const container = document.getElementById('colorSegmentsContainer');
    container.innerHTML = "";

    window.colorSegments.forEach((seg, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '4px';

        // Length input
        const lenInput = document.createElement('input');
        lenInput.type = 'number';
        lenInput.min = '1';
        lenInput.value = seg.length;
        lenInput.style.width = '50px';
        lenInput.onchange = (e) => {
            window.colorSegments[idx].length = parseInt(e.target.value) || 1;
            updateColorConfig();
        };

        // Color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = rgbToHex(seg.pixelColor);
        colorInput.style.marginLeft = '7px';
        colorInput.oninput = (e) => {
            window.colorSegments[idx].pixelColor = hexToRgb(e.target.value);
            updateColorConfig();
        };

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginLeft = '7px';
        delBtn.onclick = () => {
            window.colorSegments.splice(idx, 1);
            renderColorSegments();
            updateColorConfig();
        };

        row.appendChild(lenInput);
        row.appendChild(colorInput);
        row.appendChild(delBtn);
        container.appendChild(row);
    });
}

function rgbToHex(rgbArr) {
    return "#" + rgbArr.map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    hex = hex.startsWith('#') ? hex.substring(1) : hex;
    return [
        parseInt(hex.substring(0,2), 16),
        parseInt(hex.substring(2,4), 16),
        parseInt(hex.substring(4,6), 16)
    ];
}

// Add new segment
function addColorSegment() {
    window.colorSegments.push({ length: 10, pixelColor: [255, 0, 0] }); // Default: 10 red
    renderColorSegments();
    updateColorConfig();
}

// Update color config in sketch.js
function updateColorConfig() {
    if (typeof setColorConfigFromControls === "function") {
        setColorConfigFromControls(window.colorSegments);
    }
}

// Handle color Step input
function setupColorControls() {
    // Add segment button
    const addBtn = document.getElementById('addColorSegmentBtn');
    addBtn.onclick = addColorSegment;
}

// On DOM ready
window.addEventListener('DOMContentLoaded', () => {
    setupColorControls();
});
