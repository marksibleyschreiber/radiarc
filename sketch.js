// Radiarc Epicycle Snake - Refactored for color segments and preset support

const MARGIN = 40;
const vectorCount = window.vectorCount || 8;
const stopHistory = new Map();

let vectors = [];
let nominalCycleLength = 0;
let trail = [];
let pushed = 0;
let time = -1;
let onsize = 0;
let hitsize = 0;
let cycleLength = time + 1;
let maxTrailLength = 300;
let pixelSize = 2;

// Color control variables
window.colorSegments = window.colorSegments || [{ length: 1, pixelColor: [255, 0, 0] }];
window.colorStep = 1;
let colorIndex = 0;
let fullColorArray = buildColorArray(window.colorSegments);

function setColorConfigFromControls(config) {
    window.colorSegments = Array.isArray(config.colorSegments)
        ? config.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor) ? [...seg.pixelColor] : [255, 0, 0] }))
        : [{ length: 1, pixelColor: [255, 0, 0] }];
    setColorStepFromUpdation(config.colorStep);
    colorIndex = 0; // Reset on new config
    fullColorArray = buildColorArray(window.colorSegments);
}

function setColorConfigFromPreset(preset) {
    window.colorSegments = Array.isArray(preset.colorSegments)
        ? preset.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor) ? [...seg.pixelColor] : [255, 0, 0] }))
        : [{ length: 1, pixelColor: [255, 0, 0] }];
    window.colorStep = preset.colorStep;
    colorIndex = 0;
    fullColorArray = buildColorArray(window.colorSegments);
}

function roundXY(x, y) {
    return { x: Math.round(x), y: Math.round(y) };
}

function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return Math.abs(a);
}

function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

function zParseInt(val, fallback) {
    let n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
}

// Build concatenated color array from color segments
function buildColorArray(segments) {
    let arr = [];
    segments.forEach(seg => {
        for (let i = 0; i < seg.length; i++) {
            arr.push(seg.pixelColor);
        }
    });
    return arr;
}

function setup() {
    const parentDiv = document.getElementById('p5canvas');
    const cs = window.getComputedStyle(parentDiv);
    const widthVal = parseInt(cs.width) || 800;
    const heightVal = parseInt(cs.height) || 800;
    const canvas = createCanvas(widthVal, heightVal);
    canvas.parent('p5canvas');
    pixelDensity(1);
    background(30);
    resetVectors();
    document.getElementById('clearBtn').onclick = clearAndReset;
    drawingContext.imageSmoothingEnabled = false;
    noSmooth();
    window.dispatchEvent(new Event('p5ready'));
}

function resetVectors() {
    vectors = [];
    nominalCycleLength = 0;
    for (let i = 0; i < vectorCount; i++) {
        let D = zParseInt(document.getElementById(`D${i}`).value, 0);
        if (D === 0) continue;
        let radius = zParseInt(document.getElementById(`length${i}`).value, 0);
        let N = zParseInt(document.getElementById(`N${i}`).value, 0);
        vectors.push({
            radius: radius,
            N: N,
            D: D,
            initialAngle: 0,
        });
        if (nominalCycleLength === 0) nominalCycleLength = D / gcd(N, D);
        else nominalCycleLength = lcm(nominalCycleLength, D / gcd(N, D));
    }
    document.getElementById('lcm-stat').textContent = BigInt(nominalCycleLength).toString();
    pixelSize = zParseInt(document.getElementById('pixelSize').value, 1);
    let len = zParseInt(document.getElementById('snakeLength').value, 0);
    if (!isNaN(len) && len >= 1) maxTrailLength = len;
}

function draw() {
    const centerX = width / 2;
    const centerY = height / 2;

    let drawSpeed = zParseInt(document.getElementById('drawSpeed').value, 1);
    drawSpeed = Math.max(0, drawSpeed);

    // Live vector updates from controls
    resetVectors();

    // Margin-aware scaling for radii
    let totalNominal = vectors.reduce((sum, v) => sum + Math.abs(v.radius), 0);
    let pixelAdj = (pixelSize / 2) - 1;
    let maxRadius = (Math.min(width, height) / 2) - MARGIN - pixelAdj;
    let scaleFactor = totalNominal !== 0 ? maxRadius / totalNominal : 0;

    // Live color update from colorSettings
    updateColorConfig();

    if (vectors.length > 0 && fullColorArray.length > 0 && drawSpeed > 0) {
        for (let step = 0; step < drawSpeed; step++) {
            // Erase oldest tail pixel if over maxTrailLength
/*
            if (trail.length > maxTrailLength) {
                let old_stops = trail.splice(0, trail.length - maxTrailLength);
                for (let stop of old_stops) {
                    let stopsKey = `${stop.x},${stop.y}`
                    if (stopHistory.get(stopsKey).length > 0) {
                        for (let px of stopHistory.get(stopsKey)) erasePixel(stop.x, stop.y, px);
                        onsize -= 1;
                        stopHistory.set(stopsKey, []);
                    }
                }
            }
 */
            if (pushed > maxTrailLength) {
                let old_stops = trail.splice(0, trail.length - maxTrailLength);
                for (let stop of old_stops) {
                    let stopsKey = `${stop.x},${stop.y}`
                    while (stopHistory.get(stopsKey).length > 0) {
                        let px = stopHistory.get(stopsKey).shift()
                        erasePixel(stop.x, stop.y, px);
                        if (stopHistory.get(stopsKey).length === 0) onsize -= 1;
                        pushed -= 1;
                    }
                }
            }

            // Advance angles
            let resetClock = 1;
            let x = centerX, y = centerY;
            for (let v of vectors) {
                let m = ((time + 1) * v.N) % v.D;
                if (m !== 0 ) resetClock = 0;
                let angle = v.initialAngle + m;
                let radius = scaleFactor * v.radius;
                x += radius * Math.cos((TWO_PI * angle) / v.D);
                y += radius * Math.sin((TWO_PI * angle) / v.D);
            }
            let rounded = roundXY(x, y);
            let head = { x: rounded.x, y: rounded.y, pixelSize };
            let stopsKey = `${head.x},${head.y}`;
            if (!stopHistory.has(stopsKey)) {
                stopHistory.set(stopsKey, []);
                hitsize += 1;
            }
            stopHistory.get(stopsKey).push(head.pixelSize);
            pushed += 1;
/*
            if (stopHistory.get(stopsKey).length === 1) {
                onsize += 1;
                trail.push(head);
                drawPixel(head.x, head.y, head.pixelSize);
            }
 */
            if (trail.length <= maxTrailLength) {
                if (stopHistory.get(stopsKey).length === 1) {
                    onsize += 1;
                    trail.push(head);
                    drawPixel(head.x, head.y, head.pixelSize);
                }
            }
            colorIndex += 1;
            if (resetClock) {
                cycleLength = time + 1;
                time = -1;
            }
            time += 1;
        }
        document.getElementById('time-stat').textContent = time;
        document.getElementById('on-stat').textContent = onsize;
        document.getElementById('hit-stat').textContent = stopHistory.size;
        document.getElementById('pushed-stat').textContent = pushed;
        document.getElementById('length-stat').textContent = trail.length;
    }
}

// Draw pixel using color array (from colorSegments)
function drawPixel(x, y, pixelSize) {
    let color = fullColorArray[(window.colorStep * colorIndex) % fullColorArray.length];
    noStroke();
    fill(...color);
    rect(Math.round(x - pixelSize / 2), Math.round(y - pixelSize / 2), pixelSize, pixelSize);
}

function erasePixel(x, y, pixelSize) {
    noStroke();
    fill(30); // always background
    rect(Math.round(x - pixelSize / 2), Math.round(y - pixelSize / 2), pixelSize, pixelSize);
}

// function keyPressed() {
//     if (key === 's') {
//         saveCanvas('radiarc_epicycle_snake', 'png');
//     }
// }

function clearAndReset() {
    background(30);
    resetVectors();
    trail = [];
    time = 0;
    stopHistory.clear();
    pushed = 0;
    onsize = 0;
//     n = 0;
}
