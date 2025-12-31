// --- Global State ---
export const state = {
    todos: JSON.parse(localStorage.getItem('cozyTodos')) || [],
    sessions: JSON.parse(localStorage.getItem('cozySessions')) || [],
    settings: {
        name: localStorage.getItem('cozyName') || '',
        bg: localStorage.getItem('cozyBg') || 'wallpapers/default.jpg',
        activeWidget: localStorage.getItem('cozyActiveWidget') || 'mixer',
        dynamicColors: true,
        selectedPet: localStorage.getItem('cozySelectedPet') || null,
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

function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
