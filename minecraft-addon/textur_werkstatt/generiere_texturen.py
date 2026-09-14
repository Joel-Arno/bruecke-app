#!/usr/bin/env python3
"""
Cinerit — Textur-Werkstatt

Erzeugt die 30 Item-Texturen der infundierten Werkzeuge und die passende
item_texture.json.

Warum ein Skript und keine 30 gemalten Dateien:

Eine Diamantspitzhacke und eine Netheritspitzhacke haben dieselbe Silhouette,
nur eine andere Kopffarbe. Und die Glutadern sitzen an denselben Stellen,
unabhaengig vom Material. Von den 30 Dateien sind also nur fuenf echte
Zeichnungen — der Rest ist dieselbe Form in anderer Farbe mit mehr oder
weniger Glut.

Wer das von Hand macht, pflegt 30 Dateien und vergisst beim sechsten
Farbwechsel die Haelfte. Hier aenderst du eine Zeile und alle 30 Dateien
stimmen wieder.

Absichtlich ohne Bibliotheken. Das Skript schreibt PNG selbst, damit es
ueberall laeuft, wo Python laeuft — auch in einer Python-App auf dem iPad,
wo "pip install" keine Option ist.

Aufruf:  python3 generiere_texturen.py
"""

import struct
import zlib
from pathlib import Path

# ---------------------------------------------------------------------------
# Farben
# ---------------------------------------------------------------------------
# Drei Werte pro Material reichen. Mehr Zwischentoene sehen auf 16x16 nicht
# feiner aus, sondern matschig — besonders auf einem Handydisplay in einer
# dunklen Hoehle, wo dieses Item die meiste Zeit verbringt.

MATERIALIEN = {
    "diamond": {
        "l": (0x8F, 0xF7, 0xEC),   # Glanzkante
        "m": (0x3F, 0xD7, 0xC4),   # Grundton
        "d": (0x1F, 0x8E, 0x82),   # Schatten und Aussenkante
    },
    "netherite": {
        "l": (0x6B, 0x5B, 0x59),
        "m": (0x44, 0x38, 0x39),
        "d": (0x24, 0x1C, 0x1E),
    },
}

# Der Griff ist bei beiden Materialien derselbe — in Vanilla ist es immer
# derselbe Stock, und genau daran erkennt der Spieler die Werkzeugform wieder.
GRIFF = {
    "s": (0x9A, 0x6B, 0x3C),
    "t": (0x6A, 0x47, 0x26),
}

# Glut. Die Farbe haengt nicht nur von der Infusionsstufe ab, sondern auch
# davon, wie nah eine Ader am Kern liegt: Bei Stufe III gluehen die inneren
# Adern gelb, waehrend die aeusseren gerade erst anspringen. Dadurch sieht
# Stufe III nicht nach "mehr orange Pixel" aus, sondern nach Hitze, die sich
# von innen nach aussen frisst.
#
# Lesart: GLUT[stufe][ring] — ring 1 ist der Kern, 3 der aeusserste.
GLUT = {
    1: {1: (0xC2, 0x44, 0x0F)},
    2: {1: (0xF2, 0x76, 0x1B), 2: (0xC2, 0x44, 0x0F)},
    3: {1: (0xFF, 0xD3, 0x4D), 2: (0xFF, 0x8A, 0x1E), 3: (0xC2, 0x44, 0x0F)},
}

# ---------------------------------------------------------------------------
# Die Werkzeugformen
# ---------------------------------------------------------------------------
# 16 Zeilen zu 16 Zeichen. Das ist die Stelle, an der du zeichnest: Zeichen
# tauschen, Skript laufen lassen, im Spiel anschauen.
#
#   .  durchsichtig      l  Material hell      s  Griff hell
#                        m  Material mittel    t  Griff dunkel
#                        d  Material dunkel

FORMEN = {
    # Spitzhacke: breiter Bogen oben, die Enden haengen nach unten. Der Bogen
    # muss durchgehend sein — mit Luecke in der Mitte liest sich der Kopf als
    # Geweih statt als Werkzeug.
    "pickaxe": [
        "................",
        "...dddddddddd...",
        "..dllmmmmmmlld..",
        "..dd.dmmmmd.dd..",
        "......dmmd......",
        ".......dst......",
        ".......sst......",
        "......sst.......",
        ".....sst........",
        "....sst.........",
        "...sst..........",
        "..sst...........",
        "..st............",
        "..t.............",
        "................",
        "................",
    ],
    "sword": [
        "............dddd",
        "...........dllld",
        "..........dlmmd.",
        ".........dlmmd..",
        "........dlmmd...",
        ".......dlmmd....",
        "......dlmmd.....",
        ".....dlmmd......",
        "....dlmmd.......",
        "...dlmmd........",
        "..dddmd.........",
        ".ddtdd..........",
        "..ttt...........",
        ".tt.............",
        "tt..............",
        "t...............",
    ],
    # Axt: die linke Kante laeuft treppenfoermig nach aussen. Diese Treppe ist
    # die Schneide — ohne sie ist der Kopf nur ein Klumpen und von der
    # Spitzhacke kaum zu unterscheiden.
    "axe": [
        "................",
        "......ddddd.....",
        ".....dllmmmd....",
        "....dlmmmmmd....",
        "....dlmmmmd.....",
        "....dlmmmd......",
        ".....dmmd.......",
        "......dst.......",
        ".....sst........",
        "....sst.........",
        "...sst..........",
        "..sst...........",
        "..st............",
        "..t.............",
        "................",
        "................",
    ],
    "shovel": [
        "................",
        "........dddd....",
        ".......dlmmd....",
        ".......dlmmd....",
        ".......dlmmd....",
        "........dmd.....",
        "........dst.....",
        ".......sst......",
        "......sst.......",
        ".....sst........",
        "....sst.........",
        "...sst..........",
        "..sst...........",
        "..st............",
        "..t.............",
        "................",
    ],
    "hoe": [
        "................",
        ".....dddddd.....",
        ".....dllmmd.....",
        ".....dd..dmd....",
        ".........dmd....",
        ".........dd.....",
        ".........st.....",
        "........sst.....",
        ".......sst......",
        "......sst.......",
        ".....sst........",
        "....sst.........",
        "...sst..........",
        "..sst...........",
        "..st............",
        "..t.............",
    ],
}

# ---------------------------------------------------------------------------
# Die Glutadern
# ---------------------------------------------------------------------------
# Pro Werkzeug drei Ringe. Ring 1 leuchtet ab Stufe I, Ring 2 ab Stufe II,
# Ring 3 ab Stufe III. Angabe als (zeile, spalte).
#
# Der Kern sitzt immer dort, wo Kopf und Griff zusammentreffen — die Glut
# kommt aus der Fassung, nicht von der Schneide. Ring 3 laeuft in den Griff
# hinein, damit Stufe III das Werkzeug als Ganzes ergreift und nicht nur den
# Kopf heller macht.

ADERN = {
    "pickaxe": {
        1: [(3, 7), (3, 8), (4, 7), (4, 8)],
        2: [(2, 5), (2, 10), (3, 6), (3, 9)],
        3: [(1, 4), (1, 11), (2, 3), (2, 12), (3, 2), (3, 13),
            (6, 7), (8, 5), (10, 3), (12, 2)],
    },
    "sword": {
        1: [(6, 8), (7, 7), (8, 6)],
        2: [(4, 10), (5, 9), (9, 5), (10, 4)],
        3: [(2, 12), (3, 11), (11, 3), (12, 3), (13, 1)],
    },
    "axe": {
        1: [(5, 7), (6, 6), (6, 7)],
        2: [(3, 7), (4, 7), (4, 8)],
        3: [(1, 8), (2, 8), (3, 10), (8, 6), (10, 4), (12, 2)],
    },
    "shovel": {
        1: [(3, 9), (3, 10)],
        2: [(2, 9), (2, 10), (4, 9)],
        3: [(1, 9), (1, 10), (4, 10), (5, 9),
            (7, 8), (9, 6), (11, 4), (13, 2)],
    },
    "hoe": {
        1: [(2, 9), (3, 10)],
        2: [(2, 7), (2, 8), (4, 10)],
        3: [(1, 6), (1, 9), (2, 6), (5, 9), (7, 8), (9, 6), (11, 4)],
    },
}

# ---------------------------------------------------------------------------
# Pruefungen
# ---------------------------------------------------------------------------
# Diese Pruefungen sind kein Zierrat. Beim Zeichnen im Texteditor verrutscht
# eine Zeile um ein Zeichen, ohne dass man es sieht — und eine Ader, die auf
# einem durchsichtigen Pixel landet, erzeugt einen frei schwebenden Glutpunkt
# neben dem Werkzeug. Beides faellt hier sofort auf, statt erst im Spiel.

def pruefe_formen():
    for name, zeilen in FORMEN.items():
        assert len(zeilen) == 16, f"{name}: {len(zeilen)} Zeilen statt 16"
        for i, z in enumerate(zeilen):
            assert len(z) == 16, f"{name}, Zeile {i}: {len(z)} Zeichen statt 16"
            for c in z:
                assert c in ".lmdst", f"{name}, Zeile {i}: unbekanntes Zeichen {c!r}"

    for name, ringe in ADERN.items():
        form = FORMEN[name]
        for ring, punkte in ringe.items():
            for (y, x) in punkte:
                assert 0 <= y < 16 and 0 <= x < 16, f"{name} Ring {ring}: ({y},{x}) ausserhalb"
                assert form[y][x] != ".", (
                    f"{name} Ring {ring}: Ader auf ({y},{x}) liegt im Leeren — "
                    f"sie wuerde als Punkt neben dem Werkzeug schweben"
                )


# ---------------------------------------------------------------------------
# PNG schreiben
# ---------------------------------------------------------------------------
# Ein PNG ist eine Signatur plus eine Folge von Chunks. Wir brauchen drei:
# IHDR (Groesse und Format), IDAT (die zusammengedrueckten Bilddaten) und
# IEND. Farbtyp 6 heisst RGBA, 8 Bit je Kanal.
#
# Wichtig fuer Minecraft: echte Transparenz, und keine Zwischentoene an den
# Kanten. Wir setzen jedes Pixel entweder voll deckend oder voll durchsichtig,
# damit nichts weichgezeichnet aussieht.

def png_bytes(pixel, breite, hoehe):
    def chunk(typ, daten):
        roh = typ + daten
        return (struct.pack(">I", len(daten)) + roh
                + struct.pack(">I", zlib.crc32(roh) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", breite, hoehe, 8, 6, 0, 0, 0)

    # Jede Bildzeile bekommt ein Filter-Byte vorangestellt. 0 heisst
    # "kein Filter" — bei 16x16 lohnt sich kein schlaueres Verfahren.
    roh = bytearray()
    for y in range(hoehe):
        roh.append(0)
        for x in range(breite):
            roh.extend(pixel[y][x])

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(bytes(roh), 9))
            + chunk(b"IEND", b""))


DURCHSICHTIG = (0, 0, 0, 0)


def zeichne(werkzeug, material, stufe):
    """Baut ein 16x16-Pixelfeld: Form, dann Material, dann Glut darueber."""
    palette = dict(MATERIALIEN[material])
    palette.update(GRIFF)

    feld = [[DURCHSICHTIG] * 16 for _ in range(16)]
    for y, zeile in enumerate(FORMEN[werkzeug]):
        for x, zeichen in enumerate(zeile):
            if zeichen != ".":
                r, g, b = palette[zeichen]
                feld[y][x] = (r, g, b, 255)

    # Glut zuletzt, damit sie das Material ueberschreibt statt sich damit zu
    # mischen. Mischen wuerde halbtransparente Zwischentoene erzeugen, und die
    # sehen in Pixelgrafik nach Unfall aus.
    for ring, punkte in ADERN[werkzeug].items():
        if ring > stufe:
            continue
        r, g, b = GLUT[stufe][ring]
        for (y, x) in punkte:
            feld[y][x] = (r, g, b, 255)

    return feld


# ---------------------------------------------------------------------------
# Ausgabe
# ---------------------------------------------------------------------------

HIER = Path(__file__).resolve().parent
RP = HIER.parent / "cinerit_RP"
ZIEL = RP / "textures" / "items"

WERKZEUGE = ["sword", "pickaxe", "axe", "shovel", "hoe"]
STUFEN = [1, 2, 3]


def main():
    pruefe_formen()
    ZIEL.mkdir(parents=True, exist_ok=True)

    kurznamen = []
    for material in MATERIALIEN:
        for werkzeug in WERKZEUGE:
            for stufe in STUFEN:
                name = f"infused_{material}_{werkzeug}_{stufe}"
                feld = zeichne(werkzeug, material, stufe)
                (ZIEL / f"{name}.png").write_bytes(png_bytes(feld, 16, 16))
                kurznamen.append(name)

    # item_texture.json gleich mit erzeugen. Der Kurzname muss auf das Zeichen
    # genau zum minecraft:icon des Items passen; wenn beide aus derselben
    # Schleife stammen, kann es keinen Tippfehler geben.
    eintraege = ",\n".join(
        f'    "{n}": {{ "textures": "textures/items/{n}" }}' for n in kurznamen
    )
    (RP / "textures" / "item_texture.json").write_text(
        '{\n'
        '  "resource_pack_name": "cinerit",\n'
        '  "texture_name": "atlas.items",\n'
        '  "texture_data": {\n'
        f'{eintraege}\n'
        '  }\n'
        '}\n',
        encoding="utf-8",
    )

    print(f"{len(kurznamen)} Texturen nach {ZIEL}")
    print(f"item_texture.json mit {len(kurznamen)} Kurznamen")


def vorschau(pfad, zoom=14, rand=2):
    """Kontaktbogen zum Draufschauen. Gehoert nicht ins Resource Pack."""
    spalten = [(m, s) for m in MATERIALIEN for s in STUFEN]
    breite = len(spalten) * (16 * zoom + rand) + rand
    hoehe = len(WERKZEUGE) * (16 * zoom + rand) + rand
    grund = (26, 24, 28, 255)
    bild = [[grund] * breite for _ in range(hoehe)]

    for zi, werkzeug in enumerate(WERKZEUGE):
        for si, (material, stufe) in enumerate(spalten):
            feld = zeichne(werkzeug, material, stufe)
            oy = rand + zi * (16 * zoom + rand)
            ox = rand + si * (16 * zoom + rand)
            for y in range(16):
                for x in range(16):
                    p = feld[y][x]
                    if p[3] == 0:
                        continue
                    for dy in range(zoom):
                        for dx in range(zoom):
                            bild[oy + y * zoom + dy][ox + x * zoom + dx] = p

    Path(pfad).write_bytes(png_bytes(bild, breite, hoehe))


if __name__ == "__main__":
    main()
    import sys
    if "--vorschau" in sys.argv:
        ziel = sys.argv[sys.argv.index("--vorschau") + 1]
        vorschau(ziel)
        print(f"Vorschau nach {ziel}")
