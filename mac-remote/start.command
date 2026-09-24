#!/bin/bash
# Doppelklick im Finder startet die Mac-Fernbedienung im Terminal.
cd "$(dirname "$0")" || exit 1
exec /usr/bin/python3 server.py "$@"
