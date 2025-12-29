// --- Global State & DOM Elements ---
const state = {
    todos: JSON.parse(localStorage.getItem('cozyTodos')) || [],
    sessions: JSON.parse(localStorage.getItem('cozySessions')) || [],
    settings: {
        name: localStorage.getItem('cozyName') || '',
        bg: localStorage.getItem('cozyBg') || 'https://images.wallpapersden.com/image/download/anime-girl-looking-at-sky-scenery_bWlma2uUmZqaraWkpJRmbmdlrWZlbWU.jpg',
        activeWidget: localStorage.getItem('cozyActiveWidget') || 'tree',
        dynamicColors: true,
    },
    timer: {
        totalSeconds: 25 * 60,
        timeLeft: 25 * 60,
        id: null,
        running: false,
        initialMinutes: 25,
    },
    analysis: {
        currentDate: getLocalDate(),
        view: 'calendar' // or 'analysis'
    }
};

const elements = {
    // Header
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    greeting: document.getElementById('greeting'),
    // Timer
    time: document.getElementById('time'),
    ring: document.querySelector('.progress-ring__circle'),
    thumb: document.querySelector('.progress-ring__thumb'),
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    soundBtn: document.getElementById('toggle-sound'),
    status: document.getElementById('timer-status'),
    taskSelect: document.getElementById('focus-task-select'),
    // To-Do
    todoInput: document.getElementById('todo-input'),
    addTodoBtn: document.getElementById('add-todo'),
    todoList: document.getElementById('todo-list'),
    // Calendar & Analysis
    calendarGrid: document.getElementById('mini-calendar'),
    todayFocus: document.getElementById('today-focus'),
    calendarView: document.getElementById('calendar-view'),
    analysisView: document.getElementById('analysis-view'),
    viewToggleBtn: document.getElementById('view-toggle-btn'),
    todayFocusBtn: document.getElementById('today-focus-btn'),
    analysisDateText: document.getElementById('analysis-date'),
    focusChart: document.getElementById('focus-chart'),
    analysisSessions: document.getElementById('analysis-sessions'),
    prevDayBtn: document.getElementById('prev-day'),
    nextDayBtn: document.getElementById('next-day'),
    // Quote
    quoteText: document.getElementById('quote-text'),
    quoteAuthor: document.getElementById('quote-author'),
    newQuoteBtn: document.getElementById('new-quote'),
    // Settings
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsBtn: document.getElementById('close-settings'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    bgUpload: document.getElementById('bg-upload'),
    userNameInput: document.getElementById('user-name'),
    // Modular Widgets
    switchBtns: document.querySelectorAll('.switch-btn'),
    widgetContents: document.querySelectorAll('.widget-content'),
    treeDisplay: document.getElementById('tree-display'),
    starsDisplay: document.getElementById('stars-display'),
    petDisplay: document.getElementById('pet-display'),
    petStatus: document.getElementById('pet-status'),
    toyInfoBtn: document.getElementById('toy-info-btn'),
    toyDrawer: document.getElementById('toy-drawer'),
    toyDrawerTitle: document.getElementById('toy-drawer-title'),
    toyDrawerDesc: document.getElementById('toy-drawer-desc'),
};


// --- HELPERS ---
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// --- CLOCK, GREETING & WEATHER ---
function updateClockAndGreeting() {
    const now = new Date();
    elements.clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.date.innerText = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    
    const hour = now.getHours();
    let greet = "Good Morning";
    if (hour >= 12) greet = "Good Afternoon";
    if (hour >= 18) greet = "Good Evening";
    elements.greeting.innerText = state.settings.name ? `${greet}, ${state.settings.name}` : greet;
}


// --- TODO & TASK SELECTOR ---
function renderTodos() {
    const currentTask = elements.taskSelect.value;
    elements.todoList.innerHTML = '';
    elements.taskSelect.innerHTML = '<option value="">-- Select a Task --</option><option value="Just Focus">Just Focus</option>';

    state.todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `<span>${todo.text}</span><div class="todo-actions"><button class="check-btn" onclick="toggleTodo(${index})"><i class="fas fa-check"></i></button><button class="delete-btn" onclick="deleteTodo(${index})"><i class="fas fa-trash"></i></button></div>`;
        elements.todoList.appendChild(li);

        if (!todo.completed) {
            const opt = document.createElement('option');
            opt.value = todo.text;
            opt.innerText = todo.text;
            elements.taskSelect.appendChild(opt);
        }
    });
    
    if (currentTask && elements.taskSelect.querySelector(`option[value="${currentTask}"]`)) {
        elements.taskSelect.value = currentTask;
    }
    
    localStorage.setItem('cozyTodos', JSON.stringify(state.todos));
}
window.toggleTodo = (i) => { state.todos[i].completed = !state.todos[i].completed; renderTodos(); };
window.deleteTodo = (i) => { state.todos.splice(i, 1); renderTodos(); };

function addTodo() {
    const text = elements.todoInput.value.trim();
    if (text) {
        state.todos.push({ text, completed: false });
        elements.todoInput.value = '';
        renderTodos();
    }
}
elements.addTodoBtn.addEventListener('click', addTodo);
elements.todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });


// --- TIMER ---
const circumference = elements.ring.r.baseVal.value * 2 * Math.PI;
elements.ring.style.strokeDasharray = `${circumference} ${circumference}`;

function updateTimerDisplay() {
    elements.time.innerText = formatTime(state.timer.timeLeft);
    const percent = ((state.timer.totalSeconds - state.timer.timeLeft) / state.timer.totalSeconds) * 100;
    
    // Darkening progress: starts at 0 (full offset) and goes to 100 (0 offset)
    const offset = circumference - (percent / 100) * circumference;
    elements.ring.style.strokeDashoffset = offset;

    // Thumb position: starts at top (-90 degrees)
    const angle = (percent / 100) * 360 - 90;
    const radius = 140;
    const cx = 150, cy = 150;
    const x = cx + radius * Math.cos(angle * Math.PI / 180);
    const y = cy + radius * Math.sin(angle * Math.PI / 180);
    
    elements.thumb.setAttribute('cx', x);
    elements.thumb.setAttribute('cy', y);
}

function finishTimer() {
    clearInterval(state.timer.id);
    state.timer.running = false;
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.status.innerText = "Session Complete";
    updatePet();
    
    saveSession(state.timer.initialMinutes, elements.taskSelect.value || "Just Focus");
    
    if (Notification.permission === "granted") new Notification("Focus Complete!");
    // You would add audio stop logic here
}

elements.startBtn.addEventListener('click', () => {
    if (state.timer.running) {
        clearInterval(state.timer.id);
        state.timer.running = false;
        elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
        elements.status.innerText = "Paused";
        updatePet();
    } else {
        if (!state.timer.timeLeft || state.timer.timeLeft === state.timer.totalSeconds) {
            const parts = elements.time.innerText.split(':');
            const mins = parseInt(parts[0]) || 25;
            state.timer.initialMinutes = mins;
            state.timer.totalSeconds = mins * 60;
            state.timer.timeLeft = state.timer.totalSeconds;
        }

        state.timer.id = setInterval(() => {
            if (state.timer.timeLeft > 0) {
                state.timer.timeLeft--;
                updateTimerDisplay();
            } else {
                finishTimer();
            }
        }, 1000);
        
        state.timer.running = true;
        elements.startBtn.innerHTML = '<i class="fas fa-pause"></i>';
        elements.status.innerText = elements.taskSelect.value ? `Focusing on: ${elements.taskSelect.value}` : "Focusing...";
        updatePet();
    }
});

elements.resetBtn.addEventListener('click', () => {
    clearInterval(state.timer.id);
    state.timer.running = false;
    state.timer.timeLeft = state.timer.totalSeconds;
    updateTimerDisplay();
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.status.innerText = "Ready";
    updatePet();
});

elements.time.addEventListener('blur', () => {
    let mins = parseInt(elements.time.innerText) || 25;
    state.timer.initialMinutes = mins;
    state.timer.totalSeconds = mins * 60;
    state.timer.timeLeft = mins * 60;
    elements.time.innerText = formatTime(state.timer.timeLeft);
    elements.status.innerText = "Ready";
});
elements.time.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); elements.time.blur(); }
});


// --- QUOTES (LOCAL) ---
const quotes = [
    { q: "The way to get started is to quit talking and begin doing.", a: "Walt Disney" },
    { q: "Your time is limited, don't waste it living someone else's life.", a: "Steve Jobs" },
    { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" }
];
function fetchQuote() {
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    elements.quoteText.innerText = `"${random.q}"`;
    elements.quoteAuthor.innerText = `- ${random.a}`;
}
elements.newQuoteBtn.addEventListener('click', fetchQuote);


// --- CALENDAR & HISTORY ---
function saveSession(minutes, task) {
    const today = getLocalDate();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    state.sessions.push({ date: today, minutes, task, time: timestamp });
    localStorage.setItem('cozySessions', JSON.stringify(state.sessions));
    renderCalendar();
    renderAnalysis();
    renderStars();
    renderTree();
}

function toggleHistoryView() {
    state.analysis.view = state.analysis.view === 'calendar' ? 'analysis' : 'calendar';
    elements.calendarView.classList.toggle('hidden', state.analysis.view !== 'calendar');
    elements.analysisView.classList.toggle('hidden', state.analysis.view !== 'analysis');
    
    const icon = elements.viewToggleBtn.querySelector('i');
    if (state.analysis.view === 'analysis') {
        icon.className = 'fas fa-calendar-alt';
        renderAnalysis();
    } else {
        icon.className = 'fas fa-chart-line';
        renderCalendar();
    }
}

function renderAnalysis() {
    const targetDate = state.analysis.currentDate;
    const isToday = targetDate === getLocalDate();
    elements.analysisDateText.innerText = isToday ? 'Today' : targetDate;

    const daySessions = state.sessions.filter(s => s.date === targetDate);
    
    // Render Chart (24 bars for 24 hours)
    elements.focusChart.innerHTML = '';
    const hourlyData = new Array(24).fill(0);
    daySessions.forEach(s => {
        const hour = parseInt(s.time?.split(':')[0]) || 0;
        hourlyData[hour] += s.minutes;
    });

    const maxMins = Math.max(...hourlyData, 30); // At least 30 for scale
    hourlyData.forEach((mins, hour) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(mins / maxMins) * 100}%`;
        bar.setAttribute('data-time', `${hour}:00 - ${mins}m`);
        elements.focusChart.appendChild(bar);
    });

    // Render Sessions List
    elements.analysisSessions.innerHTML = '';
    if (daySessions.length === 0) {
        elements.analysisSessions.innerHTML = '<li class="session-item"><span>No sessions recorded</span></li>';
    } else {
        daySessions.slice().reverse().forEach(s => {
            const li = document.createElement('li');
            li.className = 'session-item';
            li.innerHTML = `<span>${s.time || '--'} - ${s.task}</span> <span>${s.minutes}m</span>`;
            elements.analysisSessions.appendChild(li);
        });
    }
}

function renderCalendar() {
    const today = new Date();
    const todayStr = getLocalDate(today);
    const todaysMinutes = state.sessions.filter(s => s.date === todayStr).reduce((acc, curr) => acc + curr.minutes, 0);
    
    if (elements.todayFocus) {
        elements.todayFocus.innerText = `${todaysMinutes}m focused today`;
    }

    if (elements.calendarGrid) {
        elements.calendarGrid.innerHTML = '';
        for (let i = 27; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dStr = getLocalDate(d);
            
            const dayMinutes = state.sessions.filter(s => s.date === dStr).reduce((acc, curr) => acc + curr.minutes, 0);

            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            if (dStr === todayStr) cell.classList.add('today');
            if (dayMinutes > 0) {
                cell.classList.add('focused');
                if (dayMinutes > 60) cell.classList.add('focused-heavy');
            }
            
            cell.innerText = d.getDate();
            cell.title = `${dStr}: ${dayMinutes} mins`;
            elements.calendarGrid.appendChild(cell);
        }
    }

    if (elements.sessionHistory) {
        elements.sessionHistory.innerHTML = '';
        state.sessions.slice(-5).reverse().forEach(s => {
            const li = document.createElement('li');
            li.className = 'session-item';
            li.innerHTML = `<span>${s.task}</span> <span>${s.minutes}m</span>`;
            elements.sessionHistory.appendChild(li);
        });
    }
}


// --- SETTINGS ---
function setWallpaper(url) {
    if (!url) return;
    document.documentElement.style.setProperty('--current-bg', `url('${url}')`);
    state.settings.bg = url;
    localStorage.setItem('cozyBg', url);
    updateAccentColor(url);
}

function updateAccentColor(url) {
    if (!state.settings.dynamicColors) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1, canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        // Lighten the color for accent
        const accent = `rgb(${Math.min(r + 80, 255)}, ${Math.min(g + 80, 255)}, ${Math.min(b + 80, 255)})`;
        document.documentElement.style.setProperty('--accent', accent);
        localStorage.setItem('cozyAccent', accent);
    };
}

elements.settingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('hidden'));
elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.add('hidden'));

elements.userNameInput.value = state.settings.name;
elements.userNameInput.addEventListener('input', (e) => {
    state.settings.name = e.target.value;
    localStorage.setItem('cozyName', state.settings.name);
    updateClockAndGreeting();
});

elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const bg = btn.dataset.bg;
        setWallpaper(bg);
    });
});

elements.bgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to ensure it fits in localStorage
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max = 1920;
                
                if (width > max || height > max) {
                    if (width > height) {
                        height *= max / width;
                        width = max;
                    } else {
                        width *= max / height;
                        height = max;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Use JPEG with 0.7 quality for good balance of size/looks
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                try {
                    setWallpaper(dataUrl);
                } catch (err) {
                    alert("Image too large to save even after compression.");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});


// --- MODULAR WIDGETS ---
const toyDescriptions = {
    tree: { title: "Focus Tree", desc: "Watch your progress grow from a tiny seed into a flowering tree as you focus." },
    mixer: { title: "Zen Mixer", desc: "Craft your perfect ambient atmosphere by blending rain, wind, cafe, and fire sounds." },
    stars: { title: "Focus Stars", desc: "Build your own constellation; a new star is born for every 5 minutes of focused work." },
    pet: { title: "Focus Pet", desc: "A tiny robot companion that stays active while you work and rests when you're done." },
    pulse: { title: "Focus Pulse", desc: "A gentle visual rhythm designed to help you synchronize your breathing and stay calm." }
};

function updateToyDrawer() {
    const data = toyDescriptions[state.settings.activeWidget];
    if (data) {
        elements.toyDrawerTitle.innerText = data.title;
        elements.toyDrawerDesc.innerText = data.desc;
    }
}

function initWidgets() {
    const switcher = document.querySelector('.widget-switcher');
    const widgetContents = document.querySelectorAll('.widget-content');

    if (!switcher) return;

    switcher.addEventListener('click', (e) => {
        const btn = e.target.closest('.switch-btn');
        if (!btn) return;

        const target = btn.getAttribute('data-widget');
        state.settings.activeWidget = target;
        localStorage.setItem('cozyActiveWidget', target);
        
        // Update buttons
        document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        widgetContents.forEach(content => {
            const isTarget = content.id === `widget-${target}`;
            content.classList.toggle('hidden', !isTarget);
        });

        // Trigger specific renders
        if (target === 'tree') renderTree();
        if (target === 'stars') renderStars();
        if (target === 'pet') updatePet();

        // Update drawer content
        updateToyDrawer();
    });

    // Info button toggle
    elements.toyInfoBtn.addEventListener('click', () => {
        elements.toyDrawer.classList.toggle('open');
        const icon = elements.toyInfoBtn.querySelector('i');
        if (elements.toyDrawer.classList.contains('open')) {
            icon.className = 'fas fa-times-circle';
        } else {
            icon.className = 'fas fa-question-circle';
        }
    });

    // Restore initial widget
    const initialBtn = document.querySelector(`.switch-btn[data-widget="${state.settings.activeWidget}"]`);
    if (initialBtn) initialBtn.click();
}

// Close settings with Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        elements.settingsModal.classList.add('hidden');
    }
});

function renderStars() {
    const today = getLocalDate();
    const mins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    const starCount = Math.floor(mins / 5); // 1 star per 5 mins
    
    elements.starsDisplay.innerHTML = '';
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        elements.starsDisplay.appendChild(star);
    }
}

function updatePet() {
    if (state.timer.running) {
        elements.petDisplay.classList.add('active');
        elements.petStatus.innerText = "Focusing with you!";
    } else {
        elements.petDisplay.classList.remove('active');
        elements.petStatus.innerText = "Pet is resting...";
    }
}

function renderTree() {
    const today = getLocalDate();
    const mins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    
    let stage = 0; // Seed
    if (mins > 10) stage = 1; // Sprout
    if (mins > 30) stage = 2; // Sapling
    if (mins > 60) stage = 3; // Small Tree
    if (mins > 120) stage = 4; // Full Tree
    if (mins > 240) stage = 5; // Flowering

    const colors = [
        '#8B4513', // Trunk
        getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#d8b4e2' // Leaves
    ];

    const trees = [
        `<svg viewBox="0 0 100 100"><circle cx="50" cy="80" r="5" fill="${colors[0]}"/></svg>`, // Seed
        `<svg viewBox="0 0 100 100"><path d="M50 80 L50 60" stroke="${colors[0]}" stroke-width="4"/><circle cx="50" cy="55" r="10" fill="${colors[1]}"/></svg>`, // Sprout
        `<svg viewBox="0 0 100 100"><path d="M50 80 L50 40" stroke="${colors[0]}" stroke-width="6"/><circle cx="50" cy="35" r="20" fill="${colors[1]}"/></svg>`, // Sapling
        `<svg viewBox="0 0 100 100"><path d="M50 80 L50 30" stroke="${colors[0]}" stroke-width="8"/><circle cx="40" cy="30" r="15" fill="${colors[1]}"/><circle cx="60" cy="30" r="15" fill="${colors[1]}"/><circle cx="50" cy="20" r="20" fill="${colors[1]}"/></svg>`, // Tree
        `<svg viewBox="0 0 100 100"><path d="M50 80 L50 20" stroke="${colors[0]}" stroke-width="10"/><circle cx="35" cy="30" r="18" fill="${colors[1]}"/><circle cx="65" cy="30" r="18" fill="${colors[1]}"/><circle cx="50" cy="15" r="22" fill="${colors[1]}"/><circle cx="50" cy="40" r="15" fill="${colors[1]}"/></svg>`, // Full
        `<svg viewBox="0 0 100 100"><path d="M50 80 L50 20" stroke="${colors[0]}" stroke-width="10"/><circle cx="35" cy="30" r="18" fill="${colors[1]}"/><circle cx="65" cy="30" r="18" fill="${colors[1]}"/><circle cx="50" cy="15" r="22" fill="${colors[1]}"/><circle cx="50" cy="40" r="15" fill="${colors[1]}"/><circle cx="30" cy="25" r="4" fill="white"/><circle cx="70" cy="25" r="4" fill="white"/><circle cx="50" cy="10" r="4" fill="white"/></svg>` // Flowering
    ];

    elements.treeDisplay.innerHTML = trees[stage];
}


// --- ZEN MIXER (AUDIO) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const channels = {};
let brownNoiseChannel = null;
let brownNoisePlaying = false;

function createNoise(type) {
    const bufferSize = 2 * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    // Filter for different "types" of noise
    const filter = audioCtx.createBiquadFilter();
    if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 500;
    } else if (type === 'wind') {
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
    } else {
        filter.type = 'lowpass';
        filter.frequency.value = 300;
    }

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    whiteNoise.start();

    return gainNode;
}

function initMixer() {
    const sliders = document.querySelectorAll('.mixer-slider');
    const types = ['rain', 'wind', 'cafe', 'fire'];
    const savedVols = JSON.parse(localStorage.getItem('cozyMixer')) || [0, 0, 0, 0];
    
    sliders.forEach((slider, index) => {
        const type = types[index];
        // Create noise only once
        if (!channels[type]) {
            channels[type] = createNoise(type);
        }

        // Restore volume
        const initialVol = savedVols[index];
        slider.value = initialVol;
        if (initialVol > 0) {
            channels[type].gain.setTargetAtTime((initialVol / 100) * 0.4, audioCtx.currentTime, 0.1);
        }

        slider.oninput = (e) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const vol = e.target.value / 100;
            channels[type].gain.setTargetAtTime(vol * 0.4, audioCtx.currentTime, 0.1);
            
            // Save volumes
            const currentVols = Array.from(sliders).map(s => s.value);
            localStorage.setItem('cozyMixer', JSON.stringify(currentVols));
        };
    });
}

elements.soundBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!brownNoiseChannel) {
        brownNoiseChannel = createNoise('brown');
    }
    
    if (brownNoisePlaying) {
        brownNoiseChannel.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        brownNoisePlaying = false;
    } else {
        brownNoiseChannel.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.1);
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        brownNoisePlaying = true;
    }
});

// --- INITIALIZATION ---
function init() {
    updateClockAndGreeting();
    renderTodos();
    fetchQuote();
    renderCalendar();
    updateTimerDisplay();
    setWallpaper(state.settings.bg);
    initWidgets();
    
    try {
        initMixer();
    } catch (e) {
        console.warn("Mixer could not be initialized:", e);
    }

    renderStars();
    updatePet();

    // History & Analysis listeners
    elements.viewToggleBtn.addEventListener('click', toggleHistoryView);
    elements.todayFocusBtn.addEventListener('click', () => {
        state.analysis.currentDate = getLocalDate();
        state.analysis.view = 'calendar'; // Set to flip to analysis
        toggleHistoryView();
    });

    elements.prevDayBtn.addEventListener('click', () => {
        const d = new Date(state.analysis.currentDate);
        d.setDate(d.getDate() - 1);
        state.analysis.currentDate = getLocalDate(d);
        renderAnalysis();
    });

    elements.nextDayBtn.addEventListener('click', () => {
        const d = new Date(state.analysis.currentDate);
        d.setDate(d.getDate() + 1);
        state.analysis.currentDate = getLocalDate(d);
        renderAnalysis();
    });
}

init();
