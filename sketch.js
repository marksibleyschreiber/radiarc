// Radiarc Epicycle Snake - Optimized draw loop

const MARGIN = 40;
const vectorCount = window.vectorCount || 9;
const stopHistory = new Map();

var centerX;
var centerY;
let vectors = [];
let nominalCycleLength = 0n;
let trail = new BufferedQueue();
let posted = 0;
let timeUnit = 1;
let time = -1;
let cycleLength = time + 1;
let maxTrailLength = 0;
let lastTL = maxTrailLength;
let pixelSize = 2;
let pixelLayer = 1;
let scaleFactor;
let maxrad;
let minrad;
let maxfat;
const refreshStatsRate = 8192;
let refreshStats = 0;
let timeChange;
const logLimit = 1000;
let logCount = 0;
const gcdLimit = 20;
let gcdCount = 0;

// ✨ Cached drawSpeed to avoid DOM access in draw()
let cachedDrawSpeed = 0;

window.colorSegments = window.colorSegments || [{ length: 1, pixelColor: [255, 0, 0] }];

function getColorStep() {
    return window.settingsCache ? window.settingsCache.colorStep : 1;
}

function roundXY(_x, _y) {
    return { _x: Math.round(_x), _y: Math.round(_y) };
}

function gcd(a, b) {
    var a_n = BigInt(a);
    var b_n = BigInt(b);
    while (b_n !== 0n) {
        let temp = b_n;
        b_n = ((a_n % b_n) + b_n) % b_n; // ✨ Python-style modulo
        a_n = temp;
    }
    if (a_n < 0n && gcdCount < gcdLimit) {
        gcdCount++;
        console.log(gcdCount, "a=", a, "b=", b, "a_n=", a_n);
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
    resetVectors(); // Initial setup
    document.getElementById('clearBtn').onclick = clearAndReset;
    document.getElementById('pit').onchange = gotoPointInTime;
    drawingContext.imageSmoothingEnabled = false;
    noSmooth();
    centerX = widthVal / 2;
    centerY = heightVal / 2;
    window.dispatchEvent(new Event('p5ready'));
}

function resetVectors() {
    vectors = [];
    let LCM = 0n;
    const cache = window.settingsCache;
    timeUnit = zParseInt(cache.timeUnit, 1);
    
    for (let i = 0; i < vectorCount; i++) {
        if (i < cache.vectorParams.length) {
            let D = zParseInt(cache.vectorParams[i].D, 0);
            let radius = zParseInt(cache.vectorParams[i].length, 0);
            let N = zParseInt(cache.vectorParams[i].N, 0);
            
            if (D * radius * N !== 0) {
                vectors.push({
                    radius: radius,
                    N: N,
                    D: D,
                    initialAngle: 0,
                });
                if (LCM === 0n) LCM = BigInt(D) / gcd(N * timeUnit, D);
                else LCM = lcm(LCM, BigInt(D) / gcd(N * timeUnit, D));
            }
        }
    }
    
    nominalCycleLength = LCM;
    pixelSize = zParseInt(cache.pixelSize, 1);
    pixelLayer = zParseInt(cache.pixelThickness, 1);
    let len = zParseInt(cache.snakeLength, 0);
    
    if (!isNaN(len) && len >= 0) {
        maxTrailLength = LCM < BigInt(2**53) ? Math.min(len, Number(LCM)) : len;
    }
    if (maxTrailLength != lastTL && (maxTrailLength === 0 || lastTL === 0)) {
        background(30);
        stopHistory.clear();
        trail = new BufferedQueue();
        window.time = -1;
    }
    lastTL = maxTrailLength;
    
    // ✨ Cache drawSpeed
    cachedDrawSpeed = zParseInt(cache.drawSpeed, 0);
    
    window.settingsDirty = false; // ✨ Clear dirty flag
}

function draw() {
    let timeStart = window.time;
    
    // ✨ ONLY recalculate if settings changed!
    if (window.settingsDirty) {
        resetVectors();
    }
    
    // ✨ Use cached drawSpeed (no DOM access!)
    let drawSpeed = cachedDrawSpeed;
    let impatience = Math.abs(maxTrailLength - trail.length) / Math.sqrt(300);
    drawSpeed = Math.max(0, drawSpeed);
    let hold_drawSpeed = drawSpeed;

    time = window.time;

    // Margin-aware scaling
    let gtZero = vectors.reduce((sum, v) => sum + (v.radius > 0 ? v.radius : 0), 0);
    let ltZero = vectors.reduce((sum, v) => sum - (v.radius < 0 ? v.radius : 0), 0);
    let totalNominal = gtZero + ltZero;
    let pixelAdj = (pixelSize / 2) - 1;
    let maxRadius = (Math.min(width, height) / 2) - MARGIN - pixelAdj;
    scaleFactor = totalNominal !== 0 ? maxRadius / totalNominal : maxRadius / 4;

    updateColorConfig();
    const colorStep = getColorStep();
    const colorBar = window.colorSegments.reduce((sum, arr) => sum + arr.length, 0);

    if (drawSpeed > 0 && impatience >= 1 && drawSpeed < impatience) {
        drawSpeed = impatience;
    }
    
    if (vectors.length > 0 && colorBar > 0 && drawSpeed > 0) {
        var colorIndex;
        for (let step = 0; step < drawSpeed; step++) {
            if (maxTrailLength > 0 && trail.length >= maxTrailLength) {
                let sKey = trail.dequeue();
                let stop = stopHistory.get(sKey);
                stop.dz -= 1;
                if (stop.dz < pixelLayer) {
                    erasePixel(stop._x, stop._y, stop.pz);
                    stop.dark = 1;
                    stop.pz = 0;
                }
                if (stop.dz < 1) {
                    stopHistory.delete(sKey);
                }
            }
            if (maxTrailLength < 1 || trail.length < maxTrailLength) {
                let dart = getDart();
                let rounded = roundXY(dart._x, dart._y);
                let head = { xx: rounded._x, yy: rounded._y, pixelSize };
                colorIndex = (((time + 1) * colorStep) % colorBar + colorBar) % colorBar; // ✨ Python-style modulo
                drawPixel(head, colorIndex);
                let sKey = `${head.xx},${head.yy}`;
                if (!stopHistory.has(sKey)) {
                    stopHistory.set(sKey, { dz: 0, pz: 0, _x: head.xx, _y: head.yy, dark: 1 });
                }
                let stop = stopHistory.get(sKey);
                stop.dz += 1;
                stop.dark = 0;
                stop.pz = Math.max(stop.pz, head.pixelSize);
                if (maxTrailLength > 0) {
                    trail.enqueue(sKey);
                }
                if (dart.resetClock) {
                    cycleLength = time + 1;
                    time = -1;
                }
                time += 1;
                window.time = time;
            }
        }
        refreshStats += 1;
        if (refreshStats % refreshStatsRate === 1) {
            maxrad = -1;
            minrad = -1;
            maxfat = -1;
            stopHistory.forEach((stop, sKey) => {
                if (!stop.dark) {
                    let _rad = Math.round(Math.hypot(stop._x - centerX, stop._y - centerY));
                    maxrad = Math.max(maxrad, _rad);
                    minrad = (minrad === -1) ? _rad : Math.min(minrad, _rad);
                    maxfat = Math.max(maxfat, stop.dz);
                }
            });
            refreshStats = 0;
        }
    }
    
    // Update stats display
    document.getElementById('lcm-stat').textContent = nominalCycleLength.toString();
    document.getElementById('time-stat').textContent = time;
    document.getElementById('maxrad-stat').textContent = `${minrad}-${maxrad}`;
    document.getElementById('hit-stat').textContent = maxfat;
    document.getElementById('posted-stat').textContent = stopHistory.size;
    document.getElementById('length-stat').textContent = trail.length;
    
    // ✨ Only update drawSpeed display if it changed
    if (cachedDrawSpeed !== hold_drawSpeed) {
        document.getElementById('drawSpeed').value = hold_drawSpeed;
    }
}

function getDart() {
    let resetC = 1;
    let c_x = centerX;
    let c_y = centerY;
    for (let v of vectors) {
        let m = (((time + 1) * v.N * timeUnit) % v.D + v.D) % v.D; // ✨ Python-style modulo
        if (m !== 0) resetC = 0;
        let angle = TWO_PI * (v.initialAngle + m);
        let radius = scaleFactor * v.radius;
        c_x += radius * Math.cos((angle) / v.D);
        c_y += radius * Math.sin((angle) / v.D);
    }
    let dart = { resetClock: resetC, _x: c_x, _y: c_y };
    return dart;
}

function drawPixel(head, colorIndex) {
    var pixelColor;
    let _x = head.xx;
    let _y = head.yy;
    let pz = head.pixelSize;
    let idx = colorIndex;
    for (let seg of window.colorSegments) {
        if (idx >= seg.length) idx -= seg.length;
        else {
            pixelColor = seg.pixelColor;
            break;
        }
    }
    noStroke();
    fill(...pixelColor);
    rect(Math.round(_x - pz / 2), Math.round(_y - pz / 2), pz, pz);
}

function erasePixel(_x, _y, pz) {
    noStroke();
    fill(30);
    rect(Math.round(_x - pz / 2), Math.round(_y - pz / 2), pz, pz);
}

function keyPressed() {
    if (key === 's' && keyIsDown(CONTROL)) {
        saveCanvas(document.getElementById('presetName').value, 'png');
    }
}

function clearAndReset() {
    background(30);
    stopHistory.clear();
    trail = new BufferedQueue();
    window.settingsDirty = true; // ✨ Force recalc
    window.time = -1;
    posted = 0;
}

function gotoPointInTime() {
    let pit = parseInt(document.getElementById('pit').value);
    if (!isNaN(pit)) {
        background(30);
        window.time = pit;
        document.getElementById('pit').value = '';
    }
}