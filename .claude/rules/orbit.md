---
paths:
  - "shared/**"
---

# Bahnlogik

- Fachliche Korrektheit wird gegen externe Referenzen geprüft, nicht gegen selbst erdachte Werte. Referenzen liegen in `fixtures/` und stammen von Heavens-Above bzw. CelesTrak.
- Tests rechnen relativ zur Epoche in `fixtures/iss-omm.json`, nie relativ zu „jetzt“: SGP4 wird mit dem Abstand zur Epoche ungenau.
- Plausibilitätsgrenzen müssen etwas ausschließen: ISS-Höhe 370–440 km, |Breite| ≤ Bahnneigung, über Köln binnen 24 h mindestens ein Überflug über 10°. „Elevation −90…90°“ allein reicht nicht, auch Radiant liegen in diesem Bereich.
- Wenn du einen Wert nicht gegen eine Referenz prüfen kannst, sag das ausdrücklich, statt einen Test mit geschätzten Werten zu schreiben.
