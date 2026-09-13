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

Alle Texturen sind selbst gepixelt. Was gebraucht wird, steht jeweils im
Schritt, in dem es dazukommt. Für Schritt 1 wird noch keine gebraucht — bis auf
optional zwei Pack-Icons:

| Datei | Größe |
|---|---|
| `cinerit_BP/pack_icon.png` | 128 × 128 |
| `cinerit_RP/pack_icon.png` | 128 × 128 |

Fehlen sie, zeigt Minecraft ein Platzhalter-Icon. Das Pack lädt trotzdem.

## Versionen

| Modul | Version |
|---|---|
| `@minecraft/server` | `2.9.0` |
| `@minecraft/server-ui` | `2.1.0` |

Prüfen lässt sich das unter `https://registry.npmjs.org/@minecraft/server` im
Feld `dist-tags`: `latest` ist die stabile Version. Tags, die auf `-stable`
enden (etwa `2.10.0-beta.1.26.44-stable`), nennen den Spiel-Build, zu dem eine
Modul-Linie gehört.
