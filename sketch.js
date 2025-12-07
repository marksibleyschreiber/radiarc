// Radiarc Epicycle Snake - Refactored for color segments and preset support

const MARGIN = 40;
const vectorCount = window.vectorCount || 8;
const stopHistory = new Map();

let vectors = [];
let nominalCycleLength = 0n;
let trail = [];
let posted = 0;
let time = -1;
let onsize = 0;
let cycleLength = time + 1;
let maxTrailLength = 0;
let pixelSize = 2;

// Color control variables
window.colorSegments = window.colorSegments || [{ length: 1, pixelColor: [255, 0, 0] }];
let colorIndex = 0;
let fullColorArray = buildColorArray(window.colorSegments);

function getColorStep() {
    const el = document.getElementById('colorStep');
    if (!el) return 1;
    const n = parseInt(el.value, 10);
    return (isNaN(n) || n < 1) ? 1 : n;
}

function setColorConfigFromControls(colorSeg) {
    window.colorSegments = Array.isArray(colorSeg)
        ? colorSeg.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor) ? [...seg.pixelColor] : [255, 0, 0] }))
        : [{ length: 1, pixelColor: [255, 0, 0] }];
    fullColorArray = buildColorArray(window.colorSegments);
}

function setColorConfigFromPreset(preset) {
    window.colorSegments = Array.isArray(preset.colorSegments)
        ? preset.colorSegments.map(seg =>
            ({ length: seg.length, pixelColor: Array.isArray(seg.pixelColor) ? [...seg.pixelColor] : [255, 0, 0] }))
        : [{ length: 1, pixelColor: [255, 0, 0] }];
    colorIndex = 0;
    fullColorArray = buildColorArray(window.colorSegments);
}

function roundXY(_x, _y) {
    return { _x: Math.round(_x), _y: Math.round(_y) };
}

function gcd(a, b) {
    var a_n = BigInt(a);
    var b_n = BigInt(b);
    while (b_n !== 0n) {
        let temp = b_n;
        b_n = a_n % b_n;
        a_n = temp;
    }
    return a_n < 0n ? -a_n : a_n;
}

function lcm(a, b) {
    var a_n = BigInt(a);
    var b_n = BigInt(b);
    if (a_n === 0n || b_n === 0n) return 0n;
    let _x = (a_n * b_n) / gcd(a_n, b_n);
    return _x < 0n ? -_x : _x;
}

function zParseInt(val, fallback) {
    let n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
}

// Concatenate color segments
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
    let LCM = 0n;
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
        if (LCM === 0n) LCM = BigInt(D) / gcd(N, D);
        else LCM = lcm(LCM, BigInt(D) / gcd(N, D));
    }
    nominalCycleLength = LCM;
    pixelSize = zParseInt(document.getElementById('pixelSize').value, 1);
    let len = zParseInt(document.getElementById('snakeLength').value, 0);
    if (!isNaN(len) && len >= 1) maxTrailLength = len;
}

function draw() {
    const centerX = width / 2;
    const centerY = height / 2;
    const newStop = { depth: 0, pxz: 0 };
    let stopsKeyOld = '';
    let stopsKeyNew = '';


    let drawSpeed = zParseInt(document.getElementById('drawSpeed').value, 0);
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
    const colorStep = getColorStep();

    if (vectors.length > 0 && fullColorArray.length > 0 && drawSpeed > 0) {
        let excess = 0;
        for (let step = 0; step < drawSpeed; step++) {
            var resetClock;
            // Eliminate excess pixel
            if (trail.length - excess >= maxTrailLength) {
                let stop = trail[excess];
                excess += 1;
                while (stopHistory.get(`${stop.xx},${stop.yy}`).dz < 1 && trail.length - excess >= maxTrailLength)
                {
                    stop = trail[excess];
                    excess += 1;
                }
                erasePixel(stop.xx, stop.yy, stopHistory.get(`${stop.xx},${stop.yy}`).pz);
                stopHistory.get(`${stop.xx},${stop.yy}`).dz = 0;
                stopHistory.get(`${stop.xx},${stop.yy}`).pz = 0;
            }
            // Get new targeted pixel stop
            if (trail.length - excess < maxTrailLength) {
                resetClock = 1;
                let _x = centerX, _y = centerY;
                for (let v of vectors) {
                    let m = ((time + 1) * v.N) % v.D;
                    if (m !== 0 ) resetClock = 0;
                    let angle = v.initialAngle + m;
                    let radius = scaleFactor * v.radius;
                    _x += radius * Math.cos((TWO_PI * angle) / v.D);
                    _y += radius * Math.sin((TWO_PI * angle) / v.D);
                }
                let rounded = roundXY(_x, _y);
                let head = { xx: rounded._x, yy: rounded._y, pixelSize };
                drawPixel(head.xx, head.yy, head.pixelSize, colorStep);
                trail.push(head);
                let sKey = `${head.xx},${head.yy}`;
                if (!stopHistory.has(sKey)) stopHistory.set(sKey, { dz: 0, pz: 0 });
                stopHistory.get(sKey).dz += 1;
                let pz = stopHistory.get(sKey).pz;
                stopHistory.get(sKey).pz = Math.max(pz, head.pixelSize);
                // Update cycle counts
                if (resetClock) {
                    cycleLength = time + 1;
                    time = -1;
                }
                time += 1;
            }
            colorIndex += 1;
            if (colorIndex % fullColorArray.length === 0) colorIndex = 0;
        }
        trail.splice(0, excess);
    }
    document.getElementById('lcm-stat').textContent = nominalCycleLength.toString();
    document.getElementById('time-stat').textContent = time;
    document.getElementById('length-stat').textContent = trail.length;
}

// Draw pixel using color array (from colorSegments)
function drawPixel(_x, _y, pixelSize, step) {
    let color = fullColorArray[(step * colorIndex) % fullColorArray.length];
    noStroke();
    fill(...color);
    rect(Math.round(_x - pixelSize / 2), Math.round(_y - pixelSize / 2), pixelSize, pixelSize);
}

function erasePixel(_x, _y, pixelSize) {
    noStroke();
    fill(30); // always background
    rect(Math.round(_x - pixelSize / 2), Math.round(_y - pixelSize / 2), pixelSize, pixelSize);
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
    posted = 0;
    onsize = 0;
//     n = 0;
}
