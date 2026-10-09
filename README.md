# SafeRoute

Evidence-aware night-walking route comparison prototype.

See [GUIDE.md](./GUIDE.md) for architecture, setup, demo modes, testing, and limitations.

Quick start:

```bash
npm install
npm run dev
```

The UI demo works without an API key. Live walking routes require `VITE_ORS_API_KEY` in `.env.local`. Live routing currently provides route geometry and duration only; safety evidence remains unknown until a verified data adapter is connected.

> **Demo data notice:** Lighting, road, and activity coverage indicators are simulated fictional values for demonstrating the interface. They are not verified street observations and must not be interpreted as evidence that a real route is safe. Live routing distance and duration come from OpenRouteService.
