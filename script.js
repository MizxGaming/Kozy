// --- Global State & DOM Elements ---
const state = {
    todos: JSON.parse(localStorage.getItem('cozyTodos')) || [],
    sessions: JSON.parse(localStorage.getItem('cozySessions')) || [],
    settings: {
        name: localStorage.getItem('cozyName') || '',
        city: localStorage.getItem('cozyCity') || '',
        lat: localStorage.getItem('cozyLat') || null,
        lon: localStorage.getItem('cozyLon') || null,
        bg: localStorage.getItem('cozyBg') || 'https://images.wallpapersden.com/image/download/anime-girl-looking-at-sky-scenery_bWlma2uUmZqaraWkpJRmbmdlrWZlbWU.jpg',
        dynamicColors: true,
    },
    timer: {
        totalSeconds: 25 * 60,
        timeLeft: 25 * 60,
        id: null,
        running: false,
        initialMinutes: 25,
    }
};

const elements = {
    // Header
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    greeting: document.getElementById('greeting'),
    weather: document.getElementById('weather'),
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
    // Calendar
    calendarGrid: document.getElementById('mini-calendar'),
    todayFocus: document.getElementById('today-focus'),
    sessionHistory: document.getElementById('session-history'),
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
    userCityInput: document.getElementById('user-city'),
    geoBtn: document.getElementById('geo-btn'),
};


// --- HELPERS ---
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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

async function fetchWeather() {
    const { lat, lon } = state.settings;
    if (!lat || !lon) return;

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const { temperature, weathercode } = data.current_weather;
        
        elements.weather.classList.remove('hidden');
        elements.weather.querySelector('span').innerText = `${Math.round(temperature)}°C`;
        
        // Simple icon mapping
        let icon = 'fa-cloud-sun';
        if (weathercode === 0) icon = 'fa-sun';
        if (weathercode > 0 && weathercode < 4) icon = 'fa-cloud-sun';
        if (weathercode >= 45 && weathercode <= 48) icon = 'fa-smog';
        if (weathercode >= 51 && weathercode <= 67) icon = 'fa-cloud-rain';
        if (weathercode >= 71 && weathercode <= 77) icon = 'fa-snowflake';
        if (weathercode >= 80 && weathercode <= 82) icon = 'fa-cloud-showers-heavy';
        if (weathercode >= 95) icon = 'fa-bolt';
        
        elements.weather.querySelector('i').className = `fas ${icon}`;
    } catch (e) {
        console.error("Weather fetch failed", e);
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            state.settings.lat = pos.coords.latitude;
            state.settings.lon = pos.coords.longitude;
            localStorage.setItem('cozyLat', state.settings.lat);
            localStorage.setItem('cozyLon', state.settings.lon);
            fetchWeather();
        });
    }
}

elements.geoBtn.addEventListener('click', getLocation);


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
    }
});

elements.resetBtn.addEventListener('click', () => {
    clearInterval(state.timer.id);
    state.timer.running = false;
    state.timer.timeLeft = state.timer.totalSeconds;
    updateTimerDisplay();
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.status.innerText = "Ready";
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
    const today = new Date().toISOString().split('T')[0];
    state.sessions.push({ date: today, minutes, task });
    localStorage.setItem('cozySessions', JSON.stringify(state.sessions));
    renderCalendar();
}

function renderCalendar() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaysMinutes = state.sessions.filter(s => s.date === todayStr).reduce((acc, curr) => acc + curr.minutes, 0);
    elements.todayFocus.innerText = `${todaysMinutes}m focused today`;

    elements.calendarGrid.innerHTML = '';
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        
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

    elements.sessionHistory.innerHTML = '';
    state.sessions.slice(-5).reverse().forEach(s => {
        const li = document.createElement('li');
        li.className = 'session-item';
        li.innerHTML = `<span>${s.task}</span> <span>${s.minutes}m</span>`;
        elements.sessionHistory.appendChild(li);
    });
}


// --- SETTINGS ---
function setWallpaper(url) {
    document.body.style.backgroundImage = `url('${url}')`;
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
            setWallpaper(event.target.result);
        };
        reader.readAsDataURL(file);
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
    fetchWeather();
}

init();
