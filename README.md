# Hanseller Pirschpilot

PWA für Jäger: Jagdzeiten je Bundesland, Pirsch-Deck, Wildarten-Details und eine Jagdkarte des Reviers. Next.js 16 (App Router), statischer Export, React Leaflet, PWA.

## Datenhaltung

### Jagdkarte – für alle Besucher gleich

Die Karte (Reviergrenze, Marker, Fotos) wird **zentral auf dem Webserver** gespeichert und ist für **jeden Besucher identisch**. Das statische Frontend hat keinen eigenen Server – ein kleines PHP-Backend übernimmt Speicherung und Auth:

- Daten: `php/jagdmap/data.json` (Grenze + Marker)
- Fotos: `php/jagdmap/uploads/`
- Sessions: `php/jagdmap/sessions.json` (Token, 24 h gültig)
- API: `php/api/jagdmap.php` (`data` öffentlich lesen, `login`/`save`/`upload`/`delete-photo`/`backup`/`restore` mit Passwort)
- Passwort: Env `JAGDMAP_PASSWORD` (Fallback `pirsch123`); Token liegt im Browser unter `jd-karte-admin`
- `php/jagdmap/` ist per `.gitignore` (alles außer `.htaccess`) und per `.htaccess` (Zugriff auf `data.json`/`sessions.json` gesperrt) geschützt

Jeder Login speichert live in `data.json` → Änderungen sind sofort für alle sichtbar.

### Meine Arten / Pirsch-Deck – nur pro Gerät

Die Auswahl im Pirsch-Deck wird **ausschließlich im Browser** gespeichert (`localStorage`, Key `jd-fav`). Kein Server-Kontakt, keine Synchronisation – jede Browserinstallation behält ihre eigene Auswahl. Werden Browser-Daten gelöscht, gilt wieder die Standardauswahl (Arten mit `deck: true`).

Hinweis: `localStorage` **überlebt das Schließen des Browsers**. Wirklich sitzungsgebunden ist nur die Zurück-Navigation (`jd-prev`, `sessionStorage`). Bundesland-Auswahl: `jd-state` (localStorage).

## Lokal starten

```bash
npm install
```

Terminal 1 – Frontend:

```bash
npm run dev
```

Terminal 2 – PHP-API:

```bash
php -S 0.0.0.0:8081 -t php
```

Dann öffnen: http://localhost:3000. Das Frontend erkennt Port 3000 automatisch und ruft die API unter `http://localhost:8081` auf.

## Vom Handy erreichen

1. Mac und Handy im selben WLAN.
2. LAN-IP des Mac ermitteln: `ipconfig getifaddr en0` (z. B. `192.168.178.99`).
3. Backend mit `php -S 0.0.0.0:8081 -t php` starten (bindet alle Interfaces; Next tut das standardmäßig).
4. Im Handy-Browser: `http://<LAN-IP>:3000`. Die API wird automatisch unter `http://<LAN-IP>:8081` abgerufen.
5. macOS-Firewall muss eingehende Verbindungen für Node/PHP erlauben. PWA-Installation funktioniert nur über HTTPS (Produktion).

## Deploy

`npm run build` erzeugt den statischen Export in `out/`. Die GitHub Action (`.github/workflows/deploy.yml`) lädt `php/` und `out/` per SFTP auf den STRATO-Webspace; in Produktion laufen App und API gleich-origin.
