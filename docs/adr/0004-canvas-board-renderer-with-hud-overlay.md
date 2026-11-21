# Render Interactive Game Boards on HTML5 2D Canvas with an HTML HUD Overlay

Each Game Cartridge renders its tabletop board, Seat avatars, Role cards, Day/Night environment transitions, particles, and pointer hit-targets inside a shared HTML5 2D `<canvas>` engine (`Canvas Scene`), while text inputs for `Channel` chat, Room join codes, and Authentication controls live in a lightweight HTML/Tailwind `HUD Overlay`.

We chose a hybrid Canvas Scene + HTML HUD over pure DOM rendering or pure Canvas text inputs because 2D Canvas provides 60fps animations, particle effects, and unconstrained spatial layouts for future board games, while native HTML inputs preserve seamless Vietnamese IME composition (Telex/VNI) and clipboard access on mobile and desktop browsers.
