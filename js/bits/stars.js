import { state } from '../core/state.js';
import { elements } from '../core/dom.js';
import { getLocalDate } from '../core/utils.js';

export const constellations = [
    { name: "Ursa Minor", stars: [[85, 20], [75, 25], [65, 30], [55, 32], [50, 45], [30, 50], [35, 35]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]] },
    { name: "Orion", stars: [[30, 20], [70, 25], [45, 50], [50, 49], [55, 48], [35, 80], [65, 75]], lines: [[0,2], [1,4], [2,3], [3,4], [2,5], [4,6], [0,1], [5,6]] },
    { name: "Cassiopeia", stars: [[10, 20], [30, 50], [50, 30], [70, 50], [90, 20]], lines: [[0,1], [1,2], [2,3], [3,4]] },
    { name: "Big Dipper", stars: [[10, 30], [25, 35], [40, 45], [55, 55], [80, 55], [80, 80], [55, 80]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]] },
    { name: "Scorpius", stars: [[80, 20], [75, 28], [70, 35], [65, 45], [60, 55], [55, 65], [50, 75], [40, 80], [30, 75], [25, 65], [30, 55], [40, 50]], lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8], [8,9], [9,10], [10,11]] },
    { name: "Gemini", stars: [[30, 10], [70, 10], [35, 30], [65, 30], [30, 50], [70, 50], [20, 80], [40, 80], [60, 80], [80, 80]], lines: [[0,2], [2,4], [4,6], [4,7], [1,3], [3,5], [5,8], [5,9]] },
    { name: "Leo", stars: [[70, 30], [60, 20], [50, 25], [45, 40], [50, 55], [80, 55], [90, 45], [20, 50], [10, 60]], lines: [[0,1], [1,2], [2,3], [3,4], [4,0], [4,5], [5,6], [0,6], [4,7], [7,8]] },
    { name: "Cygnus", stars: [[50, 10], [50, 40], [50, 60], [50, 85], [20, 50], [80, 50]], lines: [[0,1], [1,2], [2,3], [4,1], [1,5]] },
    { name: "Taurus", stars: [[50, 50], [60, 60], [40, 60], [30, 70], [70, 70], [20, 30], [80, 30]], lines: [[0,1], [0,2], [2,3], [1,4], [2,5], [1,6]] },
    { name: "Canis Major", stars: [[50, 20], [45, 30], [55, 30], [50, 50], [30, 70], [70, 70], [50, 85]], lines: [[0,1], [0,2], [1,3], [2,3], [3,4], [3,5], [3,6]] },
    { name: "Aquarius", stars: [[40, 10], [50, 20], [60, 20], [50, 35], [40, 40], [50, 50], [60, 55], [50, 65], [40, 70], [50, 80]], lines: [[0,1], [1,2], [1,3], [3,4], [4,5], [5,6], [6,7], [7,8], [8,9]] },
    { name: "Lyra", stars: [[20, 20], [40, 25], [50, 45], [40, 65], [25, 60]], lines: [[0,1], [1,2], [2,3], [3,4], [4,1]] }
];

let starAnimFrame = null;
let bgStars = [];

export function initStars() {
    renderStars();
    elements.starsInfoBtn.addEventListener('click', () => toggleStarsHierarchy(true));
    elements.closeStarsHierarchyBtn.addEventListener('click', () => toggleStarsHierarchy(false));
    
    elements.shuffleStarsBtn.addEventListener('click', () => {
        elements.starsCanvas.style.transition = 'opacity 0.5s ease';
        elements.starsCanvas.style.opacity = '0';
        setTimeout(() => {
            state.stars.shuffleOffset = (state.stars.shuffleOffset + 1) % constellations.length;
            localStorage.setItem('cozyStarsOffset', state.stars.shuffleOffset);
            bgStars = [];
            renderStars();
            elements.starsCanvas.style.opacity = '1';
        }, 500);
    });
}

export function renderStars() {
    const canvas = elements.starsCanvas;
    if (!canvas) return;
    if (starAnimFrame) cancelAnimationFrame(starAnimFrame);
    const ctx = canvas.getContext('2d');
    const today = getLocalDate();
    const mins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    const totalStarsEarned = Math.floor(mins / 5); 
    const viewIndex = state.stars.shuffleOffset % constellations.length;
    const currentConst = constellations[viewIndex];
    
    let starsSpent = 0;
    for (let i = 0; i < viewIndex; i++) starsSpent += constellations[i].stars.length;
    const availableForCurrent = Math.max(0, totalStarsEarned - starsSpent);
    const starsInThisCycle = Math.min(availableForCurrent, currentConst.stars.length);
    const isCompleted = starsInThisCycle >= currentConst.stars.length;
    const starCount = Math.min(totalStarsEarned, 300);

    if (bgStars.length !== starCount) {
        bgStars = [];
        for(let i=0; i<starCount; i++) {
            bgStars.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0002, vy: (Math.random() - 0.5) * 0.0002, size: Math.random() * 1.5 + 0.5, blinkSpeed: Math.random() * 0.002 + 0.0005 });
        }
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) { starAnimFrame = requestAnimationFrame(draw); return; }
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
            canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
            ctx.scale(dpr, dpr);
        }
        const w = rect.width, h = rect.height;
        ctx.clearRect(0, 0, w, h);
        const time = Date.now();

        bgStars.forEach(s => {
            s.x += s.vx; s.y += s.vy;
            if (s.x < 0) s.x = 1; if (s.x > 1) s.x = 0;
            if (s.y < 0) s.y = 1; if (s.y > 1) s.y = 0;
            ctx.globalAlpha = 0.2 + Math.abs(Math.sin(time * s.blinkSpeed + s.x * 10)) * 0.3;
            ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI*2); ctx.fill();
        });

        if (starCount === 0) {
            ctx.globalAlpha = 0.6; ctx.fillStyle = "white"; ctx.font = "12px 'Space Mono', monospace"; ctx.textAlign = "center";
            ctx.fillText("No stars earned today.", w/2, h/2 - 10); ctx.fillText("Focus for 5 mins to start!", w/2, h/2 + 10);
            starAnimFrame = requestAnimationFrame(draw); return;
        }

        let minX = 100, maxX = 0, minY = 100, maxY = 0;
        currentConst.stars.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
        const cW = Math.max(maxX - minX, 1), cH = Math.max(maxY - minY, 1);
        const availW = Math.max(w - 60, 20), availH = Math.max(h - 80, 20);
        const scale = Math.min(availW / (cW * w / 100 || 1), availH / (cH * h / 100 || 1));
        const centerX = w / 2, centerY = h / 2 - 10;
        
        const project = (p, index) => {
            const floatX = Math.sin(time * 0.0002 + index) * 2, floatY = Math.cos(time * 0.0003 + index) * 2;
            return [(p[0] - minX - cW/2) * (w/100) * scale + centerX + floatX, (p[1] - minY - cH/2) * (h/100) * scale + centerY + floatY];
        };

        if (isCompleted) {
             ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5; ctx.beginPath();
             currentConst.lines.forEach(l => { const p1 = project(currentConst.stars[l[0]], l[0]), p2 = project(currentConst.stars[l[1]], l[1]); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); });
             ctx.stroke();
             ctx.globalAlpha = 0.8; ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
             ctx.font = "bold 12px Quicksand"; ctx.textAlign = "center"; ctx.fillText(currentConst.name, w/2, h - 15);
        } else {
             ctx.globalAlpha = 0.5; ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
             ctx.font = "10px Quicksand"; ctx.textAlign = "center"; ctx.fillText(`${currentConst.name} (${starsInThisCycle}/${currentConst.stars.length})`, w/2, h - 15);
        }

        currentConst.stars.forEach((p, i) => {
            if (i < starsInThisCycle || isCompleted) {
                const pos = project(p, i);
                const alpha = 0.5 + Math.abs(Math.sin(time * 0.002 + i)) * 0.5;
                const grad = ctx.createRadialGradient(pos[0], pos[1], 1, pos[0], pos[1], 6);
                grad.addColorStop(0, "white"); grad.addColorStop(0.4, "rgba(255,255,255,0.8)"); grad.addColorStop(1, "rgba(255,255,255,0)");
                ctx.globalAlpha = alpha; ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(pos[0], pos[1], 6, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1; ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(pos[0], pos[1], 2, 0, Math.PI*2); ctx.fill();
            }
        });
        starAnimFrame = requestAnimationFrame(draw);
    }
    draw();
}

export function toggleStarsHierarchy(show) {
    elements.bitsPanel.classList.toggle('expanded', show);
    elements.historyPanel.classList.toggle('collapsed', show);
    if (show) {
        populateStarsHierarchy();
        elements.starsMainView.classList.add('hidden-inward');
        elements.starsHierarchyView.classList.remove('hidden-outward');
    } else {
        elements.starsHierarchyView.classList.add('hidden-inward');
        elements.starsMainView.classList.remove('hidden-outward');
    }
}

function populateStarsHierarchy() {
    const today = getLocalDate();
    const mins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    const totalStarsEarned = Math.floor(mins / 5);
    elements.starsHierarchyList.innerHTML = '';
    let cumulativeStars = 0;
    constellations.forEach((c, i) => {
        cumulativeStars += c.stars.length;
        const isCompleted = totalStarsEarned >= cumulativeStars;
        const isUnlocked = totalStarsEarned >= (cumulativeStars - c.stars.length + 1);
        const item = document.createElement('div');
        item.className = `hierarchy-item ${isCompleted ? 'unlocked' : ''}`;
        let progressText = isCompleted ? `<i class="fas fa-check-circle"></i> Completed` : 
                           isUnlocked ? `<i class="fas fa-star"></i> ${totalStarsEarned - (cumulativeStars - c.stars.length)}/${c.stars.length} stars` : 
                           `<i class="fas fa-lock"></i> Unlocks at ${cumulativeStars - c.stars.length} stars`;
        item.innerHTML = `<div class="hierarchy-name">${i + 1}. ${c.name}</div><div class="hierarchy-info"><div>${c.stars.length} stars (${c.stars.length * 5} mins)</div><div style="font-size: 0.75rem; opacity: 0.8">${progressText}</div></div>`;
        elements.starsHierarchyList.appendChild(item);
    });
}
