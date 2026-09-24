# Mac-Fernbedienung

Steuere deinen Mac vom Handy aus, per Browser und ohne App-Store-App.
Auf dem Mac läuft ein kleiner Server (nur Python, das macOS schon mitbringt).
Das Handy öffnet dessen Seite im selben WLAN.

## Was geht

| Bereich | Funktionen |
|---|---|
| **Maus** | Handy als Trackpad: bewegen, Tippen = Klick, 2-Finger-Tipp = Rechtsklick, 2-Finger-Scrollen, Scroll-Leiste, Doppelklick, „Halten“ zum Ziehen |
| **Tasten** | Präsentation/Video (◀ ▶, Leertaste, Vollbild), direkt tippen, längeren Text senden (auch Diktat), Sondertasten (Esc, Tab, Pfeile, Pos1, F-Tasten …), ⌘ ⇧ ⌥ ⌃ + Buchstabe, fertige Kurzbefehle (Kopieren, Einfügen, Rückgängig, Spotlight, App wechseln …) |
| **Medien** | Play/Pause, Weiter, Zurück (Spotify, Apple Music, YouTube im Browser …), „Läuft gerade“-Anzeige, Lautstärke-Regler, Stumm, Bildschirmhelligkeit |
| **Apps** | laufende Apps nach vorn holen oder beenden, installierte Apps suchen und starten, Webseite öffnen |
| **Monitor** | Bildschirmfoto des Macs, Live-Ansicht alle 2 s, Tippen aufs Bild = Klick an dieser Stelle |
| **System** | Bildschirm aus, Sperren, Ruhezustand, Bildschirmschoner, Wach halten, Hell/Dunkel, Mission Control, Schreibtisch, Zwischenablage hin und her, Text vorlesen lassen, Mitteilung anzeigen, Neustart/Ausschalten/Abmelden (mit Rückfrage) |

## Einrichten (einmalig, ca. 5 Minuten)

### 1. Dateien auf den Mac holen

Im Terminal (Programme → Dienstprogramme → Terminal):

```bash
git clone -b claude/sweet-volta-u9cts3 https://github.com/joel-arno/bruecke-app.git
cd bruecke-app/mac-remote
```

Sobald der Branch in `main` gemergt ist, kannst du `-b claude/sweet-volta-u9cts3` weglassen.

Fragt der Mac beim ersten `git`- oder `python3`-Befehl, ob er die „Befehlszeilen-Entwicklerwerkzeuge“
installieren soll: **Installieren** klicken, abwarten, Befehl wiederholen.

### 2. Server starten

```bash
python3 server.py
```

Alternativ im Finder auf **`start.command`** doppelklicken. Kommt eine Warnung „nicht verifizierter
Entwickler“, dann Rechtsklick → **Öffnen** → **Öffnen**.

Am Mac öffnet sich automatisch eine Seite mit einem **QR-Code**.

### 3. Freigaben erteilen

macOS fragt nach Freigaben für **Terminal**. Alle drei findest du unter
**Systemeinstellungen → Datenschutz & Sicherheit**:

| Freigabe | wofür | wann |
|---|---|---|
| **Bedienungshilfen** → Terminal einschalten | Maus, Tastatur, Medientasten, Sperren | sofort beim Start |
| **Automation** → Terminal → System Events | Kurzbefehle mit Z/Y, Hell/Dunkel, Neustart/Ausschalten | beim ersten Benutzen |
| **Bildschirmaufnahme** → Terminal | Monitor-Tab | beim ersten Bildschirmfoto |

Nach dem Einschalten von *Bedienungshilfen* den Server einmal neu starten
(im Terminal `Ctrl+C`, dann wieder `python3 server.py`).

### 4. Handy verbinden

1. Handy ins **selbe WLAN** wie den Mac.
2. Den QR-Code vom Mac mit der Handy-Kamera scannen und öffnen.
3. **Zum Home-Bildschirm hinzufügen** (iPhone: Teilen-Symbol → „Zum Home-Bildschirm“),
   dann startet sie wie eine App im Vollbild.

Der QR-Code lässt sich jederzeit am Mac unter <http://localhost:8765/pair> wieder aufrufen.

## Automatisch starten

**Systemeinstellungen → Allgemein → Anmeldeobjekte → „+“** und `start.command` auswählen.
Dann läuft der Server nach jedem Login im Terminal, mit denselben Freigaben.

## Sicherheit

- Nur wer den **Schlüssel** kennt (steckt im QR-Code/Link), kann den Mac steuern.
  Die Seite mit dem QR-Code lässt sich nur am Mac selbst öffnen.
- Der Schlüssel liegt in `~/.mac-remote/token`. Neuen Schlüssel erzeugen (alte Links funktionieren
  dann nicht mehr): `python3 server.py --new-token`
- Die Verbindung ist im WLAN unverschlüsselt (HTTP). Zu Hause ist das in Ordnung, in fremden oder
  öffentlichen WLANs den Server besser nicht laufen lassen.
- **Keine Portweiterleitung im Router einrichten.** Für den Zugriff von unterwegs
  [Tailscale](https://tailscale.com) auf Mac und Handy installieren und die Tailscale-Adresse des Macs
  verwenden.

## Probleme?

| Problem | Lösung |
|---|---|
| Handy lädt die Seite nicht | selbes WLAN? Server läuft? Mac-Firewall: eingehende Verbindungen für Python erlauben. Statt der IP die `.local`-Adresse versuchen. |
| Maus/Tastatur reagieren nicht | Freigabe *Bedienungshilfen* für Terminal prüfen, Server neu starten. Steht Terminal schon drin, einmal aus- und wieder einschalten. |
| Bildschirmfoto zeigt nur den Hintergrund | Freigabe *Bildschirmaufnahme* für Terminal einschalten, Terminal neu starten. |
| Play/Pause reagiert nicht | Einmal am Mac etwas abspielen. Die Taste steuert, was zuletzt lief. |
| Port belegt | `python3 server.py --port 8766` |

## Optionen

```
python3 server.py --port 8765      anderer Port
python3 server.py --new-token      neuen Schlüssel erzeugen
python3 server.py --no-browser     QR-Seite nicht automatisch öffnen
```

## Technik

- `server.py`: HTTP-Server, nur Python-Standardbibliothek. Maus, Tastatur und Medientasten laufen
  direkt über CoreGraphics (per `ctypes`), der Rest über `osascript`, `pmset`, `open`,
  `screencapture`, `pbcopy`/`pbpaste` und `say`.
- `static/index.html`: die Handy-Oberfläche, eine einzelne Datei ohne externe Abhängigkeiten.
