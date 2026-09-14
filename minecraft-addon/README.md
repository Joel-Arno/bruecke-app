# Cinerit — Minecraft Bedrock Addon

Zwei Packs für Minecraft Bedrock 26.45. Inhaltliche Beschreibung in
[KONZEPT.md](KONZEPT.md).

    minecraft-addon/
    ├── KONZEPT.md
    ├── README.md
    ├── cinerit_BP/            <- Behavior Pack
    │   ├── manifest.json
    │   └── scripts/main.js
    └── cinerit_RP/            <- Resource Pack
        ├── manifest.json
        └── textures/

Die Ordnernamen `cinerit_BP` und `cinerit_RP` sind bewusst so gewählt: Sobald
sie zwischen anderen Packs im `com.mojang`-Ordner liegen, soll man auf einen
Blick sehen, was zusammengehört und welches welches ist.

## Installieren

Die beiden Ordner werden **nicht** zusammen in einen Unterordner gelegt.
`cinerit_BP` kommt in `development_behavior_packs`, `cinerit_RP` in
`development_resource_packs`. Die `development_`-Varianten sind wichtig:
Minecraft lädt sie bei jedem Weltbeitritt neu, die normalen Pack-Ordner nicht.

**Windows**

    %localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\

**iPad, über die Dateien-App**

Dateien-App → *Auf meinem iPad* → *Minecraft* → `games/com.mojang/`.
Erscheint dort kein Minecraft-Eintrag, gibt es diesen Weg auf deinem Gerät
nicht — dann bauen wir ein `.mcaddon`.

**iPad, über .mcaddon-Import**

Ein direkt von GitHub heruntergeladenes ZIP funktioniert dafür **nicht**: Es
hat einen zusätzlichen Ordner obendrüber, und Minecraft findet die Manifeste
dann nicht. Ein passendes Archiv müssen wir bauen — sag Bescheid, dann kommt
ein Skript dazu.

## Prüfen, ob es geladen hat

Content-Log einschalten: *Einstellungen → Creator → Content Log GUI* und
*Content Log File*. Der Log zeigt Fehler beim Laden namentlich an, statt dass
ein Pack einfach nicht in der Liste auftaucht.

Beim Betreten der Welt sollte im Chat stehen:

    [Cinerit] Addon geladen — Version 0.1.0 (Schritt 1)

Damit Skripte überhaupt laufen, muss in den Welteinstellungen unter
*Experimente* die **Beta-APIs** nicht aktiviert sein — wir benutzen
ausschließlich stabile Module. Sollte das Skript trotzdem nicht anspringen,
steht der Grund im Content Log.

## Texturen

Die 30 Werkzeug-Texturen entstehen im Skript, nicht in 30 Einzeldateien:

    cd textur_werkstatt
    python3 generiere_texturen.py                  # schreibt die 30 PNGs
    python3 generiere_texturen.py --vorschau v.png # plus Kontaktbogen

Ohne Bibliotheken, laeuft ueberall, wo Python laeuft — auch in einer
Python-App auf dem iPad. Das Skript schreibt PNG selbst.

Gezeichnet wird in `generiere_texturen.py` an zwei Stellen:

`FORMEN` haelt pro Werkzeug 16 Zeilen zu 16 Zeichen. `.` ist durchsichtig,
`l m d` sind hell, mittel und dunkel des Materials, `s t` der Griff. Zeichen
tauschen, Skript laufen lassen, fertig.

`ADERN` haelt pro Werkzeug drei Ringe aus `(zeile, spalte)`. Ring 1 gluht ab
Stufe I, Ring 2 ab Stufe II, Ring 3 ab Stufe III. Die Farbe haengt dabei nicht
nur an der Stufe, sondern auch am Ring: Bei Stufe III gluehen die inneren
Adern gelb, waehrend die aeusseren erst anspringen. So sieht Stufe III nach
Hitze aus, die sich von innen nach aussen frisst, und nicht nach mehr orangen
Punkten.

Das Skript prueft beim Start, dass jede Zeile wirklich 16 Zeichen hat und
keine Ader im Leeren liegt. Beides verrutscht beim Zeichnen im Texteditor,
ohne dass man es sieht — im Spiel faellt es erst auf, wenn ein Glutpunkt frei
neben dem Werkzeug schwebt.

`item_texture.json` wird mitgeschrieben. Kurzname und Dateiname stammen aus
derselben Schleife und koennen deshalb nicht auseinanderlaufen.

Aktueller Stand als Kontaktbogen: [`textur_werkstatt/vorschau.png`](textur_werkstatt/vorschau.png)

Optional, aber schoen: zwei `pack_icon.png`, je 128 x 128, in `cinerit_BP/`
und `cinerit_RP/`. Fehlen sie, zeigt Minecraft ein Platzhalter-Icon.

## Versionen

| Modul | Version |
|---|---|
| `@minecraft/server` | `2.9.0` |
| `@minecraft/server-ui` | `2.1.0` |

Prüfen lässt sich das unter `https://registry.npmjs.org/@minecraft/server` im
Feld `dist-tags`: `latest` ist die stabile Version. Tags, die auf `-stable`
enden (etwa `2.10.0-beta.1.26.44-stable`), nennen den Spiel-Build, zu dem eine
Modul-Linie gehört.
