# Backups – Hanseller Pirschpilot

Dieses Dokument erklärt, wie die Benutzerdaten (Marker, Notizen, Abschüsse) der
Jagdkarte gesichert und wiederhergestellt werden.

## Was wird gesichert

Ein Backup ist ein vollständiger Stand von `data.json` (Revierserver:
`jagdmap/data.json`). Es enthält alle Marker, deren Notizen und die Abschuss-
Einträge – also genau die Daten, die über die Website erzeugt werden.

- Die **Reviergrenze** (`boundary.json`) ist statisch und bereits im Git-Repo –
  sie muss nicht gesichert werden.
- Die **Sitzungen** (`sessions.json`) werden automatisch neu erzeugt – sie
  brauchen kein Backup.

## Automatische Sicherung

Ein GitHub-Workflow (`backup.yml`) lädt täglich die aktuelle `data.json` vom
STRATO-Webspace und speichert sie in diesem Branch als
`jagdkarte-YYYYMMDD-HHMMSS.json`. Die neueste Datei ist der aktuellste Stand.
Die Versionierung übernimmt Git – jeder tägliche Snapshot bleibt erhalten.

## Wiederherstellen (Restore)

Ein Backup wird **nicht über die App oder eine API** eingespielt, sondern direkt
über STRATO. Zwei Wege:

### Weg A – STRATO-Dateimanager (empfohlen, ohne Programmkenntnisse)

1. Diese Snapshoot-Datei herunterladen: `jagdkarte-YYYYMMDD-HHMMSS.json`
   (die gewünschte Version auswählen).
2. Im STRATO-Kundenlogin zum Webspace wechseln und in den Dateimanager gehen.
3. In den Ordner `jagdmap/` navigieren.
4. Die aktuelle Datei `data.json` zu `data.json.old` umbenennen
   (Sicherungskopie, falls man zurück will).
5. Die heruntergeladene Snapshot-Datei als `data.json` in den Ordner `jagdmap/`
   hochladen.
6. Fertig – die Karte zeigt die wiederhergestellten Marker und Abschüsse.

### Weg B – über SFTP (z. B. mit lftp oder einem SFTP-Client)

1. Snapshot herunterladen (wie oben).
2. Per SFTP auf den STRATO-Webspace verbinden.
3. `jagdmap/data.json` zu `jagdmap/data.json.old` umbenennen.
4. Snapshot als `jagdmap/data.json` hochladen.

Danach ist der alte Stand wieder aktiv. Die vorherige `data.json.old` kann später
gelöscht werden.
