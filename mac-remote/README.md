# Mac-Fernbedienung

Steuere deinen Mac vom Handy oder iPad aus, per Browser und ohne App-Store-App.
Auf dem Mac läuft ein kleiner Server (nur Python, das macOS schon mitbringt).
Das Handy öffnet dessen Seite im selben WLAN.

## Was geht

| Bereich | Funktionen |
|---|---|
| **Maus** | Handy/iPad als Trackpad (flüssig über eine dauerhafte WebSocket-Verbindung): bewegen, Tippen = Klick, 2-Finger-Tipp = Rechtsklick, 2-Finger-Scrollen, Scroll-Leiste, Doppelklick, „Halten“ zum Ziehen. Dazu **Zeigen**: das Handy wie einen Laserpointer schwenken |
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

### 4. Handy oder iPad verbinden

1. Handy/iPad ins **selbe WLAN** wie den Mac.
2. Den QR-Code vom Mac mit der Handy-Kamera scannen und öffnen.
3. **Zum Home-Bildschirm hinzufügen** (iPhone/iPad: Teilen-Symbol → „Zum Home-Bildschirm“),
   dann startet sie wie eine App im Vollbild.

Auf dem **iPad** (und am Handy im Querformat) ist das Trackpad immer links zu sehen, rechts liegen
Tasten, Medien, Apps und System. Der Monitor-Tab nutzt die ganze Breite.

Der QR-Code lässt sich jederzeit am Mac unter <http://localhost:8765/pair> wieder aufrufen.

## Duo-Betrieb: iPhone als Maus, iPad als Tastatur

Beide Geräte können gleichzeitig verbunden sein. Oben rechts auf den Modus-Knopf (**Alles ▾**) tippen:

| Gerät | Modus | was du siehst |
|---|---|---|
| iPhone | **Nur Maus** | der ganze Bildschirm ist Trackpad bzw. Zeiger |
| iPad | **Nur Tastatur** | großes Eingabefeld (einmal antippen, die Bildschirmtastatur bleibt offen), Sondertasten, ⌘ ⇧ ⌥ ⌃, Kurzbefehle |

Jedes Gerät merkt sich seinen Modus. Mit einer angesteckten iPad-Tastatur gehen auch Pfeiltasten,
Esc, Tab und Kurzbefehle wie ⌘C/⌘V direkt (⌘Tab und ⌘Leertaste fängt das iPad selbst ab, dafür gibt
es die Knöpfe).

## Zeigen: Handy schwenken statt wischen

Im Maus-Bereich oben **Zeigen (Handy schwenken)** wählen. Dann gilt:

- **Finger auf die Fläche legen und Handy schwenken:** links/rechts drehen bewegt den Zeiger seitwärts,
  nach oben/unten kippen bewegt ihn hoch/runter. Das Handy wird dabei wie eine Fernbedienung auf den
  Bildschirm gerichtet.
- **Finger weg:** Der Zeiger bleibt stehen. So kannst du umgreifen, wie beim Anheben einer Maus.
- **Kurz tippen:** Klick. **Zwei Finger:** scrollen.
- Tempo und Richtung stellst du unter System → Einstellungen ein.

Das Handy wie eine echte Maus über den Tisch zu schieben, funktioniert leider nicht: Handys haben
unten keinen optischen Sensor, und aus dem Beschleunigungssensor lässt sich die Position nicht
genau genug berechnen (der Zeiger würde nach Sekunden wegdriften).

### Einmalige Einrichtung (HTTPS)

iPhone und iPad geben die Bewegungssensoren nur über eine verschlüsselte Verbindung frei. Der Server
startet deshalb zusätzlich eine HTTPS-Version auf Port 8766 mit einem eigenen Zertifikat. Beim ersten
Tippen auf **Zeigen** erklärt die App die Schritte:

1. **Zertifikat laden** antippen → **Erlauben**.
2. **Einstellungen** → oben **Profil geladen** → **Installieren**.
3. **Einstellungen → Allgemein → Info → Zertifikatsvertrauenseinstellungen** → **Mac-Fernbedienung …** einschalten.
4. **Sichere Version öffnen** antippen und diese wieder zum Home-Bildschirm hinzufügen.

Zur Sicherheit: Der Server erzeugt für dieses Zertifikat eine eigene kleine Zertifizierungsstelle,
unterschreibt damit genau ein Zertifikat (für den Namen deines Macs, z. B. `…​.local`) und **löscht
danach ihren geheimen Schlüssel**. Das iPhone vertraut also nur diesem einen Zertifikat, und niemand
kann damit später weitere ausstellen. Ein neues Zertifikat gibt es mit `python3 server.py --new-cert`,
danach die Schritte 1–3 wiederholen (altes Profil vorher unter Einstellungen → Allgemein →
VPN & Geräteverwaltung löschen).

## Schneller starten: App-Symbol

Einmal im Terminal (im Ordner `mac-remote`):

```bash
python3 server.py --install
```

Danach gibt es die App **„Mac-Fernbedienung“** (in deinem Benutzerordner unter *Programme*):

- **⌘ + Leertaste** → „Fernbedienung“ tippen → **Enter**, oder das Symbol ins **Dock** ziehen.
- Ein Klick startet den Server im Terminal. Läuft er schon, zeigt ein Klick den QR-Code zum Verbinden.
- Den Ordner `mac-remote` danach nicht mehr verschieben, sonst `--install` einfach wiederholen.

## Automatisch starten

**Systemeinstellungen → Allgemein → Anmeldeobjekte → „+“** und die App **Mac-Fernbedienung**
(oder `start.command`) auswählen. Dann läuft der Server nach jedem Login, mit denselben Freigaben.

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
| Port belegt | `python3 server.py --port 8770` (HTTPS läuft dann auf 8771) |
| „Zeigen“: Safari meldet „Verbindung nicht privat“ | Schritt 3 der HTTPS-Einrichtung fehlt, oder die Adresse passt nicht: die Adresse mit `.local` verwenden, die „Sichere Version öffnen“ anbietet |
| „Zeigen“ bewegt in die falsche Richtung | System → Einstellungen → „Zeigen: … umkehren“ |

## Optionen

```
python3 server.py --port 8765      anderer Port
python3 server.py --new-token      neuen Schlüssel erzeugen
python3 server.py --pair           QR-Seite beim Start öffnen (sonst nur beim ersten Mal)
python3 server.py --no-browser     QR-Seite nie automatisch öffnen
python3 server.py --install        App „Mac-Fernbedienung“ anlegen
python3 server.py --no-https       ohne HTTPS-Server (dann kein „Zeigen“)
python3 server.py --new-cert       neues HTTPS-Zertifikat erzeugen
```

## Technik

- `server.py`: HTTP- und WebSocket-Server, nur Python-Standardbibliothek. Maus, Tastatur und
  Medientasten laufen direkt über CoreGraphics (per `ctypes`); Mausbewegungen werden auf dem Mac
  geglättet, der Rest über `osascript`, `pmset`, `open`,
  `screencapture`, `pbcopy`/`pbpaste` und `say`.
- `static/index.html`: die Handy-Oberfläche, eine einzelne Datei ohne externe Abhängigkeiten.
