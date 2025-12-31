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
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1, canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const data = ctx.getImageData(0, 0, 1, 1).data;
            const [r, g, b] = data;
            
            const r1 = Math.min(r + 80, 255);
            const g1 = Math.min(g + 80, 255);
            const b1 = Math.min(b + 80, 255);
            
            const accent = `rgb(${r1}, ${g1}, ${b1})`;
            document.documentElement.style.setProperty('--accent', accent);
            document.documentElement.style.setProperty('--accent-rgb', `${r1}, ${g1}, ${b1}`);
            localStorage.setItem('cozyAccent', accent);
        } catch (e) {
            console.error("Could not extract accent color:", e);
        }
    };
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
