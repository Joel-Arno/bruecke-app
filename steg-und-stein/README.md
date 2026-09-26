# Steg & Stein

Ein gemütliches Knobelspiel für zwischendurch. Tiere stehen auf kleinen Inseln und wollen nach Hause.
Du legst Steine und Planken ins Wasser, bis jedes Tier einen Weg hat. Mit „Los!“ spazieren alle heim.
Es gibt kein Game Over und keinen Zeitdruck. Wer mit weniger Teilen auskommt, bekommt mehr Sterne.

Das Spiel läuft im Handy-Browser und lässt sich als App auf den Homescreen legen (PWA).
Danach funktioniert es auch offline.

## So wird gespielt

- **Aufs Wasser tippen** legt das gewählte Teil (Stein oder Planke).
- **Ein gelegtes Teil antippen** hebt es wieder auf.
- **Planke nochmal antippen** dreht sie (↔ / ↕).
- Über jedem Tier zeigt eine Blase, ob es schon einen Weg hat: **?** heißt noch nicht, **♥** heißt ja. Sein Weg wird mit farbigen Punkten angezeigt.
- **Los!** schickt alle Tiere nach Hause. Unterwegs flattern Schmetterlinge herum: Wer sie antippt, bekommt eine Muschel.

## Die Reise

| Kapitel   | Neu dabei                                                             | frei ab |
| --------- | --------------------------------------------------------------------- | ------- |
| Am Teich  | Steine, ein und zwei Tiere                                            | sofort  |
| Im Schilf | Planken: überbrücken zwei Felder auf einmal                           | 8 ★     |
| Die Bucht | Ebbe & Flut: Sandbänke nur bei Ebbe, Schwimmstege nur bei Flut        | 18 ★    |
| Der Fluss | Flöße treiben in der Strömung hin und her, Tiere warten und fahren mit | 28 ★    |
| Heimweg   | alles gemischt, bis zu drei Tiere                                     | 38 ★    |

Jedes Kapitel hat 6 Levels. Innerhalb eines Kapitels wird das nächste Level frei, sobald das vorige geschafft ist.

**Tagesrätsel:** Jeden Tag gibt es ein neues, automatisch erzeugtes Rätsel mit den Tieren von deiner Insel.

## Heimatinsel

Jedes Tier, das du nach Hause gebracht hast, zieht mit eigenem Häuschen auf deine Insel und spaziert dort herum.
Tippe ein Tier an, dann erzählt es etwas über sich. Ab und zu kommt auch dort ein Schmetterling vorbei.

Mit **Muscheln** (🐚) schmückst du die Insel: Blumenbeet, Busch, Pilzkreis, Laterne, Bank, Apfelbaum, Ruderboot,
Brunnen, Windmühle, Leuchtturm und mehr. Abbauen gibt die Muscheln vollständig zurück.

Muscheln gibt es für geschaffte Levels (mehr für mehr Sterne), für bessere Ergebnisse beim Wiederholen,
für das Tagesrätsel und für gefangene Schmetterlinge.

Im **Album** stehen alle 12 Tiere mit kleinem Steckbrief.

## Lokal starten

Kein Build-Schritt nötig, nur ein kleiner Webserver (wegen der JavaScript-Module):

```bash
cd steg-und-stein
npx http-server -p 8080 -c-1
# dann http://localhost:8080 öffnen
```

Offline-Modus und „Zum Home-Bildschirm“ funktionieren nur über HTTPS, zum Beispiel mit GitHub Pages:
**Settings → Pages → Deploy from a branch**, danach ist das Spiel unter
`https://<benutzername>.github.io/<repo-name>/steg-und-stein/` erreichbar.

## Levels prüfen

Alle Levels werden von einem Löser geprüft: Ist das Level lösbar, stimmt die Mindestzahl an Teilen („par“, nötig für 3 Sterne),
und reicht das Material?

```bash
cd steg-und-stein
node tools/check-levels.mjs            # alle Levels
node tools/check-levels.mjs 2-3 --show # ein Level mit eingezeichneter Lösung
node tools/check-levels.mjs --free     # mit reichlich Material rechnen (zum Entwerfen)
```

## Aufbau

```
steg-und-stein/
├── index.html, style.css      Oberfläche (Insel, Reise, Level, Ergebnis, Album, Bauen)
├── manifest.webmanifest, sw.js  PWA und Offline-Cache
├── fonts/fredoka-latin.woff2  Schrift „Fredoka“ (SIL Open Font License)
├── vendor/three.module.min.js Three.js r186
├── tools/check-levels.mjs     Level-Prüfung mit dem Löser
└── js/
    ├── main.js      Ablauf, Bildschirme, Eingabe, Belohnungen, Album, Bauen
    ├── puzzle.js    Rätsel-Logik ohne Grafik: Karte, Wegsuche (mit Warten und Floßfahren), Löser, Tagesrätsel
    ├── levels.js    die 30 Levels in 5 Kapiteln
    ├── scene.js     Renderer, Licht, Wasser mit Gezeiten, Kamera, Partikel
    ├── levelview.js 3D-Ansicht eines Levels, Spaziergang, Schmetterlinge
    ├── island.js    Heimatinsel mit Häuschen, Deko und herumlaufenden Tieren
    ├── models.js    alle Voxel-Modelle (12 Tiere, Häuser, Steine, Planken, Deko)
    ├── voxel.js     fasst viele Quader zu einer Geometrie zusammen
    ├── audio.js     sanfte Geräusche und leise Musik, live erzeugt
    └── storage.js   Spielstand im localStorage
```

### Kartenzeichen in `levels.js`

| Zeichen | Bedeutung                                      |
| ------- | ---------------------------------------------- |
| `.`     | Wasser, hier kann man bauen                    |
| `#`     | Wiese                                          |
| `T`     | Baum (nicht begehbar)                          |
| `R`     | Fels im Wasser                                 |
| `~`     | Sandbank (nur bei Ebbe begehbar)               |
| `=`     | Schwimmsteg (nur bei Flut begehbar)            |
| `:`     | Strömung, Floß-Bahn (festgelegt über `rafts`)  |
| `a`–`d` | Start eines Tieres, `A`–`D` sein Zuhause       |

Mit `?debug` in der URL sind Spielstand, Brett und Ansicht unter `window.__debug` erreichbar.
