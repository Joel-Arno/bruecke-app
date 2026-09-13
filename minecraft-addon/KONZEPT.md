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

**Aus Cinerit werden keine Werkzeuge geschmiedet.** Cinerit wertet Werkzeuge
auf, die der Spieler schon hat. Ein infundiertes Werkzeug bekommt einen Effekt
*und* ein sichtbar verändertes Aussehen — Glutadern, die sich mit jeder Stufe
weiter durchfressen.

Gebaut wird aus Cinerit alles andere: der Altar, Vollblock, Ziegel, Lampe.

Drei Stufen, aber nicht als Werkzeugleiter. Die Stufen sitzen in der **Tiefe**
des Erzes und in der **Infusion**:

    tiefer graben  ->  seltenere Erzgüte  ->  Glutkerne
                                                |
                                                v
    Barren + Glutkerne  ->  höhere Infusionsstufe  ->  besseres Werkzeug

Der Satz, mit dem sich das Addon in fünfzehn Sekunden erklären lässt: Die
Belohnung fürs Tiefergehen ist kein neues Schwert, sondern eine stärkere
Infusion auf dem Schwert, das man schon liebt.

## Erz und Weltgenerierung

Drei Erzblöcke. Die Stein-/Tiefenschiefer-Unterscheidung ist nicht kosmetisch,
sondern trägt Information: Woraus der Block besteht, verrät, was er abwirft.

| ID | Wirtsgestein | y-Bereich | Drop |
|---|---|---|---|
| `ja:cinerit_ore` | Stein | 16 bis −8 | 1× Roh-Cinerit |
| `ja:deepslate_cinerit_ore` | Tiefenschiefer | −8 bis −45 | 1–2× Roh-Cinerit |
| `ja:ember_cinerit_ore` | Tiefenschiefer | −45 bis −59, selten | 2–3× Roh-Cinerit + 25 % Glutkern |

Glutkerne gibt es sonst nirgends — außer selten vom Mob.

## Items

| ID | Zweck |
|---|---|
| `ja:raw_cinerit` | Erzdrop, wird im Ofen zum Barren |
| `ja:cinerit_ingot` | Infusionswährung **und** Baumaterial |
| `ja:ember_core` | Glutkern — nur für Infusionsstufe II und III |

Der Barren hat genau zwei Aufgaben. Werkzeuge gehören ausdrücklich nicht dazu.

## Blöcke

| ID | Zweck |
|---|---|
| `ja:cinerit_block` | Vollblock, Lagerung |
| `ja:cinerit_bricks` | Ziegel, Deko |
| `ja:cinerit_lamp` | Lampe mit Lichtabgabe |
| `ja:infusion_altar` | Kernstück, öffnet bei Interaktion das Menü |

## Mob

`ja:ash_walker` (Aschewandler). Feindlich, spawnt tief unter Tage, droppt
Roh-Cinerit und selten einen Glutkern. Kein eigenes Modell — vorhandene
Vanilla-Geometrie mit eigener Textur. Welche, entscheiden wir später.

## Der Infusions-Altar

Bedrock erlaubt keine eigenen Verzauberungen. Wir bauen sie per Script nach:
Der Spieler hält ein Werkzeug in der Hand, interagiert mit dem Altar, wählt im
Menü (`@minecraft/server-ui`) einen Effekt und eine Stufe, zahlt aus dem
Inventar, und das Werkzeug wird ausgetauscht.

### Warum ausgetauscht und nicht verändert

**In Bedrock hängt die Item-Textur an der Item-ID, nicht am einzelnen Item.**
Item-Identifier, `minecraft:icon`, Kurzname in `item_texture.json` und PNG-Pfad
müssen übereinstimmen, und das steht beim Beitritt des Clients fest. Anders als
in Java kann kein Script einem einzelnen ItemStack ein anderes Aussehen geben.

Wer eine sichtbare Veränderung will, muss also ein anderes Item ausliefern.
Genau das tut der Altar: Er tauscht die vanilla Diamantspitzhacke gegen
`ja:infused_diamond_pickaxe_1` und überträgt dabei Haltbarkeit, Verzauberungen
und einen selbstvergebenen Namen.

### Umfang der infundierbaren Werkzeuge

Diamant und Netherit, alle fünf Werkzeugtypen, drei Stufen.

| | Schwert | Spitzhacke | Axt | Schaufel | Hacke |
|---|---|---|---|---|---|
| **Diamant** | I II III | I II III | I II III | I II III | I II III |
| **Netherit** | I II III | I II III | I II III | I II III | I II III |

**30 eigene Items, 30 Texturen à 16 × 16.** Der größte Einzelposten des
Projekts. Code und JSON können vollständig existieren, während die Texturen
tool-weise nachgereicht werden; fehlende zeigt Minecraft als Karomuster an,
ohne dass etwas kaputtgeht.

Werkzeuge unter Diamantstufe lassen sich nicht infundieren. Das ist keine
Sparmaßnahme: Cinerit liegt ab y −45, wer dort gräbt, hat längst Diamant. Der
Altar ist eine Endgame-Station, passend zu 16 Barren und 3 Glutkernen für
Stufe III.

### Die Effekte

Acht Effekte, aber nur vier Mechaniken — Adernschlag, Kahlschlag, Aushub und
Glutacker sind derselbe Code mit anderen Filtern und anderen Obergrenzen.

| Werkzeug | Effekt | Mechanik | I → II → III |
|---|---|---|---|
| Spitzhacke | Autoschmelze | Drops ersetzen | nur Cinerit → alle Erze → + 25 % Bonus |
| Spitzhacke | Erzsicht | Wahrnehmung | Radius und Intervall, Zahlen nach der Rechnung |
| Spitzhacke | Adernschlag | Ausbreitung | 8 → 24 → 64 Blöcke |
| Schwert | Schockwelle | Kampf | Wucht des Rückstoßes |
| Schwert | Brandmal | Kampf | 2 → 4 → 6 Sekunden Brand |
| Axt | Kahlschlag | Ausbreitung | 16 → 48 → 128 Stämme |
| Schaufel | Aushub | Ausbreitung | 3×1 → 3×3 → 3×3×2 |
| Hacke | Glutacker | Ausbreitung | 3×3 → 5×5 → 7×7, pflügen und säen |

Ausbreitungseffekte verbrauchen Haltbarkeit **pro gebrochenem Block**. Ohne das
wäre Kahlschlag III ein Freifahrtschein.

Ein Werkzeug trägt genau **einen** Effekt. Ein anderer Effekt überschreibt den
alten und kostet den vollen Preis.

### Kosten

| Stufe | Barren | Glutkerne |
|---|---|---|
| I | 4 | — |
| II | 8 | 1 |
| III | 16 | 3 |

**Infusion lösen:** 4 Barren Gebühr. Das Vanilla-Werkzeug kommt mit
Haltbarkeit, Verzauberungen und Namen zurück; die investierten Barren und
Glutkerne sind weg.

Alles Vorschlagswerte. Wichtig ist nicht die Zahl, sondern dass sie an **einer**
Stelle als Tabelle im Code steht.

### Wie die Infusion gespeichert wird

**Nicht in der Lore.** Lore ist Anzeige — umbenennbar, übersetzt, und an
mehreren Stellen zu parsen ist der sichere Weg in ein unwartbares System.

**Auch nicht in der Item-ID.** Die ID zeigt zwar die Stufe, aber wenn Stufe und
Effekt aus der ID gelesen würden, stünde dieselbe Information an zwei Orten —
und genau dort entstehen Bugs, bei denen ein Werkzeug wie Stufe III aussieht
und wie Stufe I wirkt.

Gespeichert wird in einer **dynamischen Eigenschaft am ItemStack**. Lesen und
Schreiben passieren in genau zwei Funktionen. Item-ID und Lore werden daraus
*abgeleitet*, nie umgekehrt. Ändert Mojang die API, gibt es genau eine Stelle
zum Anfassen.

Das gespeicherte Objekt trägt eine eigene Formatversion. Ein Werkzeug aus einer
älteren Addon-Version darf nicht kaputtgehen, wenn wir das Format erweitern;
ohne Versionsfeld merkt man das erst, wenn jemand eine alte Welt öffnet.

### Plan B, falls der Spike scheitert

Sollte sich zeigen, dass ein eigenes Item das Vanilla-Werkzeugverhalten nicht
verlässlich nachbaut, bleiben die Effekte trotzdem. Das Werkzeug behält dann
sein vanilla Aussehen und zeigt seine Infusion über Namensfarbe, Lore und
Partikel beim Benutzen. Kein Designwechsel, aber null Risiko am Spielgefühl.
Dieser Weg steht hier, damit wir im Ernstfall nicht improvisieren müssen.

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
   pro Spieler und Durchlauf steht als Rechnung im Kommentar. Für
   Ausbreitungseffekte gilt dasselbe: harte Obergrenze, nachvollziehbar
   begründet.
5. Kommentare auf Deutsch und begründend: warum diese Lösung und nicht die
   naheliegende.
6. Texturen sind eigene Kunst im Vanilla-Stil, keine übermalten
   Mojang-Texturen. Für ein Bewerbungsstück ist das der Unterschied zwischen
   „kann pixeln" und „hat kopiert".

## Ausdrücklich nicht in Version 1

Rüstung, eigenes Mob-Modell, Strukturen, zweite Dimension, Boss.
Werkzeuge unter Diamantstufe.

## Reihenfolge

| Schritt | Inhalt | Stand |
|---|---|---|
| 1 | Manifeste, Ordnerstruktur, Lebenszeichen-Skript | gebaut, Test steht aus |
| 2 | **Spike:** zwei Testitems, Beweis für den Austauschweg | offen |
| 3 | Erz, Rohitem, Barren, Glutkern, Loot Tables, Ofenrezept, Weltgenerierung | offen |
| 4 | Deko-Blöcke mit Rezepten | offen |
| 5 | Mob mit Spawn-Regeln | offen |
| 6 | Altar-Block und Menü, noch ohne Effekte | offen |
| 7 | Die 30 infundierten Items und die Umwandlungslogik | offen |
| 8 | Die Effekte, familienweise | offen |
| 9 | Sprachdateien und Aufräumen | offen |

## Der Spike (Schritt 2)

Zwei Items, `ja:infused_diamond_pickaxe_1` und `ja:infused_netherite_pickaxe_1`,
per `/give` ins Inventar. Beantwortet die Fragen, an denen das ganze Konzept
hängt:

1. Erscheint das Item mit eigener Textur?
2. Baut es Obsidian ab — gilt es also als diamantstufig?
3. Droppt Diamanterz einen Diamanten, statt nur zu zerbrechen?
4. Nimmt es Verzauberungen an, im Tisch und im Amboss?
5. Lässt es sich im Amboss reparieren?
6. Sinkt die Haltbarkeit beim Abbauen?
7. Überlebt das Netherit-Item Lava, wie ein echtes Netherit-Werkzeug?
8. Überträgt das Script Haltbarkeit, Verzauberungen und Namen beim Austausch?

Fällt einer dieser Punkte durch, ist das kein Beinbruch, sondern genau der
Grund, warum der Spike vor den 30 Items steht.

## Offene Punkte

- Welche Vanilla-Geometrie bekommt der Aschewandler?
- Radius und Intervall der Erzsicht je Stufe.
- Ob Bedrock für eigene Items überhaupt Feuerfestigkeit anbietet (Netherit).
- Wie kommen die Dateien auf das iPad — Dateien-App oder `.mcaddon`-Import?
