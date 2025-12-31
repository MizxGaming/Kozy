import { state } from '../core/state.js';
import { elements } from '../core/dom.js';
import { formatTime } from '../core/utils.js';
import { saveSession } from './history.js';
import { updatePet } from '../bits/pet.js';

const circumference = elements.ring.r.baseVal.value * 2 * Math.PI;

export function initTimer() {
    elements.ring.style.strokeDasharray = `${circumference} ${circumference}`;
    updateTimerDisplay();

    elements.startBtn.addEventListener('click', toggleTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    
    elements.time.addEventListener('blur', handleTimeEdit);
    elements.time.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); elements.time.blur(); }
    });

    elements.presetTimes.forEach(btn => {
        btn.addEventListener('click', () => {
            const mins = parseInt(btn.dataset.mins);
            state.timer.initialMinutes = mins;
            state.timer.totalSeconds = mins * 60;
            state.timer.timeLeft = state.timer.totalSeconds;
            updateTimerDisplay();
            
            elements.presetTimes.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (state.timer.running) resetTimer();
        });
    });
}

export function updateTimerDisplay() {
    elements.time.innerText = formatTime(state.timer.timeLeft);
    const percent = ((state.timer.totalSeconds - state.timer.timeLeft) / state.timer.totalSeconds) * 100;
    const offset = circumference - (percent / 100) * circumference;
    elements.ring.style.strokeDashoffset = offset;
    elements.thumb.style.setProperty('--thumb-angle', `${(percent / 100) * 360}deg`);
}

function toggleTimer() {
    if (state.timer.running) {
        clearInterval(state.timer.id);
        state.timer.running = false;
        elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
        elements.status.innerText = "Paused";
        elements.thumb.classList.remove('active');
        if (state.timer.timeLeft < state.timer.totalSeconds) elements.thumb.classList.add('pulsing');
    } else {
        if (!state.timer.timeLeft || state.timer.timeLeft === state.timer.totalSeconds) {
            const mins = parseInt(elements.time.innerText.split(':')[0]) || 25;
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
        elements.thumb.classList.add('active');
        elements.thumb.classList.remove('pulsing');
    }
    updatePet();
}

function finishTimer() {
    clearInterval(state.timer.id);
    state.timer.running = false;
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.status.innerText = "Session Complete";
    elements.thumb.classList.remove('active', 'pulsing');
    updatePet();
    saveSession(state.timer.initialMinutes, elements.taskSelect.value || "Just Focus");
    if (Notification.permission === "granted") new Notification("Focus Complete!");
}

function resetTimer() {
    clearInterval(state.timer.id);
    state.timer.running = false;
    state.timer.timeLeft = state.timer.totalSeconds;
    updateTimerDisplay();
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.status.innerText = "Ready";
    elements.thumb.classList.remove('active', 'pulsing');
    updatePet();
}

function handleTimeEdit() {
    let mins = parseInt(elements.time.innerText) || 25;
    state.timer.initialMinutes = mins;
    state.timer.totalSeconds = mins * 60;
    state.timer.timeLeft = mins * 60;
    elements.time.innerText = formatTime(state.timer.timeLeft);
    elements.status.innerText = "Ready";
}
