# Persist Cartridge Match State as Versioned JSONB with Sequential Match Events

The PostgreSQL schema stores the active state of every Match in a `jsonb` column (`matches.state`) guarded by an integer optimistic-concurrency counter (`matches.version`), alongside an append-only `match_events` table recording each transition's emitted events as `jsonb`.

We chose this over relational tables per game (`werewolf_players`, `werewolf_actions`, etc.) so that adding new Game Cartridges never requires database migrations, while `version` prevents concurrent player actions or timer expirations from overwriting each other.
