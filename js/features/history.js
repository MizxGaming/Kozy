import { state } from '../core/state.js';
import { elements } from '../core/dom.js';
import { getLocalDate } from '../core/utils.js';
import { renderStars } from '../bits/stars.js';

export function initHistory() {
    renderCalendar();
    elements.viewToggleBtn.addEventListener('click', toggleHistoryView);
    elements.todayFocusBtn.addEventListener('click', () => {
        state.analysis.currentDate = getLocalDate();
        state.analysis.view = 'calendar';
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

export function saveSession(minutes, task) {
    const today = getLocalDate();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    state.sessions.push({ date: today, minutes, task, time: timestamp });
    localStorage.setItem('cozySessions', JSON.stringify(state.sessions));
    renderCalendar();
    renderAnalysis();
    renderStars();
}

export function toggleHistoryView() {
    state.analysis.view = state.analysis.view === 'calendar' ? 'analysis' : 'calendar';
    const isAnalysis = state.analysis.view === 'analysis';
    
    elements.historyPanel.classList.toggle('expanded', isAnalysis);
    elements.bitsPanel.classList.toggle('collapsed', isAnalysis);
    
    if (isAnalysis) {
        elements.calendarView.classList.add('hidden-inward');
        elements.calendarView.classList.remove('hidden-outward');
        elements.analysisView.classList.remove('hidden-inward');
        elements.analysisView.classList.remove('hidden-outward');
        renderAnalysis();
    } else {
        elements.analysisView.classList.add('hidden-inward');
        elements.analysisView.classList.remove('hidden-outward');
        elements.calendarView.classList.remove('hidden-inward');
        elements.calendarView.classList.remove('hidden-outward');
        renderCalendar();
    }
    
    const icon = elements.viewToggleBtn.querySelector('i');
    icon.className = isAnalysis ? 'fas fa-calendar-alt' : 'fas fa-chart-line';
}

export function renderAnalysis() {
    const targetDate = state.analysis.currentDate;
    elements.analysisDateText.innerText = targetDate === getLocalDate() ? 'Today' : targetDate;
    const daySessions = state.sessions.filter(s => s.date === targetDate);
    
    elements.focusChart.innerHTML = '';
    const hourlyData = new Array(24).fill(0);
    daySessions.forEach(s => {
        const hour = parseInt(s.time?.split(':')[0]) || 0;
        hourlyData[hour] += s.minutes;
    });

    const maxMins = Math.max(...hourlyData, 30);
    hourlyData.forEach((mins, hour) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(mins / maxMins) * 100}%`;
        bar.setAttribute('data-time', `${hour}:00 - ${mins}m`);
        elements.focusChart.appendChild(bar);
    });

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

export function renderCalendar() {
    const today = new Date();
    const todayStr = getLocalDate(today);
    const todaysMinutes = state.sessions.filter(s => s.date === todayStr).reduce((acc, curr) => acc + curr.minutes, 0);
    
    if (elements.todayFocus) elements.todayFocus.innerText = `${todaysMinutes}m focused today`;

    if (elements.calendarGrid) {
        elements.calendarGrid.innerHTML = '';
        for (let i = 27; i >= 0; i--) {
            const d = new Date(); d.setDate(today.getDate() - i);
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
}
