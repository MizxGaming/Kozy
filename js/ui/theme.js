import { state } from '../core/state.js';
import { elements } from '../core/dom.js';

export function initTheme() {
    updateClockAndGreeting();
    // Precise clock sync
    const msUntilNextSecond = 1000 - new Date().getMilliseconds();
    setTimeout(() => {
        updateClockAndGreeting();
        setInterval(updateClockAndGreeting, 1000);
    }, msUntilNextSecond);

    setWallpaper(state.settings.bg);

    // Settings listeners
    elements.settingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('hidden'));
    elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.add('hidden'));

    elements.userNameInput.value = state.settings.name;
    elements.userNameInput.addEventListener('input', (e) => {
        state.settings.name = e.target.value;
        localStorage.setItem('cozyName', state.settings.name);
        updateClockAndGreeting();
    });

    elements.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => setWallpaper(btn.dataset.bg));
    });

    elements.bgUpload.addEventListener('change', handleWallpaperUpload);

    // About Modal
    elements.aboutBtn.addEventListener('click', () => elements.aboutModal.classList.remove('hidden'));
    elements.closeAboutModal.addEventListener('click', () => elements.aboutModal.classList.add('hidden'));

    // Global Escape Listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.settingsModal.classList.add('hidden');
            elements.aboutModal.classList.add('hidden');
        }
    });
}

export function updateClockAndGreeting() {
    const now = new Date();
    elements.clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.date.innerText = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    
    const hour = now.getHours();
    let greet = "Good Morning";
    if (hour >= 12) greet = "Good Afternoon";
    if (hour >= 18) greet = "Good Evening";
    elements.greeting.innerText = state.settings.name ? `${greet}, ${state.settings.name}` : greet;
}

export function setWallpaper(url) {
    if (!url) return;
    document.documentElement.style.setProperty('--current-bg', `url('${url}')`);
    state.settings.bg = url;
    localStorage.setItem('cozyBg', url);
    updateAccentColor(url);
}

function updateAccentColor(url) {
    if (!state.settings.dynamicColors) return;
    const img = new Image();
    if (url.startsWith('http')) img.crossOrigin = "Anonymous";
    
    img.src = url;
    img.onload = () => {
        try {
            // Robust Averaging: Sample a 50x50 grid instead of relying on browser downscaling
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const sampleSize = 50;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            
            // Draw image scaled to 50x50
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
            
            let rSum = 0, gSum = 0, bSum = 0;
            const totalPixels = sampleSize * sampleSize;

            for (let i = 0; i < totalPixels; i++) {
                rSum += data[i * 4];
                gSum += data[i * 4 + 1];
                bSum += data[i * 4 + 2];
            }

            const r = Math.round(rSum / totalPixels);
            const g = Math.round(gSum / totalPixels);
            const b = Math.round(bSum / totalPixels);
            
            // Convert to HSL
            let [h, s, l] = rgbToHsl(r, g, b);
            
            // Adjust for aesthetic UI accent
            // 1. Boost saturation to avoid grays (at least 60%, max 90%)
            s = Math.max(0.6, Math.min(s, 0.9)); 
            
            // 2. Fix lightness for readability (sweet spot around 75-80%)
            l = 0.75; 

            // Convert back to RGB
            const [newR, newG, newB] = hslToRgb(h, s, l);
            
            const accent = `rgb(${newR}, ${newG}, ${newB})`;
            document.documentElement.style.setProperty('--accent', accent);
            document.documentElement.style.setProperty('--accent-rgb', `${newR}, ${newG}, ${newB}`);
            localStorage.setItem('cozyAccent', accent);
        } catch (e) {
            console.error("Could not extract accent color:", e);
        }
    };
}

// --- HSL Helpers ---
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                const max = 1920;
                if (width > max || height > max) {
                    if (width > height) { height *= max / width; width = max; }
                    else { width *= max / height; height = max; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                try { setWallpaper(dataUrl); } catch (err) { alert("Image too large."); }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}
