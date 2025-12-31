import { state } from '../core/state.js';
import { elements } from '../core/dom.js';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const channels = {};
let brownNoiseChannel = null;
let brownNoisePlaying = false;

const audioAssets = {
    rain: 'audio/rain.mp3',
    wind: 'audio/wind.mp3',
    cafe: 'audio/cafe.mp3',
    fire: 'audio/fireplace.mp3',
    brown: 'audio/brown.mp3'
};

export function initMixer() {
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

        if (savedVols[i] > 0) updateAmbientIndicators();
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
}

function loadAmbientAudio(type, onReady) {
    const audio = new Audio(audioAssets[type]);
    audio.loop = true;
    
    const iconContainer = document.querySelector(`.mixer-icon-container[data-type="${type}"]`);
    const cornerIcon = document.querySelector(`#ambient-indicators i[data-type="${type}"]`);
    
    if (iconContainer) { iconContainer.classList.add('loading'); iconContainer.innerHTML = '<i class="fas fa-spinner"></i>'; }
    if (cornerIcon) cornerIcon.classList.add('loading-pulse');

    audio.addEventListener('canplaythrough', () => {
        if (iconContainer) {
            iconContainer.classList.remove('loading');
            const iconMap = { rain: 'fa-cloud-rain', wind: 'fa-wind', cafe: 'fa-mug-hot', fire: 'fa-fire' };
            iconContainer.innerHTML = `<i class="fas ${iconMap[type]}"></i>`;
        }
        if (cornerIcon) cornerIcon.classList.remove('loading-pulse');
        if (onReady) onReady();
    }, { once: true });

    audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${type}:`, e);
        if (iconContainer) { iconContainer.classList.remove('loading'); iconContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'; }
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
        if (sliders[index]) sliders[index].style.background = `linear-gradient(90deg, var(--accent) ${vol}%, rgba(255,255,255,0.1) ${vol}%)`;
    });
}
