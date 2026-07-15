# FAQ

### Warum will OZBoost Admin-Rechte?

Fast alle Tweaks schreiben HKLM-Registry-Keys oder Service-Einstellungen —
das geht nur elevated. OZBoost fragt **einmal beim Start** (UAC) statt bei
jedem einzelnen Tweak.

### Bringt mir das wirklich mehr FPS?

Kommt auf dein System an. Wenn dein PC schon optimal eingestellt ist: wenig.
Wenn VBS/Core Isolation aktiv ist, der Energieplan auf „Ausbalanciert" steht
und 40 Hintergrund-Apps laufen: spürbar. Unter **Home → Scannen** analysiert
OZBoost dein System und zeigt Score, Empfehlungen und das volle Boost-Paket.
Keine Fantasie-FPS-Zahlen.

### Ist das sicher? Kann ich alles rückgängig machen?

- Vor jeder Änderung wird ein Registry-Snapshot gespeichert.
- Fast jeder Tweak hat einen Revert-Schalter in der App.
- Über Settings → Backup erstellst du einen Windows-Wiederherstellungspunkt.

Ausnahme: Experimental-Tweaks (Defender/Firewall/Services) sind als riskant
markiert — die solltest du nur auf einer reinen Gaming-Kiste anfassen.

### Ein Tweak zeigt einen Fehler — was nun?

1. Schau in den Toast (Fehlertext) und in die Logdatei
   (`%APPDATA%/ozboost/logs/`, Pfad steht in Settings).
2. Häufigste Ursache: UAC abgelehnt oder ein Windows-Feature existiert auf
   deiner Windows-Version nicht (dann ist der Fehler harmlos).
3. Öffne ein GitHub-Issue mit der Log-Zeile, wenn es reproduzierbar ist.

### Warum öffnet sich nach „Optimieren" eine Windows-Einstellungs-Seite?

Manche Dinge lässt Windows nicht per Registry setzen (z.B. Core Isolation
umschalten). OZBoost öffnet dann die richtige Einstellungs-Seite, damit du
den einen Klick selbst machst.

### Ich habe Bloatware entfernt und will eine App zurück.

Microsoft Store öffnen und die App neu installieren — Standard-Apps sind
alle im Store. Für den Store selbst gibt es in der App eine
Wiederherstellen-Aktion.

### Läuft das auf Windows 10?

Zielplattform ist Windows 11. Vieles funktioniert auch auf Win10 22H2,
aber es wird nicht dagegen getestet.

### Sammelt OZBoost Daten?

Nein. Keine Telemetrie, keine Netzwerk-Calls außer den Downloads, die du
selbst anstößt (Tools/Treiber von offiziellen Seiten).
