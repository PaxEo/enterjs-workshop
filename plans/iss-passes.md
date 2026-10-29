# Plan: ISS-Überflugvorhersage

Erstellt im Plan-Modus (Block 3), im Editor überarbeitet und dann freigegeben. Änderungen gegenüber dem ersten Entwurf sind mit **[überarbeitet]** markiert.

## Ziel

Für den Standort des Beobachters die ISS-Überflüge der nächsten Tage berechnen und anzeigen. Hervorgehoben werden die mit bloßem Auge sichtbaren, dazu ein Countdown bis zum nächsten sichtbaren Überflug.

## Fachliche Regeln

Ein Überflug ist der Zeitraum, in dem die ISS mindestens **10°** über dem Horizont steht. **Sichtbar** ist er, solange gleichzeitig gilt:

1. Die Sonne steht beim Beobachter mindestens **6° unter dem Horizont** (bürgerliche Dämmerung vorbei).
2. Die ISS selbst wird von der Sonne beleuchtet, liegt also **nicht im Erdschatten**. **[überarbeitet]** Der erste Entwurf hatte diese Bedingung vergessen und hätte nachts jeden Überflug als sichtbar gemeldet.

satellite.js 7 liefert dafür `sunPos` und `shadowFraction`, eine weitere Bibliothek ist nicht nötig.

## Schritte

1. **`shared/passes.ts`** mit reinen Funktionen: `sunElevationDeg`, `isSunlit`, `predictPasses(sat, observer, from, options)`. Abtastung in festen Schritten (Standard 20 s), Überflug beginnt bzw. endet beim Über- bzw. Unterschreiten der Mindest-Elevation.
2. **Tests zuerst** in `shared/passes.test.ts` **[überarbeitet: Referenzdaten statt selbst erdachter Werte]**:
   - Abgleich mit `fixtures/reference-passes.json` (Heavens-Above, Köln, 10 Tage): Jeder sichtbare Überflug wird gefunden, Beginn und Ende auf ±30 s.
   - Sonnenstand gegen `astronomy-engine` als unabhängige Gegenprobe (±0,5°).
   - Plausibilität: Beginn ≤ Höchststand ≤ Ende, Elevation 10–90°, sichtbarer Abschnitt liegt im Überflug.
3. **`GET /api/passes?lat&lon&norad&days`** in `server/routes/passes.ts`, Validierung mit Zod (`lat` −90…90, `lon` −180…180, `days` 1…10, `norad` Standard 25544), Tests mit Supertest.
4. **Frontend** `src/passes/`: Liste der Überflüge (Datum, Uhrzeit, max. Elevation, Badge „sichtbar“), Countdown bis zum nächsten sichtbaren Überflug, Klick springt mit der Simulationsuhr eine Minute vor den Überflug und dreht den Globus zum Beobachter.
5. `npm run verify` grün, im Browser mit Köln prüfen.

## Bewusst nicht enthalten

- Helligkeit (Magnitude) des Überflugs
- Andere Satelliten als die ISS in der Oberfläche (die API kann es schon über `norad`)
- Eigener Standort per Browser-Ortung
