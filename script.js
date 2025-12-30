// --- Global State & DOM Elements ---
const state = {
    todos: JSON.parse(localStorage.getItem('cozyTodos')) || [],
    sessions: JSON.parse(localStorage.getItem('cozySessions')) || [],
    settings: {
        name: localStorage.getItem('cozyName') || '',
        bg: localStorage.getItem('cozyBg') || 'https://images.wallpapersden.com/image/download/anime-girl-looking-at-sky-scenery_bWlma2uUmZqaraWkpJRmbmdlrWZlbWU.jpg',
        activeWidget: localStorage.getItem('cozyActiveWidget') || 'mixer',
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
    },
    stars: {
        shuffleOffset: parseInt(localStorage.getItem('cozyStarsOffset')) || 0
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
    historyPanel: document.querySelector('.history-panel'),
    toysPanel: document.querySelector('.toys-panel'),
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
    starsCanvas: document.getElementById('stars-canvas'),
    shuffleStarsBtn: document.getElementById('shuffle-stars'),
    petDisplay: document.getElementById('pet-display'),
    petStatus: document.getElementById('pet-status'),
    toyInfoBtn: document.getElementById('toy-info-btn'),
    toyDrawer: document.getElementById('toy-drawer'),
    toyDrawerTitle: document.getElementById('toy-drawer-title'),
    toyDrawerDesc: document.getElementById('toy-drawer-desc'),
    // Corner Widgets & Presets
    ambientIndicators: document.querySelectorAll('#ambient-indicators i'),
    focusVisualizer: document.getElementById('focus-visualizer'),
    presetTimes: document.querySelectorAll('.preset-time'),
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
}

function toggleHistoryView() {
    state.analysis.view = state.analysis.view === 'calendar' ? 'analysis' : 'calendar';
    
    const isAnalysis = state.analysis.view === 'analysis';
    
    // Toggle classes for panel expansion
    elements.historyPanel.classList.toggle('expanded', isAnalysis);
    elements.toysPanel.classList.toggle('collapsed', isAnalysis);
    
    // Depth animation logic
    if (isAnalysis) {
        // Calendar fades inward, Analysis comes from outward
        elements.calendarView.classList.add('hidden-inward');
        elements.calendarView.classList.remove('hidden-outward');
        
        elements.analysisView.classList.remove('hidden-inward');
        elements.analysisView.classList.remove('hidden-outward');
        
        renderAnalysis();
    } else {
        // Analysis fades inward, Calendar comes from outward
        elements.analysisView.classList.add('hidden-inward');
        elements.analysisView.classList.remove('hidden-outward');
        
        elements.calendarView.classList.remove('hidden-inward');
        elements.calendarView.classList.remove('hidden-outward');
        
        renderCalendar();
    }
    
    const icon = elements.viewToggleBtn.querySelector('i');
    icon.className = isAnalysis ? 'fas fa-calendar-alt' : 'fas fa-chart-line';
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

const constellations = [
    {
        name: "Ursa Minor",
        stars: [[80, 20], [70, 35], [60, 40], [50, 45], [45, 60], [30, 70], [25, 55]],
        lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,4]]
    },
    {
        name: "Cygnus",
        stars: [[50, 15], [50, 40], [50, 70], [50, 90], [20, 40], [80, 40]],
        lines: [[0,1], [1,2], [2,3], [4,1], [1,5]]
    },
    {
        name: "Lyra",
        stars: [[30, 20], [50, 25], [60, 45], [50, 65], [35, 60]],
        lines: [[0,1], [1,2], [2,3], [3,4], [4,1]]
    },
    {
        name: "Cassiopeia",
        stars: [[20, 30], [35, 50], [50, 35], [65, 55], [80, 40]],
        lines: [[0,1], [1,2], [2,3], [3,4]]
    },
    {
        name: "Orion",
        stars: [[30, 20], [70, 25], [50, 45], [45, 50], [55, 48], [35, 80], [65, 75]],
        lines: [[0,2], [1,2], [2,3], [3,4], [2,4], [3,5], [4,6]]
    },
    {
        name: "Big Dipper",
        stars: [[15, 40], [30, 35], [45, 45], [55, 60], [80, 65], [85, 85], [60, 80]],
        lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]]
    },
    {
        name: "Draco",
        stars: [[20, 20], [30, 15], [45, 25], [40, 45], [60, 50], [75, 40], [85, 55], [70, 70], [55, 85]],
        lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8]]
    },
    {
        name: "Hercules",
        stars: [[40, 30], [60, 25], [65, 45], [45, 50], [35, 70], [70, 75], [30, 20], [75, 15]],
        lines: [[0,1], [1,2], [2,3], [3,0], [0,6], [1,7], [3,4], [2,5]]
    },
    {
        name: "Pegasus",
        stars: [[30, 30], [60, 30], [60, 60], [30, 60], [15, 20], [10, 45], [75, 20]],
        lines: [[0,1], [1,2], [2,3], [3,0], [0,4], [4,5], [1,6]]
    }
];

let starAnimFrame = null;
let bgStars = [];

function renderStars() {
    const canvas = elements.starsCanvas;
    if (!canvas) return;

    if (starAnimFrame) cancelAnimationFrame(starAnimFrame);

    const ctx = canvas.getContext('2d');
    const today = getLocalDate();
    const mins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    const starCount = Math.floor(mins / 5); 
    
    const constIdx = (Math.floor((starCount - 1) / 10) + state.stars.shuffleOffset) % constellations.length;
    const currentConst = constellations[constIdx >= 0 ? constIdx : 0];
    const starsInThisCycle = starCount === 0 ? 0 : (starCount - 1) % 10 + 1;
    const isCompleted = starsInThisCycle >= currentConst.stars.length;

    if (bgStars.length !== starCount) {
        bgStars = [];
        for(let i=0; i<starCount; i++) {
            bgStars.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0002, // Slow drift
                vy: (Math.random() - 0.5) * 0.0002,
                size: Math.random() * 1.5 + 0.5,
                blinkSpeed: Math.random() * 0.002 + 0.0005 
            });
        }
    }

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
        
        const w = rect.width;
        const h = rect.height;
        ctx.clearRect(0, 0, w, h);

        const time = Date.now();

        // Background Stars
        ctx.fillStyle = "white";
        bgStars.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < 0) s.x = 1; if (s.x > 1) s.x = 0;
            if (s.y < 0) s.y = 1; if (s.y > 1) s.y = 0;

            const alpha = 0.2 + Math.abs(Math.sin(time * s.blinkSpeed + s.x * 10)) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI*2);
            ctx.fill();
        });

        if (starCount === 0) {
            starAnimFrame = requestAnimationFrame(draw);
            return;
        }

        // Calculate Bounding Box
        let minX = 100, maxX = 0, minY = 100, maxY = 0;
        currentConst.stars.forEach(p => {
             minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
             minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
        
        const cW = maxX - minX;
        const cH = maxY - minY;
        const scale = Math.min((w - 60) / (cW * w / 100), (h - 80) / (cH * h / 100));
        
        const centerX = w / 2;
        const centerY = h / 2 - 10;
        
        const project = (p, index) => {
            // Very slow, slight floating
            const floatX = Math.sin(time * 0.0002 + index) * 2;
            const floatY = Math.cos(time * 0.0003 + index) * 2;
            
            const nx = (p[0] - minX - cW/2) * (w/100) * scale + centerX + floatX;
            const ny = (p[1] - minY - cH/2) * (h/100) * scale + centerY + floatY;
            return [nx, ny];
        };

        // Lines
        if (isCompleted) {
             ctx.strokeStyle = "rgba(255,255,255,0.4)";
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             currentConst.lines.forEach(l => {
                 const p1 = project(currentConst.stars[l[0]], l[0]);
                 const p2 = project(currentConst.stars[l[1]], l[1]);
                 ctx.moveTo(p1[0], p1[1]);
                 ctx.lineTo(p2[0], p2[1]);
             });
             ctx.stroke();

             ctx.globalAlpha = 0.8;
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
             ctx.font = "bold 12px Quicksand";
             ctx.textAlign = "center";
             ctx.fillText(currentConst.name, w/2, h - 15);
        } else {
             const displayCount = Math.min(starsInThisCycle, currentConst.stars.length);
             const total = currentConst.stars.length;
             ctx.globalAlpha = 0.5;
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
             ctx.font = "10px Quicksand";
             ctx.textAlign = "center";
             ctx.fillText(`${currentConst.name} (${displayCount}/${total})`, w/2, h - 15);
        }

        // Main Stars
        currentConst.stars.forEach((p, i) => {
            if (i < starsInThisCycle || isCompleted) {
                const pos = project(p, i);
                const alpha = 0.5 + Math.abs(Math.sin(time * 0.002 + i)) * 0.5;
                
                const grad = ctx.createRadialGradient(pos[0], pos[1], 1, pos[0], pos[1], 6);
                grad.addColorStop(0, "white");
                grad.addColorStop(0.4, "rgba(255,255,255,0.8)");
                grad.addColorStop(1, "rgba(255,255,255,0)");
                
                ctx.globalAlpha = alpha;
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos[0], pos[1], 6, 0, Math.PI*2);
                ctx.fill();
                
                ctx.globalAlpha = 1;
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(pos[0], pos[1], 2, 0, Math.PI*2);
                ctx.fill();
            }
        });
        
        starAnimFrame = requestAnimationFrame(draw);
    }
    draw();
}

function updatePet() {
    if (state.timer.running) {
        elements.petDisplay.classList.add('active');
        elements.petStatus.innerText = "Focusing with you!";
        elements.focusVisualizer.classList.add('visible');
    } else {
        elements.petDisplay.classList.remove('active');
        elements.petStatus.innerText = "Pet is resting...";
        elements.focusVisualizer.classList.remove('visible');
    }
}


// --- ZEN MIXER (AUDIO) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const channels = {};
let brownNoiseChannel = null;
let brownNoisePlaying = false;

const audioAssets = {
    rain: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/master/sounds/rain.mp3',
    wind: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/master/sounds/wind.mp3',
    cafe: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/master/sounds/coffee%20shop.mp3',
    fire: 'https://raw.githubusercontent.com/bradtraversy/ambient-sound-mixer/master/sounds/fireplace.mp3',
    brown: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Brown_noise.ogg'
};

function loadAmbientAudio(type, onReady) {
    const audio = new Audio(audioAssets[type]);
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    
    // Show loading state in UI
    const iconContainer = document.querySelector(`.mixer-icon-container[data-type="${type}"]`);
    const cornerIcon = document.querySelector(`#ambient-indicators i[data-type="${type}"]`);
    
    if (iconContainer) {
        iconContainer.classList.add('loading');
        iconContainer.innerHTML = '<i class="fas fa-spinner"></i>';
    }
    if (cornerIcon) cornerIcon.classList.add('loading-pulse');

    audio.addEventListener('canplaythrough', () => {
        if (iconContainer) {
            iconContainer.classList.remove('loading');
            // Restore original icon based on type
            const iconMap = { rain: 'fa-cloud-rain', wind: 'fa-wind', cafe: 'fa-mug-hot', fire: 'fa-fire' };
            iconContainer.innerHTML = `<i class="fas ${iconMap[type]}"></i>`;
        }
        if (cornerIcon) cornerIcon.classList.remove('loading-pulse');
        if (onReady) onReady();
    }, { once: true });

    audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${type}:`, e);
        if (iconContainer) {
            iconContainer.classList.remove('loading');
            iconContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        }
    });

    const source = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    return { audio, gainNode };
}

function updateAmbientIndicators() {
    const sliders = document.querySelectorAll('.mixer-slider');
    elements.ambientIndicators.forEach((icon, index) => {
        const vol = parseInt(sliders[index].value);
        icon.classList.toggle('active', vol > 0);
        
        if (sliders[index]) {
            sliders[index].style.background = `linear-gradient(90deg, var(--accent) ${vol}%, rgba(255,255,255,0.1) ${vol}%)`;
        }
    });
}

async function initMixer() {
    const sliders = document.querySelectorAll('.mixer-slider');
    const types = ['rain', 'wind', 'cafe', 'fire'];
    const savedVols = JSON.parse(localStorage.getItem('cozyMixer')) || [0, 0, 0, 0];
    
    for (let i = 0; i < sliders.length; i++) {
        const slider = sliders[i];
        const type = types[i];
        
        slider.value = savedVols[i];

        slider.oninput = (e) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const vol = e.target.value / 100;

            if (!channels[type]) {
                channels[type] = loadAmbientAudio(type, () => {
                    channels[type].audio.play();
                    channels[type].gainNode.gain.setTargetAtTime(vol * 0.5, audioCtx.currentTime, 0.1);
                });
            } else {
                channels[type].gainNode.gain.setTargetAtTime(vol * 0.5, audioCtx.currentTime, 0.1);
            }
            
            const currentVols = Array.from(sliders).map(s => s.value);
            localStorage.setItem('cozyMixer', JSON.stringify(currentVols));
            updateAmbientIndicators();
        };

        if (savedVols[i] > 0) {
            updateAmbientIndicators();
        }
    }
}

elements.soundBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!brownNoiseChannel) {
        brownNoiseChannel = loadAmbientAudio('brown');
        brownNoiseChannel.audio.play();
    }
    
    if (brownNoisePlaying) {
        brownNoiseChannel.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        brownNoisePlaying = false;
    } else {
        brownNoiseChannel.gainNode.gain.setTargetAtTime(0.4, audioCtx.currentTime, 0.1);
        elements.soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        brownNoisePlaying = true;
    }
});

// --- INITIALIZATION ---
function init() {
    // Precise clock sync: update now, then sync to the start of the next second
    updateClockAndGreeting();
    const msUntilNextSecond = 1000 - new Date().getMilliseconds();
    setTimeout(() => {
        updateClockAndGreeting();
        setInterval(updateClockAndGreeting, 1000);
    }, msUntilNextSecond);

    renderTodos();
    fetchQuote();
    renderCalendar();
    updateTimerDisplay();
    setWallpaper(state.settings.bg);
    initWidgets();
    
    // Ensure initial history view state with new depth classes
    elements.calendarView.classList.remove('hidden-inward', 'hidden-outward');
    elements.analysisView.classList.add('hidden-outward');
    
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

    elements.shuffleStarsBtn.addEventListener('click', () => {
        elements.starsCanvas.style.transition = 'opacity 0.5s ease';
        elements.starsCanvas.style.opacity = '0';
        
        setTimeout(() => {
            state.stars.shuffleOffset = (state.stars.shuffleOffset + 1) % constellations.length;
            localStorage.setItem('cozyStarsOffset', state.stars.shuffleOffset);
            
            // Reset background stars for new pattern
            bgStars = [];
            renderStars();
            
            elements.starsCanvas.style.opacity = '1';
        }, 500);
    });

    // Timer presets
    elements.presetTimes.forEach(btn => {
        btn.addEventListener('click', () => {
            const mins = parseInt(btn.dataset.mins);
            state.timer.initialMinutes = mins;
            state.timer.totalSeconds = mins * 60;
            state.timer.timeLeft = state.timer.totalSeconds;
            updateTimerDisplay();
            
            elements.presetTimes.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (state.timer.running) {
                elements.resetBtn.click(); // Reset if running to apply new time
            }
        });
    });
}

init();
