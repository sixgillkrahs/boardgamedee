# Use Server-Sent Events (SSE) and HTTP Commands for Real-Time Synchronization

Clients subscribe to an authenticated Server-Sent Events stream (`/api/rooms/[code]/stream`) to receive personalized `Player View` updates and `Channel` messages from the server, and submit game commands or chat messages via standard HTTP POST / Server Actions.

We chose SSE + HTTP over a custom WebSocket server because turn- and phase-based board games have asymmetric traffic (frequent server broadcasts, discrete player commands), and SSE runs natively inside Next.js App Router Route Handlers with automatic browser reconnection and zero external process management.
