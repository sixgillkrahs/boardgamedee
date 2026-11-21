# 05: Interactive 2D Canvas Scene Engine & Werewolf Tabletop Canvas + HTML HUD Overlay

**What to build:** Build the reusable HiDPI HTML5 2D `Canvas Scene` engine and the `Werewolf Cartridge` interactive canvas renderer (animated Day/Night/Hunter sky and campfire clearing, radial `Seats`, targeting beams, vote badges, gravestones, central `Phase Timer` ring, and flip-to-peek secret `Role` card) paired with the Vietnamese-friendly HTML `HUD Overlay` for `Channel` chat, `Match Event` logs, and action controls.

**Blocked by:** 01, 04

**Status:** resolved

- [x] Shared 2D `Canvas Scene` engine supports HiDPI `devicePixelRatio` scaling, 60fps animation loop, particle emitters, smooth color/position interpolation, and pointer/touch hit-testing (`HitRegion`).
- [x] `Werewolf Cartridge` canvas scene renders animated transitions across `Night Phase`, `Day Phase`, `HunterRevengeStep`, and Victory screen, with radial `Seats` around the central campfire and `Phase Timer`.
- [x] Players can click/tap `Seats` directly on the `<canvas>` to select night action targets, shoot as `Hunter`, or cast day execution votes, and tap/hold their `Role` card on the canvas to privately inspect their `Role`.
- [x] HTML `HUD Overlay` provides seamless Vietnamese IME text entry for permitted `Channels` (`Village`, `Werewolf`, `Graveyard`), displays the `Match Event` log, and exposes action confirmation and rematch buttons.
