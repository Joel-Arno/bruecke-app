# Schatzhüpfer

Ein kleines Hüpfspiel im Stil von Crossy Road, für zwischendurch und unterwegs.
Du steuerst Gollum über Wiesen, Straßen, Flüsse und Gleise, so weit du kommst.

Das Spiel läuft direkt im Handy-Browser und lässt sich als App auf den Homescreen legen (PWA).
Danach funktioniert es auch offline.

## Steuerung

| Handy                       | Tastatur              | Aktion              |
| --------------------------- | --------------------- | ------------------- |
| Tippen                      | ↑ / W / Leertaste     | vorwärts hüpfen     |
| Wischen links/rechts        | ← → / A D             | zur Seite           |
| Wischen nach unten          | ↓ / S                 | zurück              |
| ❚❚ oben rechts              | Esc / P               | Pause               |

## Was es gibt

- **Wiese:** Bäume, Steine und Baumstümpfe versperren den Weg. Ein freier Pfad existiert immer.
- **Straße:** Autos und Laster, die mit der Zeit schneller werden.
- **Fluss mit Baumstämmen:** auf die Stämme springen, sie tragen dich mit. Nicht vom Bildschirm treiben lassen!
- **Seerosen-Teich:** Grüne Blätter sind stabil. Gelbbraune sind morsch und sinken, wenn du zu lange draufstehst.
- **Bahngleise:** Wenn das Signal rot blinkt und es bimmelt, kommt gleich der Zug.
- **Stachelfallen** (ab Reihe ~35): Die Stacheln schnellen im Rhythmus hoch, also auf das Muster achten.
- **Adler:** Wer zu lange trödelt oder zu weit zurückfällt, wird geschnappt.

### Sammeln

- 🐟 **Fisch** = 1 Punkt, 🐠 **Goldfisch** = 5. Fische sind die Währung für neue Figuren.
- Täglicher Bonus: +20 🐟 beim ersten Start des Tages.

### Power-ups

- 💍 **Der Ring:** 6 Sekunden unsichtbar. Autos, Züge und Stacheln können dir nichts. (Wasser leider schon.)
- ⏳ **Sanduhr:** 6 Sekunden Zeitlupe für alles außer dich.
- 🧲 **Magnet:** 10 Sekunden lang fliegen dir Fische in der Nähe zu.

### Figuren

Gollum (gratis), Huhn (50), Frosch (100), Ente (150), Pinguin (250), Roboter (400), Geist (600) und Schatz-Gollum (1000).

### Tages-Challenge

Jeden Tag gibt es eine feste Welt, die für alle gleich ist. Das Menü zeigt deinen Bestwert von heute und die Zahl der Versuche.

## Lokal starten

Das Spiel braucht keinen Build-Schritt, nur einen kleinen Webserver (wegen der JavaScript-Module):

```bash
cd schatzhuepfer
npx http-server -p 8080 -c-1
# dann http://localhost:8080 öffnen
```

Zum Testen auf dem Handy im selben WLAN: `http://<IP-deines-Rechners>:8080`.
Offline-Modus und „Zum Homescreen hinzufügen“ funktionieren allerdings nur über HTTPS (z.B. GitHub Pages).

## Veröffentlichen mit GitHub Pages

1. Im Repo auf GitHub: **Settings → Pages**.
2. Unter „Build and deployment“ als Quelle **Deploy from a branch** wählen, dann den Branch und den Ordner `/ (root)`.
3. Nach ein bis zwei Minuten ist das Spiel erreichbar unter
   `https://<benutzername>.github.io/<repo-name>/schatzhuepfer/`.
4. Auf dem Handy öffnen und über **Teilen → Zum Home-Bildschirm** (iPhone) bzw. **⋮ → App installieren** (Android) als App ablegen.

## Aufbau

```
schatzhuepfer/
├── index.html            Seite mit HUD, Menü, Game Over, Pause, Shop
├── style.css             Oberfläche
├── manifest.webmanifest  PWA-Infos (Name, Icons, Hochformat)
├── sw.js                 Service Worker für den Offline-Betrieb
├── icons/                App-Icons
├── vendor/three.module.min.js   Three.js r186 (lokal, damit es offline geht)
└── js/
    ├── main.js     Spielschleife, Spieler, Steuerung, Kamera, UI, Shop
    ├── world.js    Level-Generator und alle Zonen (Straße, Fluss, Gleise, Fallen …)
    ├── models.js   Voxel-Modelle: Figuren, Fahrzeuge, Bäume, Power-ups, Adler
    ├── voxel.js    fasst viele Quader zu einer Geometrie zusammen (schnell auf dem Handy)
    ├── audio.js    Soundeffekte, live mit Web Audio erzeugt
    └── storage.js  Spielstand (Rekord, Fische, Figuren) im localStorage
```

Mit `?debug` in der URL sind Welt und Spieler in der Browser-Konsole unter `window.__debug` erreichbar.
