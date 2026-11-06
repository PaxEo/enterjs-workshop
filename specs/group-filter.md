# Spec: Satelliten nach CelesTrak-Gruppen filtern

Status: Entwurf · Stand: 2026-11-06

## Ziel

Nutzer wählen in der Sidebar aus, welche CelesTrak-Gruppen auf dem Globus und in der Liste erscheinen. Heute ist die Auswahl fest über `DEFAULT_GROUPS` in `src/config.ts` verdrahtet (`stations`, `visual`).

## Ausgangslage

- Gruppen sind in `shared/groups.ts` (`GROUPS`) definiert: `stations` (21), `visual` (155), `weather` (73), `gps-ops` (32), `starlink` (11.124), `active` (16.755). Die Zahlen stammen aus den aktuellen `data/*.json`.
- `GET /api/groups` liefert `id`, `label` und `count` je Gruppe, `GET /api/groups/:id` die Bahndaten.
- `useSatellites(groups)` in `src/useSatellites.ts` lädt jede Gruppe einmal, cacht sie und liefert die Vereinigung ohne Duplikate.

## Verhalten

### Auswahl

- Es können beliebig viele Gruppen gleichzeitig aktiv sein. Angezeigt wird die **Vereinigung**. Ein Satellit, der in mehreren aktiven Gruppen steckt, erscheint genau einmal.
- Bedienung über **umschaltbare Chips** in der Sidebar, zwischen Zeitsteuerung und Satellitenliste, unter der Überschrift „Gruppen“.
- Jeder Chip zeigt das deutsche Label aus `GROUPS` und die Anzahl (`count` aus `/api/groups`).
- Aktive Chips sind visuell abgesetzt und tragen `aria-pressed="true"`. Inaktive tragen `aria-pressed="false"`.
- Die Reihenfolge der Chips entspricht der Reihenfolge in `GROUPS`.

### Wirkung

- Der Filter wirkt auf **Globus und Liste** gleichermaßen. Beide zeigen genau die Vereinigung der aktiven Gruppen.
- Die bestehende Textsuche (Name oder NORAD-ID) filtert die Liste **zusätzlich** innerhalb dieser Menge.
- Die Überschrift „Satelliten (n)“ und der HUD-Zähler zeigen die Anzahl der Vereinigung, ohne die Textsuche.

### Laden

- Die Bahndaten einer Gruppe werden bei ihrer **ersten Aktivierung** geladen und danach im Client gecacht.
- Abwählen blendet die Gruppe nur aus. Erneutes Aktivieren lädt nicht noch einmal.
- Während eine Gruppe lädt, zeigt ihr Chip einen Ladezustand. Bereits geladene Gruppen bleiben sichtbar.
- Schlägt das Laden fehl, zeigt der Chip einen Fehlerzustand und die Sidebar die Fehlermeldung. Abwählen und erneutes Aktivieren startet einen neuen Versuch.

### Große Gruppen

- Gruppen ab **1.000 Satelliten** gelten als groß. Das betrifft heute `starlink` und `active`. Der Schwellwert ist eine Konstante.
- Sie sind normal wählbar. Ist mindestens eine große Gruppe aktiv, zeigt die Sidebar einen Hinweis, etwa „Viele Satelliten: Laden und Darstellung können ruckeln.“
- Es gibt keine Bestätigungsabfrage und kein hartes Limit.

### Leere Auswahl

- Alle Chips abzuwählen ist erlaubt.
- Dann sind Globus und Liste leer, und die Sidebar zeigt „Keine Gruppe gewählt“.
- Bahnlinie und Hervorhebung verschwinden, weil kein Fokus-Satellit geladen ist.

### Ausgewählter Satellit

- Liegt der ausgewählte Satellit nach einer Änderung in **keiner** aktiven Gruppe mehr, wird die Auswahl aufgehoben (`selectedId = null`) und die Detailansicht geschlossen.
- Bleibt er über eine andere aktive Gruppe enthalten, bleibt die Auswahl bestehen.
- Ohne Auswahl hebt der Globus wie bisher die ISS hervor, falls sie in den aktiven Gruppen enthalten ist. Sonst gibt es keine Hervorhebung und keine Bahnlinie.

### Persistenz über URL

- Die Auswahl steht im Query-Parameter `groups`, kommagetrennt in der Reihenfolge von `GROUPS`. Beispiel: `?groups=stations,weather`.
- Jede Änderung aktualisiert die URL per `history.replaceState`. Es entsteht kein neuer History-Eintrag pro Klick.
- Beim Start gelten diese Regeln:
  - **Parameter fehlt:** Es gilt `DEFAULT_GROUPS`.
  - **Parameter ist leer** (`?groups=`): Die Auswahl ist leer, siehe „Leere Auswahl“.
  - **Unbekannte IDs:** Sie werden ignoriert und beim nächsten Schreiben der URL entfernt. Geprüft wird mit `isGroupId`.
  - **Doppelte IDs:** Sie werden zusammengefasst.
  - **Nur unbekannte IDs:** Das Ergebnis ist eine leere Auswahl, nicht der Standard.
- Andere Query-Parameter bleiben unverändert.

## Grenzen (nicht Teil dieser Spec)

- Keine Schnittmenge und keine Ausschluss-Logik, nur die Vereinigung.
- Keine neuen Gruppen über die sechs in `GROUPS` hinaus. Der Server und `scripts/fetch-data.ts` bleiben unverändert.
- Kein Färben der Satelliten nach Gruppe auf dem Globus.
- Kein Entladen des Caches beim Abwählen, kein Laden aller Gruppen beim Start.
- Keine Speicherung in `localStorage`.
- Keine Leistungsoptimierung für große Gruppen, etwa LOD oder Clustering.
- Die Verbesserung der Bildrate (FPS) ist nicht Teil dieser Spec.

## Akzeptanzkriterien

1. Ohne `groups`-Parameter sind beim Start genau die Chips aus `DEFAULT_GROUPS` aktiv. Globus und Liste zeigen deren Vereinigung.
2. Für jede Gruppe aus `GROUPS` gibt es einen Chip mit Label und Anzahl aus `/api/groups`, in der Reihenfolge von `GROUPS`.
3. Ein Klick auf einen inaktiven Chip aktiviert ihn. Die Satelliten der Gruppe erscheinen nach dem Laden auf Globus und Liste, die Zähler steigen entsprechend.
4. Ein Klick auf einen aktiven Chip deaktiviert ihn. Satelliten, die nur in dieser Gruppe waren, verschwinden sofort von Globus und Liste.
5. Ein Satellit in zwei aktiven Gruppen erscheint einmal. Wird eine der beiden abgewählt, bleibt er sichtbar. Beispiel: die ISS in `stations` und `visual`.
6. Dieselbe Gruppe abwählen und wieder aktivieren löst keinen zweiten Request an `/api/groups/:id` aus.
7. Während eine Gruppe lädt, zeigt ihr Chip einen Ladezustand. Nach einem Ladefehler zeigt er einen Fehlerzustand, und erneutes Aktivieren versucht es noch einmal.
8. Bei aktiver `starlink`- oder `active`-Gruppe erscheint der Hinweis auf große Datenmengen. Ohne große Gruppe erscheint er nicht.
9. Sind alle Chips abgewählt, sind Globus und Liste leer, und „Keine Gruppe gewählt“ wird angezeigt.
10. Ist ein Satellit ausgewählt und liegt nach dem Abwählen in keiner aktiven Gruppe mehr, schließt sich die Detailansicht. Liegt er noch in einer aktiven Gruppe, bleibt sie offen.
11. Die Textsuche filtert nur innerhalb der aktiven Gruppen.
12. Nach jeder Änderung steht die Auswahl in `?groups=…`, ohne neuen History-Eintrag. Ein Neuladen stellt dieselbe Auswahl wieder her.
13. Die URL-Regeln gelten wie beschrieben:
    - `?groups=stations,foo,stations` ergibt nur `stations`, die URL wird zu `?groups=stations`.
    - `?groups=` ergibt eine leere Auswahl.
    - `?groups=foo` ergibt eine leere Auswahl.
14. Die Chips sind per Tastatur bedienbar (Tab, Enter/Leertaste) und melden ihren Zustand über `aria-pressed`.
15. Tests:
    - Unit-Tests decken das Parsen und Serialisieren des URL-Parameters und die Vereinigung samt Deduplizierung ab.
    - Ein Komponententest deckt Kriterium 10 ab.
    - `npm test` läuft grün.
