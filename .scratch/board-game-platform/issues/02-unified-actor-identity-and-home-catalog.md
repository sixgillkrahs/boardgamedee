# 02: Unified Actor Identity (Guest Mode & Google OAuth Upgrade) + Platform Home Catalog

**What to build:** Implement unified `Actor` identity in PostgreSQL supporting zero-friction Guest nickname sessions and in-place Google OAuth account upgrades, alongside the platform Home screen (`/`) displaying the `Actor` identity bar, the `Game Cartridge` catalog (Werewolf active + upcoming board game previews), and actions to create or join a `Room`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] PostgreSQL schema defines `actors` and session cookie helpers resolve or create the current `Actor`.
- [x] A visitor can enter or update a display nickname to play immediately as a Guest `Actor`.
- [x] A Guest `Actor` can upgrade in-place via Google OAuth (with full Google OAuth 2.0 endpoints and a seamless local/dev Google account upgrade flow when OAuth credentials are not configured) without changing their `Actor` ID or losing active `Seats`.
- [x] Home page (`/`) renders the `Game Cartridge` catalog in Vietnamese with Werewolf playable and upcoming board games previewed.
