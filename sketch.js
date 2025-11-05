// Updated sketch.js implementing:
// - pixel visit map (safe erasure for overlapping trail)
// - correct vector delta math for multiple snakes
// - opposite motion vector logic for horizontal line pattern
// - trail stores pixelSize for correct erasure
// - instant trail shrinkage using .splice()
// - setPixel and erasure are snapped to rounded pixel coordinates (prevents "dust")
// - "Clear & Reset" button support, wired from HTML

const canvasSize = 800;
const centerX = canvasSize / 2;
const centerY = canvasSize / 2;
const vectorCount = 8;

let vectors = [];
let trail = [];
let maxTrailLength = 300;
let pixelVisits = {}; // maps "x_y" -> visit count

function zParseInt(val, fallback) {
    let n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
}

function setup() {
    const canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent('p5canvas');
    pixelDensity(1);
    background(30);

    // Store pixel visits
    pixelVisits = {};

    vectors = [];
    for (let i = 0; i < vectorCount; i++) {
        let radius = zParseInt(document.getElementById(`length${i}`).value, 0);
        let N = zParseInt(document.getElementById(`N${i}`).value, 0);
        let D = zParseInt(document.getElementById(`D${i}`).value, 0);
        let angularDelta = D ? (N * TWO_PI / D) : 0;
        vectors.push({
            angle: 0,
            radius: radius,
            N: N,
            D: D,
            angularDelta: angularDelta,
            steps: 0,
            initialAngle: 0
        });
    }
    let len = parseInt(document.getElementById('snakeLength').value);
    if (!isNaN(len) && len > 1) maxTrailLength = len;
    trail = [];

    // Attach the Clear & Reset button from HTML
    document.getElementById('clearBtn').onclick = clearAndReset;
}

function draw() {
    // Do NOT call background(30); this makes finite trail snake and safe erasure work

    // Live update vectors from UI
    for (let i = 0; i < vectorCount; i++) {
        let radius = zParseInt(document.getElementById(`length${i}`).value, 0);
        let N = zParseInt(document.getElementById(`N${i}`).value, 0);
        let D = zParseInt(document.getElementById(`D${i}`).value, 0);
        let angularDelta = D ? (N * TWO_PI / D) : 0;
        vectors[i].radius = radius;
        vectors[i].N = N;
        vectors[i].D = D;
        vectors[i].angularDelta = angularDelta;
    }

    let pixelSize = zParseInt(document.getElementById('pixelSize').value, 1);
    let len = parseInt(document.getElementById('snakeLength').value);
    if (!isNaN(len) && len > 1) maxTrailLength = len;

    // Robust scaleFactor to fit all vectors in canvas
    let totalNominal = vectors.reduce((sum, v) => v.D === 0 ? sum : sum + Math.abs(v.radius), 0);
    let maxRadius = (canvasSize / 2) - (pixelSize / 2) - 2;
    let scaleFactor = totalNominal !== 0 ? maxRadius / totalNominal : 1;
    for (let v of vectors) {
        if (v.D === 0) continue;
        v.scaledRadius = v.radius * scaleFactor;
    }

    // Advance vector angles, reset at cycle (for each D)
    for (let v of vectors) {
        if (v.D === 0) continue;
        v.angle += v.angularDelta;
        v.steps = ((v.steps ?? 0) + 1) % v.D;
        if (v.steps === 0) {
            v.angle = v.initialAngle;
        }
    }

    // Sum vectors (with correct scale)
    let x = centerX, y = centerY;
    for (let v of vectors) {
        if (v.D === 0) continue;
        x += v.scaledRadius * Math.cos(v.angle);
        y += v.scaledRadius * Math.sin(v.angle);
    }
    let head = { x, y, pixelSize };

    // --- Safe push and erase logic with pixelVisits map and snapped coords ---

    addPixelWithMap(head.x, head.y, head.pixelSize);
    trail.push(head);

    // If the trail is longer than maxTrailLength, instantly remove all excess (using splice)
    if (trail.length > maxTrailLength) {
        let excess = trail.splice(0, trail.length - maxTrailLength);
        for (let old of excess) {
            removePixelWithMap(old.x, old.y, old.pixelSize);
        }
    }
}

// Map-based helpers for safe trail erasure with overlap protection
function pixelKey(x, y) {
    return `${Math.round(x)}_${Math.round(y)}`;
}

function addPixelWithMap(x, y, px) {
    let k = pixelKey(x, y);
    pixelVisits[k] = (pixelVisits[k] || 0) + 1;
    setPixel(x, y, color(255,0,0), px);
}

function removePixelWithMap(x, y, px) {
    let k = pixelKey(x, y);
    if (pixelVisits[k]) {
        pixelVisits[k]--;
        if (pixelVisits[k] === 0) {
            setPixel(x, y, color(30), px); // erase with background
            delete pixelVisits[k];
        }
    }
}

function setPixel(x, y, c, pixelSize) {
    noStroke();
    fill(c);
    // Snap drawing to rounded grid, matching pixelKey logic
    rect(Math.round(x), Math.round(y), pixelSize, pixelSize);
}

function keyPressed() {
    if (key === 's') {
        saveCanvas('radiarc_epicycle_snake', 'png');
    }
}

// Clear+Reset handler
function clearAndReset() {
    background(30);
    pixelVisits = {};
    trail = [];
    // Set each vector's initialAngle and angle to current value ("freezes" current configuration)
    for (let v of vectors) {
        v.initialAngle = v.angle;
    }
}