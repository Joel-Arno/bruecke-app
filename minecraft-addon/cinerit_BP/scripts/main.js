/*
 * Cinerit — Lebenszeichen (Schritt 1)
 *
 * Diese Datei enthaelt absichtlich keine Spiellogik. Sie beantwortet genau eine
 * Frage: Laedt das Behavior Pack, und startet die Script-Engine mit den
 * Modulversionen, die im Manifest stehen?
 *
 * Der Grund fuer diese Trennung: Wenn spaeter Erz, Altar und Menue gleichzeitig
 * dazukommen und nichts passiert, gibt es ein Dutzend moegliche Ursachen. Wenn
 * wir jetzt beweisen, dass die Grundlage traegt, bleibt bei jedem spaeteren
 * Fehler nur noch der neu hinzugekommene Teil als Verdaechtiger uebrig.
 */

import { world, system } from "@minecraft/server";

/*
 * Version des Addons, nicht der API. Sie steht hier zusaetzlich zum Manifest,
 * weil man sie so im Spiel sieht. Beim Testen auf einem zweiten Geraet ist
 * "ich habe doch die neue Version drauf" die mit Abstand haeufigste
 * Fehlannahme — mit dieser Zeile im Chat ist die Frage in einer Sekunde geklaert.
 */
const ADDON_VERSION = "0.1.0 (Schritt 1)";

/*
 * Zwei getrennte Ausgaben, weil sie zwei verschiedene Dinge beweisen.
 *
 * Diese hier laeuft beim Laden des Moduls, noch bevor irgendein Event
 * existiert, und landet im Content-Log. Erscheint sie nicht, hat das Spiel das
 * Skript gar nicht erst ausgefuehrt — dann liegt der Fehler im Manifest, im
 * entry-Pfad oder an einer Modulversion, die es auf diesem Build nicht gibt.
 */
console.warn(`[Cinerit] Skript-Modul geladen — ${ADDON_VERSION}`);

world.afterEvents.playerSpawn.subscribe((ereignis) => {
  /*
   * initialSpawn trennt "Welt betreten" von "nach dem Tod respawnen".
   * Ohne diese Abfrage begruesst das Addon den Spieler bei jedem Tod erneut.
   */
  if (!ereignis.initialSpawn) return;

  /*
   * Die Verzoegerung ist kein Aberglaube. Beim Weltbeitritt laeuft das Skript
   * los, bevor der Chat des Spielers Nachrichten annimmt; die erste Zeile geht
   * dann verloren. Auf iPad und Konsole passiert das oefter als auf dem PC,
   * weil das Laden dort laenger dauert. Eine Sekunde (20 Ticks) ist der
   * kleinste Wert, der in der Praxis zuverlaessig durchkommt.
   *
   * afterEvents darf die Welt veraendern — der Umweg ueber system.run waere
   * hier also nicht noetig. runTimeout brauchen wir trotzdem, aber fuer die
   * Wartezeit, nicht fuer die Erlaubnis.
   */
  system.runTimeout(() => {
    ereignis.player.sendMessage(
      `§6[Cinerit]§r Addon geladen — Version ${ADDON_VERSION}`
    );
  }, 20);
});
