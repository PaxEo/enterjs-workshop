---
name: add-satellite-group
description: Fügt eine weitere CelesTrak-Satellitengruppe hinzu (Daten-Snapshot, Gruppenliste, Tests). Verwenden, wenn neue Gruppen wie „amateur“, „galileo“ oder „iridium-NEXT“ im Tracker erscheinen sollen.
argument-hint: "<celestrak-gruppe> <Anzeigename>"
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(npm run verify:*)
---

# Satellitengruppe hinzufügen

Auftrag: $ARGUMENTS

Die Gruppen-ID muss exakt dem `GROUP`-Parameter von CelesTrak entsprechen (Liste: https://celestrak.org/NORAD/elements/).

## Schritte

1. **Daten:** Den Snapshot holst du **nicht** selbst. CelesTrak sperrt IPs bei zu vielen Abrufen, und `npm run fetch-data` ist für dich gesperrt. Bitte den Benutzer, einmalig auszuführen:
   ```sh
   npm run fetch-data
   ```
   (lädt nur fehlende Gruppen). Warte auf die Bestätigung, dass `data/<gruppe>.json` existiert.
2. **Gruppenliste:** Eintrag in `GROUPS` in `shared/groups.ts` ergänzen. Kleine Gruppen vor `starlink` und `active` einsortieren, die Reihenfolge ist die Anzeigereihenfolge.
3. **Tests:** In `server/app.test.ts` prüfen, dass `GET /api/groups` die neue Gruppe mit `count > 0` liefert.
4. `npm run verify` ausführen.

Das Frontend braucht keine Änderung: `GroupFilter` liest die Gruppen aus der API.
