# Kerker & Licht

Zwei Offline-Handyspiele in einer einzigen HTML-Datei (`index.html`), ohne Internet, ohne Werbung.

- **Kerker-Wischer**: Roguelike auf neun Feldern. 4 Helden mit Spezialfähigkeiten, 5 Etagen mit eigenen Bossen, 15 Relikte, Bomben, Mimics, Händler, Endlos-Modus und eine tägliche Tagesgruft.
- **Lichtläufer**: Arcade für einen Finger. Zonen mit Lasern, Rotoren und Minen, Power-ups, Überladung, Missionen mit Rängen und Skins.

Beide Spiele gibt es in zwei Grafikstilen (Warm & flach, Papier). Soundeffekte und Musik werden im Browser erzeugt, Spielstände bleiben auf dem Gerät.

## Aufs Handy bringen

- **Als Web-App (empfohlen):** Den Ordner `spiel/` über HTTPS ausliefern, zum Beispiel mit GitHub Pages. Seite im Handy-Browser öffnen und „Zum Startbildschirm hinzufügen“ wählen. Der Service Worker (`sw.js`) speichert alles für den Offline-Betrieb.
- **Als Datei:** `index.html` aufs Handy kopieren und im Browser öffnen. Die Datei enthält Schriften, Grafiken und Code vollständig.

## Bauen

Der Quellcode liegt in `src/`. Nach Änderungen:

```
python3 spiel/build.py
```

Das erzeugt `spiel/index.html` mit eingebetteten Schriften. Mit `--artifact PFAD` entsteht zusätzlich eine Variante ohne Manifest und Service Worker.

## Schriften

Fraunces, IBM Plex Sans, IBM Plex Mono, Caveat und Patrick Hand stehen unter der SIL Open Font License 1.1 und sind als lateinische Teilmenge eingebettet (`src/fonts/`).
