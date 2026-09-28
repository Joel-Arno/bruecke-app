# Couchclub

Spieleabend-App für ein Handy: Spielerprofile, Statistiken und Spiele gegen die KI oder zu zweit, dazu zwei Solo-Abenteuer.

- `index.html`, `styles.css`, `core.js`: App-Kern mit Profilen, Spielauswahl und Spielrahmen
- `g-*.js`: je ein Spiel, das sich mit `CC.register(...)` anmeldet
- `g-abenteuer.js`: Kerker-Wischer und Lichtläufer. Beide laufen im Vollbild aus `spiele.html`. Jeder Spieler hat einen eigenen Spielstand (`kerker-licht-v2@<Spieler-ID>` im Browser-Speicher). Das Spiel meldet Start, Laufende und Rückweg per `postMessage` an den Couchclub.

`spiele.html` wird aus `spiel/src` gebaut, bitte nicht von Hand bearbeiten:

```
python3 spiel/build.py --couchclub couchclub
```

`index.html` enthält nur den Seiteninhalt. Das Grundgerüst mit doctype, head und body ergänzt die Veröffentlichung als Artifact.
