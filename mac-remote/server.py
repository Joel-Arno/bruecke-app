#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mac-Fernbedienung – kleiner Server, über den ein Handy den Mac steuert.

Braucht nur die Python-Standardbibliothek (python3 ist auf dem Mac dabei).

    python3 server.py              Server starten
    python3 server.py --new-token  neuen Zugangsschlüssel erzeugen
    python3 server.py --port 9000  anderen Port verwenden
"""

import argparse
import base64
import ctypes
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import urllib.request
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(HERE, "static")
CONFIG_DIR = os.path.expanduser("~/.mac-remote")
TOKEN_FILE = os.path.join(CONFIG_DIR, "token")
IS_MAC = sys.platform == "darwin"
# pbcopy/pbpaste/say brauchen eine UTF-8-Umgebung, sonst werden Umlaute kaputt.
ENV = dict(os.environ, LANG="en_US.UTF-8", LC_ALL="en_US.UTF-8")
MAX_BODY = 1024 * 1024
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
# Diese Befehle kommen über den WebSocket (schnell, in fester Reihenfolge)
WS_ACTIONS = {"mouse_move", "scroll", "click", "drag"}

# Tastennamen -> macOS-Keycodes
KEYCODES = {
    "return": 36, "enter": 36, "tab": 48, "space": 49, "backspace": 51,
    "delete": 117, "escape": 53, "left": 123, "right": 124, "down": 125,
    "up": 126, "home": 115, "end": 119, "pageup": 116, "pagedown": 121,
    "f1": 122, "f2": 120, "f3": 99, "f4": 118, "f5": 96, "f6": 97,
    "f7": 98, "f8": 100, "f9": 101, "f10": 109, "f11": 103, "f12": 111,
}
# Tasten, die auf deutscher und US-Tastatur an derselben Stelle liegen.
# (y/z und Satzzeichen nicht – die laufen über System Events, s. Mac.key)
STABLE_KEYS = {
    "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "x": 7, "c": 8, "v": 9,
    "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "t": 17, "1": 18, "2": 19,
    "3": 20, "4": 21, "6": 22, "5": 23, "9": 25, "7": 26, "8": 28, "0": 29,
    "o": 31, "u": 32, "i": 34, "p": 35, "l": 37, "j": 38, "k": 40, "n": 45,
    "m": 46,
}
# Tasten, die auf echten Tastaturen die Fn-/Ziffernblock-Flags mitschicken
FN_KEYS = {"left", "right", "up", "down", "home", "end", "pageup", "pagedown",
           "delete", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9",
           "f10", "f11", "f12"}
MODS = {"cmd": (55, 0x100000), "shift": (56, 0x20000),
        "alt": (58, 0x80000), "ctrl": (59, 0x40000)}
AS_MODS = {"cmd": "command down", "shift": "shift down",
           "alt": "option down", "ctrl": "control down"}
# Sondertasten (Medien, Helligkeit) – NX_KEYTYPE_* aus IOKit
NX = {"brightup": 2, "brightdown": 3, "playpause": 16, "next": 17, "prev": 18}

APP_DIRS = ["/Applications", "/Applications/Utilities", "/System/Applications",
            "/System/Applications/Utilities", os.path.expanduser("~/Applications")]


class UserError(Exception):
    """Fehler, dessen Text direkt auf dem Handy angezeigt wird."""


# --------------------------------------------------------------- Hilfen

def friendly(msg):
    if "-1743" in msg or "Not authorized to send Apple events" in msg:
        return ("Automation-Freigabe fehlt: Systemeinstellungen → Datenschutz & "
                "Sicherheit → Automation → Terminal → „System Events“ erlauben.")
    if "-1719" in msg or "-25211" in msg or "assistive access" in msg:
        return ("Bedienungshilfen-Freigabe fehlt: Systemeinstellungen → Datenschutz "
                "& Sicherheit → Bedienungshilfen → Terminal einschalten.")
    return msg


def run(cmd, input_text=None, timeout=15):
    if not IS_MAC:
        raise UserError("Diese Funktion geht nur auf einem Mac.")
    try:
        p = subprocess.run(cmd, input=input_text, capture_output=True, text=True,
                           timeout=timeout, env=ENV)
    except FileNotFoundError:
        raise UserError("Programm nicht gefunden: " + cmd[0])
    except subprocess.TimeoutExpired:
        raise UserError("Zeitüberschreitung bei " + cmd[0])
    if p.returncode != 0:
        msg = (p.stderr or p.stdout or "").strip() or cmd[0] + " ist fehlgeschlagen"
        raise UserError(friendly(msg))
    return p.stdout.strip()


def quiet(cmd):
    """Wie run(), liefert aber None statt eines Fehlers."""
    try:
        return run(cmd, timeout=5)
    except UserError:
        return None


def osa(*lines, args=(), js=False):
    """AppleScript (oder JXA) ausführen. Nutzereingaben kommen als argv an, nie in den Skripttext."""
    cmd = ["osascript"] + (["-l", "JavaScript"] if js else [])
    for line in "\n".join(lines).strip().splitlines():
        cmd += ["-e", line]
    # Argumente mit führendem „-“ würde osascript als Option lesen
    return run(cmd + [(" " + a) if a.startswith("-") else a for a in map(str, args)])


def text_arg(body, key="text", limit=20000):
    value = body.get(key)
    if not isinstance(value, str) or not value:
        raise UserError("Kein Text angegeben.")
    return value[:limit]


def num_arg(body, key, default=0.0):
    try:
        value = float(body.get(key, default))
    except (TypeError, ValueError):
        raise UserError("Ungültiger Wert für " + key)
    if value != value or abs(value) > 1e5:  # NaN oder absurd groß
        raise UserError("Ungültiger Wert für " + key)
    return value


# ------------------------------------------------ CoreGraphics via ctypes

class CGPoint(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]


class CGSize(ctypes.Structure):
    _fields_ = [("width", ctypes.c_double), ("height", ctypes.c_double)]


class CGRect(ctypes.Structure):
    _fields_ = [("origin", CGPoint), ("size", CGSize)]


def _fn(lib, name, restype, *argtypes):
    f = getattr(lib, name)
    f.restype = restype
    f.argtypes = list(argtypes)
    return f


class Quartz:
    """Maus, Tastatur und Medientasten direkt über CoreGraphics – ohne Zusatzpakete."""

    def __init__(self):
        vp, u32 = ctypes.c_void_p, ctypes.c_uint32
        cg = ctypes.CDLL("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
        cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
        self.EventCreate = _fn(cg, "CGEventCreate", vp, vp)
        self.GetLocation = _fn(cg, "CGEventGetLocation", CGPoint, vp)
        self.MouseEvent = _fn(cg, "CGEventCreateMouseEvent", vp, vp, u32, CGPoint, u32)
        self.KeyEvent = _fn(cg, "CGEventCreateKeyboardEvent", vp, vp, ctypes.c_uint16, ctypes.c_bool)
        self.SetUnicode = _fn(cg, "CGEventKeyboardSetUnicodeString", None, vp,
                              ctypes.c_ulong, ctypes.POINTER(ctypes.c_uint16))
        self.SetFlags = _fn(cg, "CGEventSetFlags", None, vp, ctypes.c_uint64)
        self.SetField = _fn(cg, "CGEventSetIntegerValueField", None, vp, u32, ctypes.c_int64)
        self.ScrollEvent = _fn(cg, "CGEventCreateScrollWheelEvent2", vp, vp, u32, u32,
                               ctypes.c_int32, ctypes.c_int32, ctypes.c_int32)
        self.Post = _fn(cg, "CGEventPost", None, u32, vp)
        self.MainDisplay = _fn(cg, "CGMainDisplayID", u32)
        self.DisplayBounds = _fn(cg, "CGDisplayBounds", CGRect, u32)
        self.ActiveDisplays = _fn(cg, "CGGetActiveDisplayList", ctypes.c_int32, u32,
                                  ctypes.POINTER(u32), ctypes.POINTER(u32))
        self.Release = _fn(cf, "CFRelease", None, vp)
        self.dragging = False
        self.scroll_rest = [0.0, 0.0]
        self.lock = threading.Lock()
        # Eigene Cursor-Position: macOS meldet nach schnellen Bewegungen oft
        # noch die alte Position, dadurch ging Bewegung verloren und es ruckelte.
        self.cursor = None
        self.cursor_time = 0.0
        self.area = None
        self.area_time = 0.0
        # Ausstehende Bewegung, die ein eigener Thread gleichmäßig abarbeitet
        self.pending = [0.0, 0.0]
        self.pending_cv = threading.Condition()
        threading.Thread(target=self._mover, daemon=True).start()
        try:
            self._init_media_keys()
        except Exception as e:  # Maus/Tastatur funktionieren trotzdem
            self.media_error = str(e)
        else:
            self.media_error = None

    # -- Grundlagen
    def _new(self, ev):
        if not ev:
            raise UserError("macOS hat das Eingabe-Ereignis abgelehnt.")
        return ev

    def _post(self, ev):
        self.Post(0, ev)  # kCGHIDEventTap
        self.Release(ev)

    def position(self):
        ev = self._new(self.EventCreate(None))
        p = self.GetLocation(ev)
        self.Release(ev)
        return p.x, p.y

    def displays(self):
        """Bildschirme als (x0, y0, x1, y1), zwei Sekunden zwischengespeichert."""
        now = time.monotonic()
        if self.area is None or now - self.area_time > 2:
            ids = (ctypes.c_uint32 * 16)()
            count = ctypes.c_uint32(0)
            self.ActiveDisplays(16, ids, ctypes.byref(count))
            rects = [self.DisplayBounds(ids[i]) for i in range(count.value)]
            rects = rects or [self.DisplayBounds(self.MainDisplay())]
            self.area = [(r.origin.x, r.origin.y, r.origin.x + r.size.width,
                          r.origin.y + r.size.height) for r in rects]
            self.area_time = now
        return self.area

    def _clamp(self, x, y, fx, fy):
        """(x, y) auf einen Bildschirm begrenzen – bevorzugt den, auf dem (fx, fy) liegt."""
        screens = self.displays()
        for x0, y0, x1, y1 in screens:
            if x0 <= x < x1 and y0 <= y < y1:
                return x, y
        home = next((d for d in screens if d[0] <= fx < d[2] and d[1] <= fy < d[3]), screens[0])
        x0, y0, x1, y1 = home
        return min(max(x, x0), x1 - 1), min(max(y, y0), y1 - 1)

    # -- Maus
    def _current(self):
        # Nach einer Pause neu einlesen, falls die echte Maus bewegt wurde
        if self.cursor is None or time.monotonic() - self.cursor_time > 0.3:
            self.cursor = self.position()
        return self.cursor

    def queue_move(self, dx, dy):
        with self.pending_cv:
            self.pending[0] += dx
            self.pending[1] += dy
            self.pending_cv.notify()

    def _take(self, fraction):
        with self.pending_cv:
            px, py = self.pending
            if fraction < 1 and (abs(px) >= 1 or abs(py) >= 1):
                px, py = px * fraction, py * fraction
            self.pending[0] -= px
            self.pending[1] -= py
            return px, py

    def _flush(self):
        """Ausstehende Bewegung sofort ausführen (vor Klicks). Nur mit self.lock aufrufen."""
        dx, dy = self._take(1)
        if dx or dy:
            self._move_by(dx, dy)

    def _mover(self):
        # Etwa 160 Schritte pro Sekunde, jeder holt die Hälfte des Rests nach:
        # gleicht WLAN-Ruckler aus und kostet nur rund 15 ms Verzögerung.
        while True:
            with self.pending_cv:
                while not (self.pending[0] or self.pending[1]):
                    self.pending_cv.wait()
            try:
                with self.lock:
                    dx, dy = self._take(0.5)
                    if dx or dy:
                        self._move_by(dx, dy)
            except Exception:
                pass
            time.sleep(0.006)

    def move(self, dx, dy):
        with self.lock:
            self._move_by(dx, dy)

    def _move_by(self, dx, dy):
        x, y = self._current()
        nx, ny = self._clamp(x + dx, y + dy, x, y)
        self._move_to(nx, ny, dx, dy)

    def _move_to(self, x, y, dx=0, dy=0):
        kind = 6 if self.dragging else 5  # LeftMouseDragged / MouseMoved
        ev = self._new(self.MouseEvent(None, kind, CGPoint(x, y), 0))
        self.SetField(ev, 4, int(round(dx)))  # kCGMouseEventDeltaX
        self.SetField(ev, 5, int(round(dy)))  # kCGMouseEventDeltaY
        self._post(ev)
        self.cursor, self.cursor_time = (x, y), time.monotonic()

    def click(self, button="left", count=1, at=None):
        with self.lock:
            self._flush()
            if self.dragging:
                self._button(False)
            if at:
                self._move_to(*at)
            x, y = self._current()
            down, up, btn = (1, 2, 0) if button == "left" else (3, 4, 1)
            for n in range(1, count + 1):
                for kind in (down, up):
                    ev = self._new(self.MouseEvent(None, kind, CGPoint(x, y), btn))
                    self.SetField(ev, 1, n)  # kCGMouseEventClickState
                    self._post(ev)

    def _button(self, down):
        x, y = self._current()
        ev = self._new(self.MouseEvent(None, 1 if down else 2, CGPoint(x, y), 0))
        self.SetField(ev, 1, 1)
        self._post(ev)
        self.dragging = down

    def drag(self, on):
        with self.lock:
            self._flush()
            if on != self.dragging:
                self._button(on)

    def main_display(self):
        r = self.DisplayBounds(self.MainDisplay())
        return r.origin.x, r.origin.y, r.size.width, r.size.height

    def scroll(self, dx, dy):
        with self.lock:
            # Nachkommastellen aufheben, damit langsames Scrollen nicht verloren geht
            self.scroll_rest[0] += dx
            self.scroll_rest[1] += dy
            ix, iy = int(self.scroll_rest[0]), int(self.scroll_rest[1])
            if not ix and not iy:
                return
            self.scroll_rest[0] -= ix
            self.scroll_rest[1] -= iy
            self._post(self._new(self.ScrollEvent(None, 0, 2, iy, ix, 0)))  # Pixel-Einheiten

    # -- Tastatur
    def _key(self, code, down, flags):
        ev = self._new(self.KeyEvent(None, code, down))
        self.SetFlags(ev, flags)
        self._post(ev)

    def key(self, code, mods=(), extra_flags=0):
        with self.lock:
            flags, pressed = 0, []
            for m in mods:
                kc, fl = MODS[m]
                flags |= fl
                self._key(kc, True, flags)
                pressed.append((kc, fl))
            self._key(code, True, flags | extra_flags)
            self._key(code, False, flags | extra_flags)
            for kc, fl in reversed(pressed):
                flags &= ~fl
                self._key(kc, False, flags)

    def type_text(self, text):
        for ch in text:
            if ch == "\n":
                self.key(36)
            elif ch == "\t":
                self.key(48)
            else:
                data = ch.encode("utf-16-le")
                n = len(data) // 2
                buf = (ctypes.c_uint16 * n).from_buffer_copy(data)
                with self.lock:
                    for down in (True, False):
                        ev = self._new(self.KeyEvent(None, 0, down))
                        self.SetFlags(ev, 0)
                        self.SetUnicode(ev, n, buf)
                        self._post(ev)
            time.sleep(0.002)

    # -- Medientasten (NSEvent über die Objective-C-Laufzeit)
    def _init_media_keys(self):
        vp = ctypes.c_void_p
        objc = ctypes.CDLL("/usr/lib/libobjc.A.dylib")
        ctypes.CDLL("/System/Library/Frameworks/AppKit.framework/AppKit")
        _fn(objc, "objc_getClass", vp, ctypes.c_char_p)
        _fn(objc, "sel_registerName", vp, ctypes.c_char_p)
        _fn(objc, "objc_autoreleasePoolPush", vp)
        _fn(objc, "objc_autoreleasePoolPop", None, vp)
        send = ctypes.cast(objc.objc_msgSend, vp).value
        self._make_event = ctypes.CFUNCTYPE(
            vp, vp, vp, ctypes.c_ulong, CGPoint, ctypes.c_ulong, ctypes.c_double,
            ctypes.c_long, vp, ctypes.c_short, ctypes.c_long, ctypes.c_long)(send)
        self._to_cgevent = ctypes.CFUNCTYPE(vp, vp, vp)(send)
        self._NSEvent = objc.objc_getClass(b"NSEvent")
        self._sel_make = objc.sel_registerName(
            b"otherEventWithType:location:modifierFlags:timestamp:"
            b"windowNumber:context:subtype:data1:data2:")
        self._sel_cg = objc.sel_registerName(b"CGEvent")
        self.objc = objc
        if not self._NSEvent:
            raise RuntimeError("NSEvent nicht gefunden")

    def system_key(self, code):
        if self.media_error:
            raise UserError("Medientasten nicht verfügbar: " + self.media_error)
        with self.lock:
            pool = self.objc.objc_autoreleasePoolPush()
            try:
                for down in (True, False):
                    flags = 0xA00 if down else 0xB00
                    data1 = (code << 16) | ((0xA if down else 0xB) << 8)
                    ns = self._make_event(self._NSEvent, self._sel_make, 14, CGPoint(0, 0),
                                          flags, 0.0, 0, None, 8, data1, -1)
                    if not ns:
                        raise UserError("Medientaste konnte nicht erzeugt werden.")
                    self.Post(0, self._to_cgevent(ns, self._sel_cg))
            finally:
                self.objc.objc_autoreleasePoolPop(pool)


def accessibility_trusted(prompt=False):
    """Darf dieser Prozess (bzw. das Terminal) Maus und Tastatur steuern?"""
    if not IS_MAC:
        return None
    try:
        ax = ctypes.CDLL("/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices")
        if not prompt:
            return bool(_fn(ax, "AXIsProcessTrusted", ctypes.c_bool)())
        vp = ctypes.c_void_p
        cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
        create = _fn(cf, "CFDictionaryCreate", vp, vp, ctypes.POINTER(vp), ctypes.POINTER(vp),
                     ctypes.c_long, vp, vp)
        keys = (vp * 1)(vp.in_dll(ax, "kAXTrustedCheckOptionPrompt").value)
        vals = (vp * 1)(vp.in_dll(cf, "kCFBooleanTrue").value)
        options = create(None, keys, vals, 1,
                         ctypes.addressof(vp.in_dll(cf, "kCFTypeDictionaryKeyCallBacks")),
                         ctypes.addressof(vp.in_dll(cf, "kCFTypeDictionaryValueCallBacks")))
        trusted = _fn(ax, "AXIsProcessTrustedWithOptions", ctypes.c_bool, vp)(options)
        _fn(cf, "CFRelease", None, vp)(options)
        return bool(trusted)
    except Exception:
        return None


# ----------------------------------------------------------- Mac-Steuerung

class Mac:
    def __init__(self):
        self._quartz = None
        self._quartz_error = "nur auf einem Mac verfügbar"
        self.caffeinate = None
        if IS_MAC:
            try:
                self._quartz = Quartz()
            except Exception as e:
                self._quartz_error = str(e)
        self.get_routes = {
            "status": self.status, "apps": self.running_apps,
            "installed": self.installed_apps, "clipboard": self.clipboard_get,
            "screenshot": self.screenshot,
        }
        self.post_routes = {
            "mouse_move": self.mouse_move, "click": self.click, "drag": self.drag,
            "scroll": self.scroll, "tap_screen": self.tap_screen, "type": self.type_text,
            "key": self.key, "media": self.media, "volume": self.volume,
            "brightness": self.brightness, "app_activate": self.app_activate,
            "app_quit": self.app_quit, "app_launch": self.app_launch,
            "open_url": self.open_url, "clipboard": self.clipboard_set, "say": self.say,
            "notify": self.notify, "power": self.power, "awake": self.awake, "ui": self.ui,
        }

    def q(self):
        if not IS_MAC:
            raise UserError("Diese Funktion geht nur auf einem Mac.")
        if not self._quartz:
            raise UserError("Maus/Tastatur nicht verfügbar: " + self._quartz_error)
        return self._quartz

    # -- Status
    def status(self, _=None):
        info = {
            "name": quiet(["scutil", "--get", "ComputerName"]) or socket.gethostname(),
            "macos": quiet(["sw_vers", "-productVersion"]),
            "accessibility": accessibility_trusted(),
            "awake": bool(self.caffeinate and self.caffeinate.poll() is None),
            "dark": quiet(["defaults", "read", "-g", "AppleInterfaceStyle"]) == "Dark",
            "battery": None, "volume": None, "muted": None, "playing": None,
        }
        batt = quiet(["pmset", "-g", "batt"]) or ""
        m = re.search(r"(\d+)%;\s*([^;]+);", batt)
        if m:
            info["battery"] = {"percent": int(m.group(1)), "state": m.group(2).strip(),
                               "ac": "AC Power" in batt}
        try:
            info["volume"], info["muted"] = self._volume_get()
        except UserError:
            pass
        try:
            info["playing"] = self.now_playing()
        except UserError:
            pass
        return info

    # -- Maus
    def mouse_move(self, body):
        self.q().queue_move(num_arg(body, "dx"), num_arg(body, "dy"))

    def click(self, body):
        button = "right" if body.get("button") == "right" else "left"
        self.q().click(button, 2 if body.get("double") else 1)

    def drag(self, body):
        self.q().drag(bool(body.get("on")))

    def scroll(self, body):
        self.q().scroll(num_arg(body, "dx"), num_arg(body, "dy"))

    def tap_screen(self, body):
        fx = min(max(num_arg(body, "fx"), 0.0), 1.0)
        fy = min(max(num_arg(body, "fy"), 0.0), 1.0)
        q = self.q()
        x, y, w, h = q.main_display()
        button = "right" if body.get("button") == "right" else "left"
        q.click(button, 2 if body.get("double") else 1,
                at=(x + fx * (w - 1), y + fy * (h - 1)))

    # -- Tastatur
    def type_text(self, body):
        self.q().type_text(text_arg(body))

    def key(self, body):
        name = str(body.get("key", "")).lower()
        mods = [m for m in body.get("mods") or [] if m in MODS]
        if name in KEYCODES:
            extra = 0x800000 if name in FN_KEYS else 0  # kCGEventFlagMaskSecondaryFn
            if name in ("left", "right", "up", "down"):
                extra |= 0x200000  # kCGEventFlagMaskNumericPad
            return self.q().key(KEYCODES[name], mods, extra)
        if len(name) != 1:
            raise UserError("Unbekannte Taste: " + name)
        if not mods:
            return self.q().type_text(str(body.get("key")))
        if name in STABLE_KEYS:
            return self.q().key(STABLE_KEYS[name], mods)
        # z. B. ⌘Z: z/y sind auf deutscher Tastatur vertauscht – System Events
        # kennt das aktuelle Layout und drückt die richtige Taste.
        using = ", ".join(AS_MODS[m] for m in mods)
        osa("on run argv",
            'tell application "System Events" to keystroke (item 1 of argv) using {%s}' % using,
            "end run", args=[name])

    # -- Medien, Lautstärke, Helligkeit
    def _running(self, process):
        try:
            return subprocess.run(["pgrep", "-xq", process]).returncode == 0
        except OSError:
            return False

    def now_playing(self):
        found = None
        for app in ("Spotify", "Music"):
            if not self._running(app):
                continue
            out = osa('tell application "%s"' % app,
                      "set s to player state as string",
                      'set t to ""',
                      'set a to ""',
                      "try",
                      "set t to name of current track",
                      "set a to artist of current track",
                      "end try",
                      "return s & linefeed & t & linefeed & a",
                      "end tell")
            state, title, artist = (out.split("\n") + ["", "", ""])[:3]
            info = {"app": app, "state": state, "title": title, "artist": artist}
            if state == "playing":
                return info
            found = found or info
        return found

    def media(self, body):
        action = body.get("action")
        commands = {"playpause": "playpause", "next": "next track", "prev": "previous track"}
        if action not in commands:
            raise UserError("Unbekannte Medien-Aktion.")
        playing = self.now_playing()
        # Läuft Spotify/Musik gerade, direkt dort steuern – das klappt immer.
        if playing and playing["state"] == "playing":
            return osa('tell application "%s" to %s' % (playing["app"], commands[action]))
        try:
            # sonst die Medientaste drücken: steuert, was zuletzt lief (auch YouTube im Browser)
            self.q().system_key(NX[action])
        except UserError:
            if not playing:
                raise
            osa('tell application "%s" to %s' % (playing["app"], commands[action]))

    def _volume_get(self):
        out = osa("set s to get volume settings",
                  'return (output volume of s as string) & "," & (output muted of s as string)')
        vol, muted = out.split(",")
        return (int(vol) if vol.isdigit() else None), muted == "true"

    def volume(self, body):
        if "mute" in body:
            if body["mute"] == "toggle":
                osa("set volume output muted not (output muted of (get volume settings))")
            else:
                osa("set volume %s output muted" % ("with" if body["mute"] else "without"))
        else:
            if "level" in body:
                level = num_arg(body, "level")
            else:
                current, _ = self._volume_get()
                if current is None:
                    raise UserError("Dieses Ausgabegerät erlaubt keine Lautstärke-Regelung.")
                level = current + num_arg(body, "delta")
            level = int(min(max(level, 0), 100))
            osa("set volume output volume %d" % level)
            if level > 0:
                osa("set volume without output muted")
        vol, muted = self._volume_get()
        return {"volume": vol, "muted": muted}

    def brightness(self, body):
        up = body.get("dir") == "up"
        try:
            self.q().system_key(NX["brightup" if up else "brightdown"])
        except UserError:
            osa('tell application "System Events" to key code %d' % (144 if up else 145))

    # -- Apps
    def running_apps(self, _=None):
        out = osa("""
ObjC.import('AppKit');
var apps = $.NSWorkspace.sharedWorkspace.runningApplications;
var out = [];
for (var i = 0; i < apps.count; i++) {
  var a = apps.objectAtIndex(i);
  if (a.activationPolicy == 0) {
    out.push({name: ObjC.unwrap(a.localizedName), bundle: ObjC.unwrap(a.bundleIdentifier) || '', active: a.active == true});
  }
}
JSON.stringify(out);
""", js=True)
        apps = json.loads(out)
        apps.sort(key=lambda a: (not a["active"], a["name"].lower()))
        return {"apps": apps}

    def _installed(self):
        found = {}
        for base in APP_DIRS:
            try:
                entries = os.listdir(base)
            except OSError:
                continue
            for entry in entries:
                path = os.path.join(base, entry)
                if entry.endswith(".app"):
                    found.setdefault(entry[:-4], path)
                elif os.path.isdir(path) and not entry.startswith("."):
                    try:  # eine Ebene tiefer, z. B. /Applications/Microsoft Office
                        for sub in os.listdir(path):
                            if sub.endswith(".app"):
                                found.setdefault(sub[:-4], os.path.join(path, sub))
                    except OSError:
                        pass
        return found

    def installed_apps(self, _=None):
        apps = self._installed()
        return {"apps": [{"name": n, "path": p}
                         for n, p in sorted(apps.items(), key=lambda kv: kv[0].lower())]}

    def app_launch(self, body):
        path = str(body.get("path", ""))
        if path not in self._installed().values():
            raise UserError("App nicht gefunden.")
        run(["open", path])

    def _app_ref(self, body):
        bundle = str(body.get("bundle") or "")
        if bundle and re.fullmatch(r"[A-Za-z0-9.\-_]+", bundle):
            return "id", bundle
        name = str(body.get("name") or "")
        if not name:
            raise UserError("Keine App angegeben.")
        return "name", name

    def app_activate(self, body):
        kind, ref = self._app_ref(body)
        run(["open", "-b", ref] if kind == "id" else ["open", "-a", ref])

    def app_quit(self, body):
        kind, ref = self._app_ref(body)
        target = "application id (item 1 of argv)" if kind == "id" else "application (item 1 of argv)"
        osa("on run argv", "tell %s to quit" % target, "end run", args=[ref])

    def open_url(self, body):
        url = text_arg(body, "url", 4000).strip()
        if not re.match(r"^https?://", url, re.I):
            url = "https://" + url
        if re.search(r"\s", url):
            raise UserError("Ungültige Adresse.")
        run(["open", url])

    # -- Bildschirm
    def screenshot(self, _=None):
        fd, path = tempfile.mkstemp(suffix=".jpg")
        os.close(fd)
        try:
            run(["screencapture", "-x", "-m", "-t", "jpg", path])
            run(["sips", "-Z", "1600", "-s", "formatOptions", "65", path])
            with open(path, "rb") as f:
                return f.read()
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass

    # -- Zwischenablage, Sprache, Mitteilung
    def clipboard_get(self, _=None):
        return {"text": run(["pbpaste"])}

    def clipboard_set(self, body):
        run(["pbcopy"], input_text=text_arg(body, limit=MAX_BODY))

    def say(self, body):
        text = text_arg(body, limit=2000)
        if not IS_MAC:
            raise UserError("Diese Funktion geht nur auf einem Mac.")
        p = subprocess.Popen(["say"], stdin=subprocess.PIPE, env=ENV)
        p.stdin.write(text.encode("utf-8"))
        p.stdin.close()

    def notify(self, body):
        osa("on run argv",
            'display notification (item 1 of argv) with title "Vom Handy"',
            "end run", args=[text_arg(body, limit=500)])

    # -- System
    def power(self, body):
        action = body.get("action")
        if action == "display_off":
            run(["pmset", "displaysleepnow"])
        elif action == "lock":
            self.q().key(STABLE_KEYS["q"], ["ctrl", "cmd"])
        elif action == "sleep":
            run(["pmset", "sleepnow"])
        elif action == "screensaver":
            run(["open", "-a", "ScreenSaverEngine"])
        elif action in ("restart", "shutdown", "logout"):
            verb = {"restart": "restart", "shutdown": "shut down", "logout": "log out"}[action]
            osa('tell application "System Events" to %s' % verb)
        else:
            raise UserError("Unbekannte Aktion.")

    def awake(self, body):
        on = bool(body.get("on"))
        running = self.caffeinate and self.caffeinate.poll() is None
        if on and not running:
            if not IS_MAC:
                raise UserError("Diese Funktion geht nur auf einem Mac.")
            # -w: endet automatisch, wenn der Server beendet wird
            self.caffeinate = subprocess.Popen(["caffeinate", "-di", "-w", str(os.getpid())])
        elif not on and running:
            self.caffeinate.terminate()
            self.caffeinate = None
        return {"awake": on}

    def ui(self, body):
        what = body.get("what")
        if what == "mission_control":
            run(["open", "-a", "Mission Control"])
        elif what == "show_desktop":
            self.q().key(KEYCODES["f11"], (), 0x800000)
        elif what == "dark_mode":
            osa('tell application "System Events" to tell appearance preferences '
                "to set dark mode to not dark mode")
        else:
            raise UserError("Unbekannte Aktion.")

    def cleanup(self):
        if self._quartz and self._quartz.dragging:
            try:
                self._quartz.drag(False)
            except Exception:
                pass
        if self.caffeinate and self.caffeinate.poll() is None:
            self.caffeinate.terminate()


# -------------------------------------------------------------- Webserver

def app_icon(size=180):
    """Homescreen-Icon als PNG, ohne Bildbibliothek erzeugt."""
    bg, pad_c, dot = (0x2B, 0x4C, 0x5C), (0xED, 0xE6, 0xD6), (0xF2, 0xC1, 0x4E)
    rows = []
    m, r = size * 0.2, size * 0.1  # Rand und Eckenradius des Trackpads
    for y in range(size):
        row = bytearray(b"\x00")
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            color = bg
            # abgerundetes Rechteck (Trackpad)
            cx = min(max(px, m + r), size - m - r)
            cy = min(max(py, m + r), size - m - r)
            if (px - cx) ** 2 + (py - cy) ** 2 <= r * r:
                color = pad_c
            # goldener Punkt (Finger)
            if (px - size * 0.58) ** 2 + (py - size * 0.46) ** 2 <= (size * 0.085) ** 2:
                color = dot
            row += bytes(color)
        rows.append(bytes(row))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
            + chunk(b"IEND", b""))


PAIR_PAGE = """<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Handy verbinden</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#15120E;color:#F5F0E6;
       font:16px/1.5 -apple-system,BlinkMacSystemFont,sans-serif}
  .card{background:#211D17;border:1px solid rgba(245,240,230,.1);border-radius:20px;padding:32px;
        max-width:440px;text-align:center}
  h1{font-size:22px;margin:0 0 6px}
  p{color:#A99F8D;margin:0 0 20px}
  #qr{background:#fff;padding:16px;border-radius:12px;display:inline-block;margin-bottom:16px}
  #qr img,#qr canvas{display:block}
  code{display:block;word-break:break-all;background:#15120E;padding:10px;border-radius:8px;
       font-size:13px;color:#F2C14E;margin-top:8px;user-select:all}
  small{color:#A99F8D}
</style></head><body><div class="card">
<h1>Handy oder iPad verbinden</h1>
<p>Scanne den Code mit der Kamera.<br>Handy/iPad und Mac müssen im selben WLAN sein.</p>
<div id="qr"></div>
<small>Oder diese Adresse am Handy öffnen:</small>
__URLS__
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
  try { new QRCode(document.getElementById('qr'), {text: __MAIN__, width: 240, height: 240}); }
  catch (e) { document.getElementById('qr').style.display = 'none'; }
</script>
</body></html>
"""


class Server(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Handy gesperrt, App gewechselt, WLAN weg: normal, kein Grund für einen Fehlertext
        if isinstance(sys.exc_info()[1], (ConnectionError, TimeoutError, socket.timeout)):
            return
        super().handle_error(request, client_address)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "MacRemote/1.0"
    mac = None
    token = ""
    urls = []
    icon = b""

    def log_message(self, fmt, *args):
        pass  # keine Zeile pro Mausbewegung

    def _send(self, status, body, ctype="application/json; charset=utf-8", cache=False):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "max-age=86400" if cache else "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self, query):
        given = self.headers.get("X-Token") or (query.get("t") or [""])[0]
        return hmac.compare_digest(given.encode("utf-8"), self.token.encode("utf-8"))

    def do_GET(self):
        self._handle("GET")

    def do_POST(self):
        self._handle("POST")

    def _handle(self, method):
        url = urlparse(self.path)
        query = parse_qs(url.query)
        path = url.path
        body = {}
        if method == "POST":
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                self.close_connection = True
                return self._send(413, {"ok": False, "error": "Zu viele Daten."})
            raw = self.rfile.read(length) if length else b""
            try:
                body = json.loads(raw.decode("utf-8")) if raw else {}
            except ValueError:
                return self._send(400, {"ok": False, "error": "Ungültige Anfrage."})
            if not isinstance(body, dict):
                return self._send(400, {"ok": False, "error": "Ungültige Anfrage."})

        if method == "GET" and path in ("/", "/index.html"):
            with open(os.path.join(STATIC_DIR, "index.html"), "rb") as f:
                return self._send(200, f.read(), "text/html; charset=utf-8")
        if method == "GET" and path in ("/icon.png", "/apple-touch-icon.png", "/favicon.ico"):
            return self._send(200, self.icon, "image/png", cache=True)
        if method == "GET" and path == "/ws":
            return self._websocket(query)
        if method == "GET" and path == "/pair":
            # Die Seite zeigt den Schlüssel – nur am Mac selbst abrufbar.
            # Der Host-Header schützt zusätzlich vor DNS-Rebinding über fremde Webseiten.
            host = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]")
            if (self.client_address[0] not in ("127.0.0.1", "::1", "::ffff:127.0.0.1")
                    or host not in ("localhost", "127.0.0.1", "::1")):
                return self._send(403, {"ok": False, "error": "Nur am Mac selbst abrufbar."})
            links = "".join("<code>%s</code>" % u for u in self.urls)
            page = PAIR_PAGE.replace("__URLS__", links).replace("__MAIN__", json.dumps(self.urls[0]))
            return self._send(200, page, "text/html; charset=utf-8")
        if not path.startswith("/api/"):
            return self._send(404, {"ok": False, "error": "Nicht gefunden."})
        if not self._authorized(query):
            time.sleep(0.5)  # bremst Durchprobieren aus
            return self._send(401, {"ok": False, "error": "Falscher oder fehlender Schlüssel."})

        name = path[len("/api/"):]
        routes = self.mac.get_routes if method == "GET" else self.mac.post_routes
        action = routes.get(name)
        if not action:
            return self._send(404, {"ok": False, "error": "Unbekannte Aktion."})
        try:
            result = action(body)
        except UserError as e:
            return self._send(400, {"ok": False, "error": str(e)})
        except Exception as e:
            traceback.print_exc()
            return self._send(500, {"ok": False, "error": "Interner Fehler: %s" % e})
        if isinstance(result, bytes):
            return self._send(200, result, "image/jpeg")
        out = {"ok": True}
        out.update(result or {})
        return self._send(200, out)

    # -- WebSocket: eine offene Leitung für Mausbewegungen statt vieler Einzelanfragen
    def _websocket(self, query):
        if not self._authorized(query):
            time.sleep(0.5)
            return self._send(401, {"ok": False, "error": "Falscher oder fehlender Schlüssel."})
        key = self.headers.get("Sec-WebSocket-Key")
        if not key or (self.headers.get("Upgrade") or "").lower() != "websocket":
            return self._send(400, {"ok": False, "error": "WebSocket erwartet."})
        accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
        self.send_response(101)
        self.send_header("Upgrade", "websocket")
        self.send_header("Connection", "Upgrade")
        self.send_header("Sec-WebSocket-Accept", accept)
        self.end_headers()
        self.close_connection = True
        sock = self.connection
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)  # nichts sammeln, sofort senden
        sock.settimeout(90)  # das Handy schickt alle 25 s ein Lebenszeichen
        last_error = 0.0
        while True:
            try:
                msg = self._ws_read()
            except (OSError, EOFError, ValueError):
                return
            if msg is None:
                return
            try:
                data = json.loads(msg)
                name = data.pop("a", "")
                if name == "ping" or name not in WS_ACTIONS:
                    continue
                self.mac.post_routes[name](data)
            except UserError as e:
                if time.monotonic() - last_error > 2:  # keine Fehlerflut beim Bewegen
                    last_error = time.monotonic()
                    self._ws_send(json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"))
            except Exception:
                traceback.print_exc()

    def _ws_exact(self, n):
        data = self.rfile.read(n)
        if len(data) < n:
            raise EOFError
        return data

    def _ws_read(self):
        message = b""
        while True:
            b0, b1 = self._ws_exact(2)
            opcode, length = b0 & 0x0F, b1 & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._ws_exact(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._ws_exact(8))[0]
            if length > 65536:
                raise ValueError("Nachricht zu groß")
            mask = self._ws_exact(4) if b1 & 0x80 else b""
            payload = self._ws_exact(length)
            if mask:
                payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
            if opcode == 0x8:  # Verbindung schließen
                self._ws_send(b"", 0x8)
                return None
            if opcode == 0x9:  # Ping -> Pong
                self._ws_send(payload, 0xA)
                continue
            if opcode == 0xA:
                continue
            message += payload
            if b0 & 0x80:  # letztes Teilstück
                return message.decode("utf-8", "replace")

    def _ws_send(self, payload, opcode=0x1):
        n = len(payload)
        if n < 126:
            head = struct.pack(">BB", 0x80 | opcode, n)
        elif n < 65536:
            head = struct.pack(">BBH", 0x80 | opcode, 126, n)
        else:
            head = struct.pack(">BBQ", 0x80 | opcode, 127, n)
        try:
            self.wfile.write(head + payload)
        except OSError:
            pass


def load_token(renew=False):
    """Liefert (Schlüssel, neu_erzeugt)."""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    if not renew and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            token = f.read().strip()
        if len(token) >= 16:
            return token, False
    token = secrets.token_urlsafe(18)
    fd = os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(token)
    return token, True


def already_running(port):
    """Antwortet auf dem Port schon unsere Fernbedienung?"""
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/icon.png" % port, timeout=1) as r:
            return r.headers.get("Server", "").startswith("MacRemote")
    except Exception:
        return False


LAUNCHER = """#!/bin/bash
# Läuft die Fernbedienung schon, nur den QR-Code zeigen – sonst im Terminal starten.
if curl -s -o /dev/null --max-time 1 "http://127.0.0.1:%(port)d/icon.png"; then
  open "http://localhost:%(port)d/pair"
else
  open -a Terminal "%(command)s"
fi
"""

INFO_PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Mac-Fernbedienung</string>
  <key>CFBundleDisplayName</key><string>Mac-Fernbedienung</string>
  <key>CFBundleIdentifier</key><string>de.bruecke.mac-remote</string>
  <key>CFBundleExecutable</key><string>start</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>LSUIElement</key><true/>
</dict></plist>
"""


def install_app(port):
    """Legt ~/Applications/Mac-Fernbedienung.app an (für Dock, Spotlight, Launchpad)."""
    if not IS_MAC:
        sys.exit("Das geht nur auf dem Mac.")
    command = os.path.join(HERE, "start.command")
    if '"' in command or "$" in command or "`" in command:
        sys.exit("Der Ordnerpfad enthält Sonderzeichen (\" $ `) – bitte den Ordner umbenennen.")
    app = os.path.expanduser("~/Applications/Mac-Fernbedienung.app")
    contents = os.path.join(app, "Contents")
    if os.path.isdir(app):
        shutil.rmtree(app)
    os.makedirs(os.path.join(contents, "MacOS"))
    os.makedirs(os.path.join(contents, "Resources"))
    launcher = os.path.join(contents, "MacOS", "start")
    with open(launcher, "w") as f:
        f.write(LAUNCHER % {"port": port, "command": command})
    os.chmod(launcher, 0o755)
    os.chmod(command, 0o755)
    with open(os.path.join(contents, "Info.plist"), "w") as f:
        f.write(INFO_PLIST)
    png = os.path.join(tempfile.gettempdir(), "mac-remote-icon.png")
    with open(png, "wb") as f:
        f.write(app_icon(512))
    quiet(["sips", "-s", "format", "icns", png, "--out",
           os.path.join(contents, "Resources", "AppIcon.icns")])
    os.unlink(png)
    # Aus dem Internet geladene Dateien würde macOS beim Start blockieren
    quiet(["xattr", "-dr", "com.apple.quarantine", HERE])
    quiet(["touch", app])  # Finder/Dock zeigen das Symbol sofort
    print("\n  Fertig: „Mac-Fernbedienung“ liegt jetzt in deinem Benutzerordner unter „Programme“.")
    print("  Starten: ⌘ + Leertaste, „Fernbedienung“ tippen, Enter – oder ins Dock ziehen.")
    print("  Läuft sie schon, zeigt ein Klick darauf den QR-Code zum Verbinden.")
    print("  Wichtig: Den Ordner „mac-remote“ danach nicht mehr verschieben")
    print("  (sonst einfach noch mal „python3 server.py --install“ ausführen).\n")
    subprocess.Popen(["open", "-R", app])


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # sendet nichts, ermittelt nur die Route
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    parser = argparse.ArgumentParser(description="Mac-Fernbedienung fürs Handy")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--host", default="0.0.0.0", help="Adresse, auf der gelauscht wird")
    parser.add_argument("--new-token", action="store_true", help="neuen Zugangsschlüssel erzeugen")
    parser.add_argument("--no-browser", action="store_true", help="Verbinden-Seite nie öffnen")
    parser.add_argument("--pair", action="store_true", help="Verbinden-Seite beim Start öffnen")
    parser.add_argument("--install", action="store_true",
                        help="App „Mac-Fernbedienung“ zum schnellen Starten anlegen")
    args = parser.parse_args()

    if args.install:
        return install_app(args.port)
    if already_running(args.port):
        print("\n  Die Fernbedienung läuft schon – ich zeige den QR-Code zum Verbinden.\n")
        if IS_MAC:
            subprocess.Popen(["open", "http://localhost:%d/pair" % args.port])
        return

    token, new_token = load_token(args.new_token)
    hosts = []
    ip = lan_ip()
    if ip:
        hosts.append(ip)
    local = quiet(["scutil", "--get", "LocalHostName"]) if IS_MAC else None
    if local:
        hosts.append(local + ".local")
    hosts = hosts or ["localhost"]
    urls = ["http://%s:%d/?t=%s" % (h, args.port, token) for h in hosts]

    mac = Mac()
    Handler.mac, Handler.token, Handler.urls = mac, token, urls
    Handler.icon = app_icon()
    try:
        server = Server((args.host, args.port), Handler)
    except OSError as e:
        sys.exit("Port %d ist belegt (%s). Läuft der Server schon? Sonst: --port 8766" % (args.port, e))

    print("\n  Mac-Fernbedienung läuft.\n")
    print("  Am Handy öffnen (selbes WLAN):")
    for u in urls:
        print("    " + u)
    print("\n  QR-Code am Mac:  http://localhost:%d/pair" % args.port)
    print("  Beenden: Ctrl+C\n")

    if IS_MAC:
        if accessibility_trusted() is False:
            print("  Hinweis: Für Maus & Tastatur braucht Terminal die Freigabe")
            print("  „Bedienungshilfen“ (Systemeinstellungen → Datenschutz & Sicherheit).\n")
            accessibility_trusted(prompt=True)
        # QR-Code nur zeigen, wenn er gebraucht wird (erster Start, neuer Schlüssel)
        if not args.no_browser and (new_token or args.pair):
            subprocess.Popen(["open", "http://localhost:%d/pair" % args.port])
    else:
        print("  (Kein Mac erkannt – die Oberfläche läuft, Befehle werden abgelehnt.)\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Beendet.")
    finally:
        mac.cleanup()
        server.server_close()


if __name__ == "__main__":
    main()
