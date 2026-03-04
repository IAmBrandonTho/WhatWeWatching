# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

"What We Watching" (PeerWatch/Synvera) is a **pure static website** — vanilla JavaScript, HTML5, and CSS3 with zero npm/pip/gem dependencies, no build step, no bundler, and no package manager.

### Running the dev server

Serve the repository root with any static HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

### Key caveats

- **No linting or test framework** is configured in this repository. There is no `package.json`, `eslint` config, or test runner.
- **No build step** — all JS/CSS/HTML is authored directly and served as-is.
- **External signaling server** — WebRTC peer connections depend on an external Cloudflare Workers WebSocket server at `wss://whatwewatching-signal.lilbrandon2008.workers.dev`. This service is not in this repo and must be reachable for room creation / peer connections to work. Chat messages sent locally (without peers) still appear in the local chat log.
- **STUN servers** — the app uses Google public STUN servers (`stun.l.google.com:19302`); internet access is required for WebRTC ICE negotiation.
- **Debug mode** — append `?debug=1` to the URL to enable the debug card (error/log panels).
- The `Synvera/` directory contains an alternate build of `app.v5.js` with the Synvera runtime active; the main `index.html` loads the root `app.v5.js` plus `runtime/bootstrap.js`.
