# Cozy Focus Dashboard Project Context

## Project Goal
A personalized, aesthetically pleasing web dashboard for focus and productivity, featuring a customizable timer, to-do list, calendar, and dynamic background.

## Current Status (as of Dec 28, 2025)
- **Core Features**:
    - Clock, Date, and Greeting (centered, bold, Space Mono font).
    - Countdown Timer with dynamic accent colors, darkening progress ring, and a moving thumb.
    - To-Do List with full persistence.
    - Focus History (Calendar) pinned to the top-left panel.
    - Dynamic Quotes.
- **Customization & Persistence**:
    - **Wallpaper**: Restored and improved using a **Pre-render + CSS Variable** strategy for instant loading.
    - **Image Compression**: Custom uploads are now resized/compressed to fit in `localStorage`.
    - **Accent Colors**: Dynamically generated from wallpaper and persistent across restarts.
    - **Settings**: Improved Settings modal with Mac-style close button and `Escape` key support.
- **Modular Toys System**:
    - Dedicated "Toys" panel in the bottom-left.
    - **Architecture**: Implemented **Stack & Fade** (CSS Grid + Opacity) for smooth transitions.
    - **Implemented Toys**:
        1. **Focus Tree**: 6 growth stages based on focus time.
        2. **Lofi Tape**: Animated cassette with dynamic task labeling.
        3. **Zen Mixer**: Persistent audio sliders for Rain, Wind, Cafe, and Fire (Web Audio API).
        4. **Focus Stars**: Constellation generator (1 star per 5 mins).
        5. **Focus Pet**: Bouncing robot companion active during focus sessions.
        6. **Focus Pulse**: Breathing visual rhythm for focus.
- **Cleaned Up**: Removed weather, location, and city-related features to streamline the UI.

## Pending Tasks / Next Steps
1.  **Verify Toys Functionality**: Some selection buttons were reported non-functional; needs a final sanity check on the "Stack & Fade" rendering and global click listeners.
2.  **Audio Refinement**: Ensure Zen Mixer audio triggers correctly after user interaction (browser security).
3.  **UI Polish**: Continue refining widget translucency and layout spacing.

## Tech Stack
- HTML5, CSS3 (Grid/Flexbox), JavaScript.
- Web Audio API (Ambient noise).
- Local Storage (Persistence).
- Space Mono & Quicksand (Google Fonts).

## Roadmap
1. [x] Implement dynamic UI color adjustment based on wallpaper.
2. [x] Ensure full persistence for all settings (Wallpaper, Name, Toys, Mixer).
3. [x] Split left panel into History and Modular Toys.
4. [x] Implement 6 unique "Toys" for focus.
5. [x] Optimize wallpaper loading (Pre-render + Compression).
6. [ ] Final bug-fix for Toys selection buttons.
7. [ ] Further refine UI/UX as needed.
