// Radiarc Epicycle Snake - Classic frame logic, fast drawing, no smoothing.

const MARGIN = 40;     // Margin on each edge, in pixels
const vectorCount = 8;
const stopHistory = new Map();

let vectors = [];
let trail = [];
let time = -1;
let maxTrailLength = 300;
let pixelSize = 2;

function roundXY(x, y) {
    return { x: Math.round(x), y: Math.round(y) };
}

function zParseInt(val, fallback) {
    let n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
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
}

function resetVectors() {
    vectors = [];
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
    }
    pixelSize = zParseInt(document.getElementById('pixelSize').value, 2);
    let len = parseInt(document.getElementById('snakeLength').value);
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

    // Classic per-frame tail logic, N times per frame
    for (let step = 0; step < drawSpeed; step++) {
        // Erase oldest tail pixel if over maxTrailLength
        if (trail.length > maxTrailLength) {
            let old_stops = trail.splice(0, trail.length - maxTrailLength);
            for (let stop of old_stops) {
                let stopsKey = `${stop.x},${stop.y}`
                if (stopHistory.get(stopsKey) < 2) {
                    erasePixel(stop.x, stop.y, stop.pixelSize);
                }
                stopHistory.set(stopsKey, stopHistory.get(stopsKey) - 1);
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

        // Always store rounded values in trail!
        let head = { x: rounded.x, y: rounded.y, pixelSize };

        // Add and draw new head
        trail.push(head);
        drawPixel(head.x, head.y, head.pixelSize);
        let stopsKey = `${head.x},${head.y}`
        if (!stopHistory.has(stopsKey)) stopHistory.set(stopsKey, 0);
        stopHistory.set(stopsKey, 1 + stopHistory.get(stopsKey));
        // if (resetClock) time = -1;
        time += 1;
    }
}

// Draw the pixel so that (x, y) is the actual CENTER
function drawPixel(x, y, pixelSize) {
    noStroke();
    fill(255, 0, 0); // always red
    rect(Math.round(x - pixelSize / 2), Math.round(y - pixelSize / 2), pixelSize, pixelSize);
}
function erasePixel(x, y, pixelSize) {
    noStroke();
    fill(30); // always background
    rect(Math.round(x - pixelSize / 2), Math.round(y - pixelSize / 2), pixelSize, pixelSize);
}

function keyPressed() {
    if (key === 's') {
        saveCanvas('radiarc_epicycle_snake', 'png');
    }
}

function clearAndReset() {
    background(30);
    resetVectors();
    trail = [];
    time = 0;
    stopHistory.clear();
}
