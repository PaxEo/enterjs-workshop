# Was fliegt da über uns? – Satelliten-Tracker

Beispielprojekt für den Workshop **„Webanwendungen mit Claude Code entwickeln: Workflows, Kontrolle und Automatisierung“** (enterJS 2026).

Ein 3D-Globus mit Satelliten aus den Bahndaten von [CelesTrak](https://celestrak.org), gerechnet mit [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4). Frontend mit Vite, React und [globe.gl](https://globe.gl), Backend mit Express 5.

## Vorbereitung

Voraussetzungen: Node.js ≥ 22, Git, [Claude Code](https://docs.claude.com/claude-code) und ein aktueller Chrome oder Edge.

```sh
git clone <repo-url> sat-tracker
cd sat-tracker
npm install
npm run check-setup
```

`check-setup` prüft die Umgebung und legt eine `.env` an.

## Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | API (Port 3001) und Frontend (http://localhost:5173) starten |
| `npm run stop` | hängengebliebene Server beenden (v. a. unter Windows) |
| `npm run verify` | Typecheck, Lint und Tests mit knapper Ausgabe |
| `npm test` | nur die Tests (Vitest) |
| `npm run fetch-data -- --force` | Bahndaten-Snapshot neu laden (sparsam! siehe unten) |

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `shared/` | Bahnlogik als reine Funktionen (Browser und Node) und gemeinsame Typen |
| `server/` | Express-API: `/api/groups`, `/api/groups/:group`, `/api/satellites/:noradId` |
| `src/` | React-Frontend: Globus, Satellitenliste, Detailansicht |
| `data/` | Snapshot der CelesTrak-Bahndaten und Notizen zu einzelnen Satelliten |
| `fixtures/` | eingefrorene Testdaten: ISS-Bahndaten und Referenzüberflüge über Köln von Heavens-Above |
| `scripts/` | Hilfsskripte für Setup, Prüfung und Daten |

## Workshop-Stände

Jeder Block endet auf einem Git-Tag. Wer den Anschluss verliert, springt mit `git checkout <tag>` zum Stand am Ende des Blocks:

| Tag | Stand |
| --- | --- |
| `step-00-start` | Ausgangslage |
| `step-01-filter` | Gruppenfilter, Bugfix |
| `step-02-passes` | ISS-Überflugvorhersage |
| `step-03-setup` | Projektwissen, Skills, Hooks und Subagenten für Claude Code |
| `step-04-mcp` | Playwright-MCP, Standortbestimmung, E2E-Tests |
| `step-05-automation` | migrierte Panels, Headless-Skripte, parallele Features |
| `final` | Endstand |

## Datenquellen

- Bahndaten: [CelesTrak](https://celestrak.org) (GP-Daten im OMM-Format). CelesTrak aktualisiert höchstens alle zwei Stunden und sperrt IPs, die zu oft abfragen. Deshalb arbeitet das Projekt mit einem Snapshot in `data/` und fragt CelesTrak nie automatisch ab.
- Referenzüberflüge in `fixtures/`: [Heavens-Above](https://www.heavens-above.com).
- Erdtexturen: [three-globe](https://github.com/vasturiano/three-globe) (NASA Blue Marble).
- `data/notes.json` enthält Freitexte aus verschiedenen Quellen und ist **nicht vertrauenswürdig**.
