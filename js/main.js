import { elements } from './core/dom.js';
import { initTheme } from './ui/theme.js';
import { initTimer } from './features/timer.js';
import { initTodo } from './features/todo.js';
import { initHistory } from './features/history.js';
import { initQuotes } from './features/quote.js';
import { initMixer } from './bits/mixer.js';
import { initStars } from './bits/stars.js';
import { initPet } from './bits/pet.js';
import { initBitsUI } from './ui/bits.js';

function init() {
    // Initialize UI and Core Features
    initTheme();
    initTodo();
    initQuotes();
    initHistory();
    initTimer();
    
    // Initialize Bits (Toys)
    initStars();
    initPet();
    initMixer();
    initBitsUI();

    // Global History setup
    elements.calendarView.classList.remove('hidden-inward', 'hidden-outward');
    elements.analysisView.classList.add('hidden-outward');
}

document.addEventListener('DOMContentLoaded', init);
