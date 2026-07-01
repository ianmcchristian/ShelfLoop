# ShelfLoop

ShelfLoop is an **IoT concept platform for RFID-driven retail replenishment**. It simulates the operational loop from apparel-area RFID scans to backroom stock validation, guided stocker tasks, and dashboard-level business metrics.

## MVP focus

The first version targets a balanced product-engineering MVP:

1. Simulated RFID scan cycle for an apparel sales-floor area.
2. Detection of missing display inventory using adjustable fixture/SKU thresholds.
3. Backroom RFID validation before assigning replenishment work.
4. Shared stocker task queue with a phone-style guided workflow.
5. Simulated tap-to-light ESL guidance using pulsing UI states.
6. Dashboard visibility into inventory health, events, tasks, and KPIs.

## Research posture

ShelfLoop is inspired by real-world apparel RFID testing concepts: dense folded inventory, metal fixture interference, scan confidence variability, and the difference between perfect demo scans and noisy field reads. Public docs should stay generic and avoid internal project names, store identifiers, or confidential source data.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- React `useReducer` state model
- Browser `localStorage` persistence
- Vitest logic tests
- GitHub Pages-ready static build

## Planned routes

- `#/dashboard` — manager dashboard and live store-state view
- `#/simulator` — RFID scan controls and demo scenarios
- `#/about` — concise product/case-study context

## Getting started

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run test:run
npm run build
```

## Deployment goal

The project is planned for GitHub Pages with a GitHub Actions build/deploy workflow once the MVP is polished enough to share.
