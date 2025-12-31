import { state } from '../core/state.js';
import { elements } from '../core/dom.js';
import { getLocalDate } from '../core/utils.js';

export const petHierarchy = [
    { name: "Rusty", icon: "fa-robot", mins: 0, desc: "A loyal mechanical friend." },
    { name: "Luna", icon: "fa-cat", mins: 25, desc: "Loves to watch you work." },
    { name: "Cooper", icon: "fa-dog", mins: 50, desc: "Always happy to help." },
    { name: "Pip", icon: "fa-dove", mins: 75, desc: "Brings peace to your space." },
    { name: "Bubbles", icon: "fa-fish", mins: 100, desc: "Just keep swimming." },
    { name: "Rex", icon: "fa-dragon", mins: 150, desc: "A powerful focus guardian." },
    { name: "Cosmic", icon: "fa-horse-head", mins: 200, desc: "A legendary focus beacon." }
];

export function initPet() {
    updatePet();
    elements.petInfoBtn.addEventListener('click', () => togglePetHierarchy(true));
    elements.closePetHierarchyBtn.addEventListener('click', () => togglePetHierarchy(false));
}

export function updatePet() {
    const today = getLocalDate();
    const totalMins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    
    let highestUnlocked = petHierarchy[0];
    for (let i = petHierarchy.length - 1; i >= 0; i--) {
        if (totalMins >= petHierarchy[i].mins) { highestUnlocked = petHierarchy[i]; break; }
    }

    let activePet = highestUnlocked;
    if (state.settings.selectedPet) {
        const selected = petHierarchy.find(p => p.name === state.settings.selectedPet);
        if (selected && totalMins >= selected.mins) activePet = selected;
        else { state.settings.selectedPet = null; localStorage.removeItem('cozySelectedPet'); activePet = highestUnlocked; }
    }

    elements.petDisplay.innerHTML = `<i class="fas ${activePet.icon}"></i>`;
    elements.petName.innerText = activePet.name;

    if (state.timer.running) {
        elements.petDisplay.classList.add('active');
        elements.petStatus.innerText = "Focusing with you!";
        elements.focusVisualizer.classList.add('visible');
    } else {
        elements.petDisplay.classList.remove('active');
        elements.petStatus.innerText = "Pet is resting...";
        elements.focusVisualizer.classList.remove('visible');
    }

    elements.petDisplay.style.filter = (activePet.name === "Cosmic") ? "drop-shadow(0 0 15px var(--accent)) brightness(1.2)" : "";
}

export function togglePetHierarchy(show) {
    elements.bitsPanel.classList.toggle('expanded', show);
    elements.historyPanel.classList.toggle('collapsed', show);
    if (show) {
        populatePetHierarchy();
        elements.petMainView.classList.add('hidden-inward');
        elements.petHierarchyView.classList.remove('hidden-outward');
    } else {
        elements.petHierarchyView.classList.add('hidden-inward');
        elements.petMainView.classList.remove('hidden-outward');
    }
}

function populatePetHierarchy() {
    const today = getLocalDate();
    const totalMins = state.sessions.filter(s => s.date === today).reduce((acc, curr) => acc + curr.minutes, 0);
    elements.petHierarchyList.innerHTML = '';
    
    let highestUnlocked = petHierarchy[0];
    for (let i = petHierarchy.length - 1; i >= 0; i--) {
        if (totalMins >= petHierarchy[i].mins) { highestUnlocked = petHierarchy[i]; break; }
    }
    const currentActiveName = state.settings.selectedPet || highestUnlocked.name;

    petHierarchy.forEach(pet => {
        const isUnlocked = totalMins >= pet.mins;
        const isSelected = isUnlocked && currentActiveName === pet.name;
        const item = document.createElement('div');
        item.className = `hierarchy-item ${isUnlocked ? 'unlocked' : ''} ${isSelected ? 'selected' : ''}`;
        if (isUnlocked) item.style.cursor = 'pointer';
        
        item.innerHTML = `<div style="display: flex; align-items: center; gap: 15px;"><div style="font-size: 1.5rem; width: 30px; text-align: center; color: ${isUnlocked ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}"><i class="fas ${pet.icon}"></i></div><div><div class="hierarchy-name">${pet.name} ${isSelected ? '<small>(Active)</small>' : ''}</div><div style="font-size: 0.75rem; color: rgba(255,255,255,0.5)">${pet.desc}</div></div></div><div class="hierarchy-info"><div>${pet.mins}m</div><div style="font-size: 0.75rem; opacity: 0.8">${isUnlocked ? (isSelected ? 'Selected' : 'Click to use') : 'Locked'}</div></div>`;

        if (isUnlocked) {
            item.addEventListener('click', () => {
                state.settings.selectedPet = pet.name;
                localStorage.setItem('cozySelectedPet', pet.name);
                updatePet(); populatePetHierarchy();
            });
        }
        elements.petHierarchyList.appendChild(item);
    });
}
