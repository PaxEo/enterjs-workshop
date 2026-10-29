# Spec: Satelliten nach Gruppen filtern

Entstanden im Interview-Muster (Block 3). Eine neue Session setzt ausschließlich diese Spec um.

## Ziel

Nutzer wählen in der Seitenleiste aus, welche CelesTrak-Gruppen auf dem Globus und in der Liste erscheinen. Bisher sind die Gruppen fest auf „Raumstationen“ und „Hellste“ eingestellt (`DEFAULT_GROUPS` in `src/config.ts`).

## Verhalten

- Die Seitenleiste zeigt alle Gruppen aus `GET /api/groups` als Checkboxen mit Anzahl der Satelliten.
- Mehrfachauswahl ist möglich. Satelliten, die in mehreren gewählten Gruppen vorkommen, erscheinen nur einmal (bereits in `useSatellites` umgesetzt).
- Eine Gruppe wird erst geladen, wenn sie zum ersten Mal ausgewählt wird. Während des Ladens steht „lädt …“ neben der Gruppe.
- Gruppen mit mehr als 1000 Satelliten tragen den Hinweis „groß“, damit klar ist, dass das Laden dauern kann.
- Die Auswahl steht im URL-Parameter `groups` (z. B. `?groups=stations,weather`), damit Links und Neuladen den Zustand behalten. Unbekannte Gruppen in der URL werden ignoriert. Fehlt der Parameter, gilt `DEFAULT_GROUPS`.
- Ist keine Gruppe gewählt, bleiben Globus und Liste leer und die Liste zeigt „Keine Gruppe ausgewählt“.

## Nicht Teil dieser Spec

- Suche nach Namen (gibt es bereits in der Liste)
- Speichern der Auswahl über die URL hinaus

## Akzeptanzkriterien

1. `parseGroupsParam` und `toGroupsParam` in `src/groups/groupParams.ts` haben Unit-Tests: gültige, leere, unbekannte und doppelte Werte.
2. Beim Wechsel der Auswahl ändert sich die URL ohne Neuladen der Seite (`history.replaceState`).
3. `npm run verify` ist grün.
