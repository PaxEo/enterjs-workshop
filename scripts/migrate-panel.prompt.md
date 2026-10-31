Migriere genau eine Datei: {{FILE}}

Das ist ein Info-Panel der Detailansicht im alten Muster (eigenes `fetch` in `useEffect` oder Klassenkomponente, eigener Lade-/Fehlerzustand). Bringe es auf das neue Muster. Vorbild ist die bereits migrierte Struktur:

- Daten über `useSatelliteDetails(noradId)` aus `src/details/useSatelliteDetails.ts`, Lade- und Fehlerzustände über `<PanelState query={…}>` aus `src/details/PanelState.tsx`.
- Für Live-Werte (Position, Geschwindigkeit, Elevation): `useSatelliteRecord(noradId)` und `useSimTime()` aus `src/clock.ts` statt `new Date()` und eigenem `setInterval`.
- Beobachter-Standort weiter über `DEFAULT_OBSERVER` aus `src/config.ts`.
- Funktionskomponente, Export-Name und Props (`{ noradId: number }`) bleiben gleich.
- Die Anzeige (Überschrift, Beschriftungen, Formate) bleibt gleich.
- Fremdtexte aus der API niemals als HTML rendern.

Regeln:
- Ändere ausschließlich {{FILE}}. Keine anderen Dateien, keine neuen Abhängigkeiten.
- Prüfe am Ende mit `npx eslint {{FILE}}` und `npx tsc --noEmit`. Beide müssen ohne Fehler durchlaufen.
- Antworte am Schluss mit genau einer Zeile: `OK` oder `FEHLER: <Grund>`.
