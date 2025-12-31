import { state } from '../core/state.js';
import { elements } from '../core/dom.js';
import { toggleStarsHierarchy } from '../bits/stars.js';
import { togglePetHierarchy } from '../bits/pet.js';
import { renderStars } from '../bits/stars.js';
import { updatePet } from '../bits/pet.js';

const bitDescriptions = {
    mixer: { title: "Zen Mixer", desc: "Craft your perfect ambient atmosphere by blending rain, wind, cafe, and fire sounds." },
    stars: { title: "Focus Stars", desc: "Build your own constellation; a new star is born for every 5 minutes of focused work." },
    pet: { title: "Focus Pet", desc: "A tiny robot companion that stays active while you work and rests when you're done." },
    pulse: { title: "Focus Pulse", desc: "A gentle visual rhythm designed to help you synchronize your breathing and stay calm." }
};

export function initBitsUI() {
    elements.switchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-widget');
            state.settings.activeWidget = target;
            localStorage.setItem('cozyActiveWidget', target);
            
            elements.switchBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            elements.widgetContents.forEach(content => {
                content.classList.toggle('hidden', content.id !== `widget-${target}`);
            });

            toggleStarsHierarchy(false);
            togglePetHierarchy(false);
            elements.bitDrawer.classList.remove('open');
            const infoIcon = elements.bitInfoBtn.querySelector('i');
            if (infoIcon) infoIcon.className = 'fas fa-question-circle';

            if (target === 'stars') renderStars();
            if (target === 'pet') updatePet();
            updateBitDrawer();
        });
    });

    elements.bitInfoBtn.addEventListener('click', () => {
        elements.bitDrawer.classList.toggle('open');
        toggleStarsHierarchy(false);
        togglePetHierarchy(false);
        const icon = elements.bitInfoBtn.querySelector('i');
        icon.className = elements.bitDrawer.classList.contains('open') ? 'fas fa-times-circle' : 'fas fa-question-circle';
    });

    const initialBtn = document.querySelector(`.switch-btn[data-widget="${state.settings.activeWidget}"]`);
    if (initialBtn) initialBtn.click();
}

function updateBitDrawer() {
    const data = bitDescriptions[state.settings.activeWidget];
    if (data) {
        elements.bitDrawerTitle.innerText = data.title;
        elements.bitDrawerDesc.innerText = data.desc;
    }
}
