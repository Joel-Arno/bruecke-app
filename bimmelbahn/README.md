# Bimmelbahn

Ein schnelles Spiel für zwischendurch. Deine kleine Lok fährt ständig weiter, du lenkst.
Sammle Fahrgäste ein: Jeder hängt einen Wagen in seiner Farbe an deinen Zug.
Am Bahnhof in ihrer Farbe steigen sie wieder aus, und der Zug wird kürzer.
Fährst du gegen den Zaun, einen Baum oder den eigenen Zug, ist die Runde vorbei.

## Steuerung

| Handy                         | Tastatur          | Aktion                       |
| ----------------------------- | ----------------- | ---------------------------- |
| Wischen                       | Pfeiltasten / WASD | in diese Richtung fahren     |
| links / rechts tippen         |                   | links / rechts abbiegen      |
| ❚❚                            | Esc / P           | Pause                        |

## Regeln

- **Punkte:** Liefert man mehrere Fahrgäste gleicher Farbe auf einmal ab, gibt es eine Kombo: 1 → 1, 2 → 3, 3 → 6, 4 → 10 Punkte …
- **Goldgäste** kommen ab und zu vor, dürfen an jedem Bahnhof aussteigen und bringen 5 Punkte.
- **Geduld:** Der Kreis unter einem wartenden Fahrgast schrumpft. Ist er weg, geht der Fahrgast verärgert, und du verlierst ein Herz. Bei drei verlorenen Herzen ist die Runde vorbei.
- **Pfeile** über Bahnhöfen zeigen, wohin deine aktuellen Fahrgäste wollen.
- **Mit der Zeit:** Der Zug wird schneller, neue Linien (Farben) kommen dazu, Bäume wachsen und Bahnhöfe ziehen um.
- **Lokschuppen:** Jeder abgelieferte Fahrgast bringt eine Fahrkarte. Damit schaltest du neue Loks frei: Waldbahn, Blauer Blitz, Postzug, Nachtexpress und Goldlok.

## Lokal starten

```bash
cd bimmelbahn
npx http-server -p 8080 -c-1
# dann http://localhost:8080 öffnen
```

Offline-Modus und „Zum Home-Bildschirm“ gehen nur über HTTPS, zum Beispiel mit GitHub Pages
(`https://<benutzername>.github.io/<repo-name>/bimmelbahn/`).

## Aufbau

```
bimmelbahn/
├── index.html, style.css      Oberfläche (HUD, Start, Game Over, Pause, Lokschuppen)
├── manifest.webmanifest, sw.js  PWA und Offline-Cache
├── fonts/fredoka-latin.woff2  Schrift „Fredoka“ (SIL Open Font License)
├── vendor/three.module.min.js Three.js r186
└── js/
    ├── main.js    Spiellogik, Zug, Fahrgäste, Bahnhöfe, Kamera, Eingabe, Lokschuppen
    ├── models.js  Voxel-Modelle: Loks, Wagen, Fahrgäste, Bahnhöfe, Schienen, Landschaft
    ├── voxel.js   fasst viele Quader zu einer Geometrie zusammen
    └── audio.js   Geräusche, live mit Web Audio erzeugt
```

Mit `?debug` in der URL ist der Spielzustand unter `window.__debug` erreichbar.
