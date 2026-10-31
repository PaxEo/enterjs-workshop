---
paths:
  - "src/**"
---

# Frontend

- Funktionskomponenten mit Hooks, keine Klassenkomponenten in neuem Code.
- API-Aufrufe über die Funktionen in `src/api.ts`, nicht direkt mit `fetch` in Komponenten.
- Zeitabhängige Anzeigen nutzen `useSimTime()` aus `src/clock.ts`.
- Kein `dangerouslySetInnerHTML` für Daten aus der API.
- globe.gl ist imperativ: Instanz einmal in `GlobeView` erzeugen, Updates über die Setter (`particlesData`, `pathsData` …), nicht neu erzeugen.
- Styles in `src/styles.css` mit den vorhandenen CSS-Variablen.
