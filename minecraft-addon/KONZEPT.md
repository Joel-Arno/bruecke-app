# Cinerit — Konzept

Gemeinsame Referenz für alle Schritte. Wenn Code und dieses Dokument sich
widersprechen, ist das ein Fehler — dann reden wir, bevor einer von beiden
angepasst wird.

## Eckdaten

| | |
|---|---|
| Namensraum | `ja:` |
| Material | Cinerit (lat. *cinis*, Asche) |
| Thema | Endzeit-Legierung — verbrannt, aschgrau, Glutorange als Akzent |
| Zielversion | Minecraft Bedrock 26.45 (intern `1.26.45`) |
| `@minecraft/server` | `2.9.0` (stabil, veröffentlicht 04.08.2026) |
| `@minecraft/server-ui` | `2.1.0` (stabil, veröffentlicht 16.06.2026) |
| `min_engine_version` | `[1, 26, 40]` — bewusst unter der Spielversion |
| Sprache im Code | reines JavaScript, kein TypeScript, kein Build-Schritt |

## Die Grundidee

Drei Stufen, aber nicht drei Materialien. Die Stufen stecken in der **Tiefe**
und in der **Infusion**, nicht in einer Werkzeugleiter aus drei fast gleichen
Erzen. Damit bleibt es bei fünf Werkzeugen und einem Barren, während die
Fortschrittskurve trotzdem drei Stufen hat.

Der Kreislauf, der das zusammenhält:

    tiefer graben  ->  seltenere Erzgüte  ->  Glutkerne
                                                |
                                                v
    Barren + Glutkerne  ->  höhere Infusionsstufe  ->  besseres Werkzeug

Das ist der Satz, mit dem sich das Addon in einem Bewerbungsgespräch in
fünfzehn Sekunden erklären lässt: Die Belohnung fürs Tiefergehen ist nicht ein
besseres Schwert, sondern eine stärkere Infusion auf dem Schwert, das man schon
hat.

## Erz und Weltgenerierung

Drei Erzblöcke. Die Stein-/Tiefenschiefer-Unterscheidung ist hier nicht
kosmetisch, sondern trägt Information: Woraus der Block besteht, verrät, was er
abwirft.

| ID | Wirtsgestein | y-Bereich | Drop |
|---|---|---|---|
| `ja:cinerit_ore` | Stein | 16 bis −8 | 1× Roh-Cinerit |
| `ja:deepslate_cinerit_ore` | Tiefenschiefer | −8 bis −45 | 1–2× Roh-Cinerit |
| `ja:ember_cinerit_ore` | Tiefenschiefer | −45 bis −59, selten | 2–3× Roh-Cinerit + 25 % Glutkern |

Glutkerne gibt es sonst nirgends — außer selten vom Mob. Das macht die untersten
vierzehn Blöcke der Welt zum eigentlichen Ziel und gibt der Deep-Dark-Tiefe
einen Grund, dort zu sein.

## Items

| ID | Zweck |
|---|---|
| `ja:raw_cinerit` | Erzdrop, wird im Ofen zum Barren |
| `ja:cinerit_ingot` | Werkstoff für Werkzeuge und Infusionsstufe I |
| `ja:ember_core` | Glutkern — nur für Infusionsstufe II und III |

## Blöcke

| ID | Zweck |
|---|---|
| `ja:cinerit_block` | Vollblock, Lagerung |
| `ja:cinerit_bricks` | Ziegel, Deko |
| `ja:cinerit_lamp` | Lampe mit Lichtabgabe |
| `ja:infusion_altar` | Kernstück, öffnet bei Interaktion das Menü |

## Werkzeuge

`ja:cinerit_sword`, `ja:cinerit_pickaxe`, `ja:cinerit_axe`,
`ja:cinerit_shovel`, `ja:cinerit_hoe` — je mit Rezept. Keine Rüstung, die
braucht Attachables und kommt frühestens in Version 2.

## Mob

`ja:ash_walker` (Aschewandler). Feindlich, spawnt tief unter Tage, droppt
Roh-Cinerit und selten einen Glutkern. Kein eigenes Modell — vorhandene
Vanilla-Geometrie mit eigener Textur. Welche Geometrie, entscheiden wir in
Schritt 4.

## Der Infusions-Altar

Bedrock erlaubt keine eigenen Verzauberungen. Wir bauen sie per Script nach:
Der Spieler hält ein Werkzeug in der Hand, interagiert mit dem Altar, wählt im
Menü (`@minecraft/server-ui`) einen Effekt und eine Stufe, zahlt aus dem
Inventar, und der Effekt wird auf das Werkzeug geschrieben.

### Drei Effekte, je drei Stufen

| Effekt | Wirkung | Skaliert über die Stufen |
|---|---|---|
| Autoschmelze | abgebaute Erze droppen geschmolzen | I: nur Cinerit · II: alle Erze · III: alle Erze + Bonusausbeute |
| Erzsicht | Partikel über Erzblöcken in der Nähe | Radius und Intervall — Zahlen erst in Schritt 6, nach der Rechnung |
| Schockwelle | Rückstoß bei Nahkampftreffern | Stärke des Rückstoßes |

### Kosten

| Stufe | Barren | Glutkerne |
|---|---|---|
| I | 4 | — |
| II | 8 | 1 |
| III | 16 | 3 |

Vorschlagswerte. Die eigentliche Zahl entscheidet sich beim Spielen; wichtiger
ist, dass sie an **einer** Stelle als Tabelle im Code steht und nicht über drei
Funktionen verteilt.

### Wie die Infusion gespeichert wird

**Nicht in der Lore.** Lore ist Anzeige — sie lässt sich in einem Amboss
umbenennen, sie ist übersetzt, und sie an mehreren Stellen zu parsen ist der
sichere Weg in ein unwartbares System.

Gespeichert wird in einer **dynamischen Eigenschaft am ItemStack**. Lesen und
Schreiben passieren in genau zwei Funktionen. Wenn Mojang die API ändert, ist
das genau eine Stelle zum Anfassen. Die Lore wird zusätzlich gesetzt, aber nur
als Anzeige, und immer aus der Eigenschaft abgeleitet — nie umgekehrt.

Das gespeicherte Objekt trägt eine eigene Formatversion mit. Ein Werkzeug aus
einer älteren Addon-Version darf nicht kaputtgehen, wenn wir das Format später
erweitern; ohne Versionsfeld merkt man das erst, wenn jemand eine alte Welt
öffnet.

## Regeln, die für den ganzen Code gelten

1. Keine erfundenen API-Methoden. Bei Unsicherheit wird nachgeschlagen oder
   nachgefragt, nicht geraten. Wo es zwischen Versionen mehrere Schreibweisen
   gibt (`selectedSlotIndex` gegen `selectedSlot`, die Signatur von
   `applyKnockback`), werden beide abgefangen.
2. ItemStacks sind Kopien. Nach jeder Änderung mit `container.setItem()`
   zurückschreiben.
3. In `beforeEvents` wird die Welt nicht verändert. Alles Verändernde gehört in
   `system.run()`.
4. Performance ist Teil der Aufgabe. Die Erzsicht scannt nicht jeden Tick.
   Intervall und Radius werden bewusst gewählt, und die Zahl der Blockabfragen
   pro Spieler und Durchlauf steht als Rechnung im Kommentar.
5. Kommentare auf Deutsch und begründend: warum diese Lösung und nicht die
   naheliegende.

## Ausdrücklich nicht in Version 1

Rüstung, eigenes Mob-Modell, Strukturen, zweite Dimension, Boss.

## Reihenfolge

| Schritt | Inhalt | Stand |
|---|---|---|
| 1 | Manifeste, Ordnerstruktur, Lebenszeichen-Skript | fertig, wartet auf Test |
| 2 | Erz, Rohitem, Barren, Glutkern, Loot Tables, Ofenrezept, Weltgenerierung | offen |
| 3 | Deko-Blöcke und Werkzeuge mit Rezepten | offen |
| 4 | Mob mit Spawn-Regeln | offen |
| 5 | Altar-Block und Menü, noch ohne Effekte | offen |
| 6 | Die drei Effekte, einzeln nacheinander | offen |
| 7 | Sprachdateien und Aufräumen | offen |

## Offene Punkte

- Welche Vanilla-Geometrie bekommt der Aschewandler? (Schritt 4)
- Radius und Intervall der Erzsicht je Stufe. (Schritt 6)
- Wie kommen die Dateien auf das iPad — Dateien-App oder `.mcaddon`-Import?
