# Kozy: A Minimalist Focus Space 🌙

**Kozy** is an aesthetic focus sanctuary designed for deep work. It combines minimalist productivity tools with immersive ambient elements to create a productive yet serene environment.

## ✨ Features
- **Productivity**: Circular Countdown Timer, persistent To-Do list, and 28-day Focus History with hourly analysis.
- **Kozy Bits**: A modular bit system featuring a Zen Mixer (local high-fidelity audio), Star Constellations (Canvas), and an Evolving Focus Pet.
- **Aesthetics**: Dynamic wallpaper-based theming, custom uploads with compression, and a high-performance glassmorphism UI.

## 🛠️ How it Works (For Devs)

Kozy is built with a **modular, no-build architecture** using native ES Modules. This ensures the codebase remains maintainable and scalable without requiring a build step.

### **Architecture & State**
- **Modular System**: The logic is split into `core/` (state, DOM, utils), `features/` (timer, history, todo), `bits/` (mixer, stars, pet), and `ui/` (theme, navigation).
- **State Management**: A centralized `state` object (`js/core/state.js`) serves as the single source of truth, synchronized with `localStorage` for full persistence.

### **Technical Highlights**
- **Audio Engine**: Powered by the **Web Audio API** (`js/bits/mixer.js`), allowing for seamless looping, volume blending, and efficient local asset management.
- **Dynamic Theming**: Wallpapers are processed via a hidden Canvas to extract dominant colors, which are then injected as CSS variables (`--accent`) to retheme the UI instantly.
- **Canvas Rendering**: The **Focus Stars** bit uses an optimized HTML5 Canvas engine to render twinkling backgrounds and procedural constellations without impacting DOM performance.
- **Timer Logic**: Uses SVG `stroke-dashoffset` for the progress ring and CSS variables for the orbiting thumb rotation to ensure smooth, hardware-accelerated movement.

## 🚀 Getting Started
1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. Kozy works entirely client-side—no server required.

---
*Created as an experiment in **vibe coding** 🪄—where productivity feels natural, not forced.*
