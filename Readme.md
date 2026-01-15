# AI Tasks (Ollama Frontend)

React + Vite chat UI for your on-prem Ollama endpoint. Styled to match the CCTV/Gym vibe and focused on fast task generation.

## Quick start
- Install deps: `npm install`
- Run dev server: `npm run dev` (defaults to http://localhost:5173)
- Build for production: `npm run build`

## Ollama endpoint
- Default base URL: https://ollama.ayux.in
- Override via `.env`:
	- `VITE_OLLAMA_BASE_URL=https://your-domain-or-ip:8008`
- Models dropdown includes `llama3.2:3b` and `llama3.2:8b` (you can edit `src/App.jsx` to add more).

## Features
- Streaming chat via `/api/generate` with Abort support (Stop button)
- Quick prompt chips for task-oriented asks
- Dark gradient UI matching your existing apps

## Notes
- Press Enter to send, Shift+Enter for newline
- Clear button wipes the composer only
- If the tunnel or server is unreachable, errors will surface below the composer
