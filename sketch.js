// Radiarc Epicycle Snake - Refactored for color segments and preset support

const MARGIN = 40;
const vectorCount = window.vectorCount || 8;
const stopHistory = new Map();

let vectors = [];
let nominalCycleLength = 0n;
let trail= [];
let posted = 0;
let time = -1;
let onsize = 0;
let cycleLength = time + 1;
let maxTrailLength = 0;
let lastTL = maxTrailLength;
let pixelSize = 2;
let scaleFactor;
let maxrad;
let minrad;
let refreshRate = 1024;
let refresh = 0;

// Utility
function mapTrack() {
    const register = [];
//     var invalid = 0;
    stopHistory.forEach((stop, sKey) => {
/*
       let dz = stopHistory.get(sKey).dz;
 */
       let dz = stop.dz;
       while (register.length <= dz) register.push(0);
       register[dz] += 1;
    });
//     console.log("mapTrack - undefined:", invalid);
    console.log("mapTrack:", register);
}

// Color control variables
window.colorSegments = window.colorSegments || [{ length: 1, pixelColor: [255, 0, 0] }];

function getColorStep() {
    const el = document.getElementById('colorStep');
    if (!el) return 1;
    const n = parseInt(el.value, 10);
    return (isNaN(n) || n < 1) ? 1 : n;
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
    if (!isNaN(len) && len >= 0) {
        maxTrailLength = LCM < BigInt(2**53) ? Math.min(len, Number(LCM)) : len;
    }
    if ( maxTrailLength != lastTL && (maxTrailLength === 0 || lastTL === 0)) {
        background(30);
        stopHistory.clear();
        trail = [];
        time = -1;
    }
    lastTL = maxTrailLength;
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
/*
    maxrad = zParseInt(document.getElementById('maxrad-stat').value, 0);
 */

    // Margin-aware scaling for radii
    let gtZero = vectors.reduce((sum, v) => sum + (v.radius > 0 ? v.radius : 0), 0);
    let ltZero = vectors.reduce((sum, v) => sum - (v.radius < 0 ? v.radius : 0), 0);
//     let totalNominal = Math.hypot(gtZero, ltZero);
    let totalNominal = gtZero + ltZero;
    let pixelAdj = (pixelSize / 2) - 1;
    let maxRadius = (Math.min(width, height) / 2) - MARGIN - pixelAdj;
    scaleFactor = totalNominal !== 0 ? maxRadius / totalNominal : maxRadius / 4;

    // Live color update from colorSettings
    updateColorConfig();
    const colorStep = getColorStep();
    const colorBarLength = window.colorSegments.reduce((sum, arr) => sum + arr.length, 0);

    if (vectors.length > 0 && colorBarLength > 0 && drawSpeed > 0) {
        var colorIndex;
        var resetClock;
        let excess = 0;
        for (let step = 0; step < drawSpeed; step++) {
            // Eliminate excess pixel
            if (maxTrailLength > 0 && trail.length - excess >= maxTrailLength) {
                let stop = trail[excess]; let sKey = `${stop.xx},${stop.yy}`;
                excess += 1;
/*
if (sKey === '325,368') {
    mapTrack();
    console.log("excess load", time, "stop:", stopHistory.get(sKey).dz);
}
 */
                while (stopHistory.get(sKey).dz < 1
                && trail.length - excess >= maxTrailLength)
                {
                    stop = trail[excess]; sKey = `${stop.xx},${stop.yy}`;
                    excess += 1;
                }
                erasePixel(stop.xx, stop.yy, stopHistory.get(sKey).pz);
/*
                stopHistory.get(sKey).dz = 0;
                stopHistory.get(sKey).pz = 0;
 */
                stopHistory.get(sKey).dz -= 1;
            }
            if (maxTrailLength < 1 || trail.length - excess < maxTrailLength) {
                let dart = {resetClock: 1, _x: centerX, _y: centerY};
                getDart(dart);
                let rounded = roundXY(dart._x, dart._y);
                let head = { xx: rounded._x, yy: rounded._y, pixelSize };
                colorIndex = ((time + 1) * colorStep) % colorBarLength;
                drawPixel(head, colorIndex);
                if (maxTrailLength > 0) trail.push(head);
                let sKey = `${head.xx},${head.yy}`;
                if (!stopHistory.has(sKey)) {
                    stopHistory.set(sKey, { dz: 0, pz: 0, _x: head.xx, _y:head.yy });
                }
                stopHistory.get(sKey).dz += 1;
                let pz = stopHistory.get(sKey).pz;
                stopHistory.get(sKey).pz = Math.max(pz, head.pixelSize);
/*
if (sKey === '325,368') {
    console.log("head push", time, "stop:", stopHistory.get(sKey).dz);
}
 */
                if (dart.resetClock) {
                    cycleLength = time + 1;
                    time = -1;
                }
                time += 1;
                if (time % refreshRate === 0) refresh = 1;
            }
        }
        if (excess > 0) {
            let detail = trail.splice(0, excess);
// console.log("trail splice:", time, "length:", detail.length);
            for (let stop of detail) {
                let sKey = `${stop.xx},${stop.yy}`;
                if (stopHistory.has(sKey)
                && stopHistory.get(sKey).dz < 1) {
/*
if (sKey === '325,368') {
    console.log("tail removal", time, "stop:", stopHistory.get(sKey).dz);
}
 */
                    stopHistory.delete(sKey);
                }
            }
        }
        if (refresh) {
            maxrad = -1;
            minrad = -1;
            stopHistory.forEach((stop, sKey) => {
                let _rad = Math.round(Math.hypot(stop._x - centerX, stop._y - centerY));
                maxrad = Math.max(maxrad, _rad);
                minrad = (minrad === -1) ? _rad : Math.min(minrad, _rad);
            });
            refresh = 0;
        }
    }
    document.getElementById('lcm-stat').textContent = nominalCycleLength.toString();
    document.getElementById('time-stat').textContent = time;
    document.getElementById('maxrad-stat').textContent = `${minrad}-${maxrad}`;
    document.getElementById('posted-stat').textContent = stopHistory.size;
    document.getElementById('length-stat').textContent = trail.length;
}

// Calculate where to draw the next pixel.
function getDart(dart) {
    for (let v of vectors) {
        let m = ((time + 1) * v.N) % v.D;
        if (m !== 0 ) dart.resetClock = 0;
        let angle = v.initialAngle + m;
        let radius = scaleFactor * v.radius;
        dart._x += radius * Math.cos((TWO_PI * angle) / v.D);
        dart._y += radius * Math.sin((TWO_PI * angle) / v.D);
    }
}

// Draw pixel using color array (from colorSegments)
function drawPixel(head, colorIndex) {
    var pixelColor;
    let _x = head.xx;
    let _y = head.yy;
    let pixelSize = head.pixelSize;
    let idx = colorIndex;
    for (let seg of window.colorSegments){
        if (idx >= seg.length) idx -= seg.length
        else {
            pixelColor = seg.pixelColor;
            break;
        }
    }
    noStroke();
    fill(...pixelColor);
    rect(Math.round(_x - pixelSize / 2), Math.round(_y - pixelSize / 2), pixelSize, pixelSize);
}

function erasePixel(_x, _y, pixelSize) {
    noStroke();
    fill(30); // always background
    rect(Math.round(_x - pixelSize / 2), Math.round(_y - pixelSize / 2), pixelSize, pixelSize);
}

function keyPressed() {
   if (key === 's' && keyIsDown(CONTROL)) {
       saveCanvas(document.getElementById('presetName').value, 'png');
   }
}

function clearAndReset() {
    background(30);
    resetVectors();
    trail = [];
    time = 0;
    stopHistory.clear();
    posted = 0;
    onsize = 0;
}
