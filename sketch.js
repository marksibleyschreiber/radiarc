// Articulated snake, always centered inside fixed margin regardless of size

const MARGIN = 40;     // Margin on each edge, in pixels
const vectorCount = 8;

let vectors = [];
let trail = [];
let maxTrailLength = 300;

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

    resetVectorsAndTrail();
    document.getElementById('clearBtn').onclick = clearAndReset;
}

function resetVectorsAndTrail() {
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
}

function draw() {
    const centerX = width / 2;
    const centerY = height / 2;

    // Live update vectors
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

    // Immediate flush: if trail is too long, shorten now
    while (trail.length > maxTrailLength) {
        let old = trail.shift();
        let oldr = roundXY(old.x, old.y);
        erasePixel(oldr.x, oldr.y, old.pixelSize);
        if (trail.length > 0) {
            let next = trail[0];
            let nextr = roundXY(next.x, next.y);
            if (nextr.x === oldr.x && nextr.y === oldr.y)
                drawPixel(nextr.x, nextr.y, next.pixelSize);
        }
    }

    // Fit all vectors in canvas, margin-aware
    let totalNominal = vectors.reduce((sum, v) => v.D === 0 ? sum : sum + Math.abs(v.radius), 0);
    // Margin-aware: max radius is half canvas - MARGIN - (pixelSize/2)
    let maxRadius = (min(width, height) / 2) - MARGIN - (pixelSize / 2) - 1;
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

    // Sum vectors
    let x = centerX, y = centerY;
    for (let v of vectors) {
        if (v.D === 0) continue;
        x += v.scaledRadius * Math.cos(v.angle);
        y += v.scaledRadius * Math.sin(v.angle);
    }
    let head = { x, y, pixelSize };

    // Normal tail flush if at max length
    if (trail.length >= maxTrailLength) {
        let old = trail.shift();
        let oldr = roundXY(old.x, old.y);
        erasePixel(oldr.x, oldr.y, old.pixelSize);
        if (trail.length > 0) {
            let next = trail[0];
            let nextr = roundXY(next.x, next.y);
            if (nextr.x === oldr.x && nextr.y === oldr.y)
                drawPixel(nextr.x, nextr.y, next.pixelSize);
        }
    }

    // Add and draw the new head
    trail.push(head);
    let headr = roundXY(head.x, head.y);
    drawPixel(headr.x, headr.y, head.pixelSize);
}

// Draw the pixel so that (x, y) is the actual CENTER
function drawPixel(x, y, pixelSize) {
    noStroke();
    fill(255, 0, 0); // trail color
    rect(x - pixelSize / 2, y - pixelSize / 2, pixelSize, pixelSize);
}
function erasePixel(x, y, pixelSize) {
    noStroke();
    fill(30); // background
    rect(x - pixelSize / 2, y - pixelSize / 2, pixelSize, pixelSize);
}

function keyPressed() {
    if (key === 's') {
        saveCanvas('radiarc_epicycle_snake', 'png');
    }
}

function clearAndReset() {
    background(30);
    resetVectorsAndTrail();
    // Set each vector's initialAngle and angle to current value
    for (let v of vectors) {
        v.initialAngle = v.angle;
    }
}