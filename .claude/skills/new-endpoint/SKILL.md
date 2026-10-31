---
name: new-endpoint
description: Legt einen neuen Express-API-Endpunkt nach Projektkonvention an (Router, Zod-Validierung, Antworttyp, Supertest-Tests) und prüft das Ergebnis. Verwenden, wenn ein neuer Endpunkt unter /api gebraucht wird oder ein bestehender Router eine neue Route bekommt.
argument-hint: "<METHODE /api/pfad> <kurze Beschreibung>"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(npm run verify:*), Bash(node .claude/skills/new-endpoint/check-endpoint.mjs:*)
---

# Neuer API-Endpunkt

Auftrag: $ARGUMENTS

## Bestehende Router

!`node -e "console.log(require('fs').readdirSync('server/routes').filter(f=>!f.endsWith('.test.ts')).join('\n'))"`

## Vorgehen

1. **Ressource bestimmen.** Gehört der Endpunkt zu einem bestehenden Router (siehe oben), erweitere diesen. Sonst neuen Router `server/routes/<name>.ts` nach [templates/route.ts.tpl](templates/route.ts.tpl) anlegen und in `server/app.ts` unter `/api/<name>` einhängen.
2. **Reihenfolge prüfen.** Express 5 matcht in Definitionsreihenfolge: feste Pfade wie `/search` **vor** `/:noradId` registrieren.
3. **Validierung** aller Params und Query-Werte mit Zod und `safeParse`. Grenzen angeben (`min`, `max`, `int`). Fehler → `400` mit `{ error: z.prettifyError(...) }`.
4. **Antworttyp** in `shared/api-types.ts` ergänzen und im Router verwenden.
5. **Tests** in `server/routes/<name>.test.ts` nach [templates/route.test.ts.tpl](templates/route.test.ts.tpl): mindestens ein Erfolgsfall mit echten Daten aus `data/`, ein `400` pro Validierungsregel, ein `404`, falls es eine Einzelressource ist.
6. **Prüfen:**
   ```sh
   node .claude/skills/new-endpoint/check-endpoint.mjs <name>
   npm run verify
   ```
   Erst fertig melden, wenn beides grün ist.

## Nicht tun

- Keine Daten live von CelesTrak abrufen, nur `server/data.ts` verwenden.
- Keine neuen Abhängigkeiten installieren.
- Keine Frontend-Änderungen, außer der Auftrag verlangt es ausdrücklich.
