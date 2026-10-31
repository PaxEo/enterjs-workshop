---
paths:
  - "server/**"
---

# API

- Ein Router pro Ressource in `server/routes/<name>.ts`, eingehängt in `server/app.ts` unter `/api/<name>`.
- Eingaben (Params und Query) immer mit Zod validieren, `safeParse` → bei Fehler `400` mit `{ error: z.prettifyError(...) }`.
- Nicht gefunden → `404` mit `{ error: '…' }` auf Deutsch.
- Antworttypen in `shared/api-types.ts` definieren, damit das Frontend sie nutzen kann.
- Express 5 matcht in Definitionsreihenfolge: feste Pfade (`/search`) **vor** Parametern (`/:noradId`) registrieren.
- Tests mit Supertest gegen `createApp()` in `<name>.test.ts` neben dem Router.
