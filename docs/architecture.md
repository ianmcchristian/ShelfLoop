# ShelfLoop Architecture Notes

## Static MVP architecture

ShelfLoop starts as a static React app that can be hosted on GitHub Pages. The first implementation intentionally mocks hardware and backend systems while keeping the domain seams clear.

```text
Demo scenario controls
        ↓
RFID scan simulator
        ↓
Inventory reconciliation reducer
        ↓
Task generation / out-of-stock logic
        ↓
Dashboard + stocker phone modal
        ↓
localStorage persistence
```

## Future replaceable seams

- RFID simulator → real reader event ingestion API
- localStorage → hosted database or event log
- pulsing UI ESLs → vendor ESL/tap-to-light adapter
- in-app stocker modal → PWA or native mobile workflow
- demo scenarios → scheduled scan orchestration

## Core modeling choices

- Exact RFID tags are tracked underneath the UI.
- The dashboard summarizes by fixture, SKU, and quantity.
- Replenishment thresholds are configurable by fixture/SKU.
- Scan mode can switch between clean demo reads and noisier realistic reads.
