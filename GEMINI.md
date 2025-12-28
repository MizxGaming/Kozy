# Cozy Focus Dashboard Project Context

## Project Goal
A personalized, aesthetically pleasing web dashboard for focus and productivity, featuring a customizable timer, to-do list, calendar, and dynamic background.

## Current Status
- Fully functional web application with:
    - Clock, Date, Greeting, Weather.
    - Countdown Timer with task integration.
    - To-Do List with persistence.
    - Focus History (Calendar) with session tracking.
    - Dynamic Quotes.
    - Custom wallpaper selection (presets & upload) with instant pre-render.
    - **Modular Focus Toys** (6 switchable widgets):
        1. **Focus Tree**: Growth based on focus time.
        2. **Lofi Tape**: Animated cassette with task labeling.
        3. **Zen Mixer**: Custom ambient noise generator.
        4. **Focus Stars**: Constellation generation.
        5. **Focus Pet**: Bouncing robot companion.
        6. **Focus Pulse**: Breathing visual rhythm.
- **Latest Fixes**: Persistent wallpaper/accent colors, layout split (History/Toys), Settings ESC key support.

## Pending Tasks / Next Steps
1.  **Refactor Toys Logic**: Implement "Stack & Fade" or "Component" approach to fix widget switching.
2.  **Audio Refinement**: Add actual audio loops for the Zen Mixer if browser noise generation isn't sufficient.

## Tech Stack
- HTML5, CSS3, JavaScript.
- APIs: Open-Meteo for weather, Browser Geolocation, Web Audio API.
- Local Storage for persistence.

## Roadmap
1. [x] Implement dynamic UI color adjustment based on wallpaper.
2. [x] Adjust widget translucency.
3. [x] Create a GitHub repository for this project.
4. [ ] Refactor Toys system for robustness.
5. [ ] Further refine UI/UX as needed.