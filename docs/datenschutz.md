# Datenschutz: Welche Daten wo liegen

Bestandsaufnahme für Betreiberinnen und Betreiber einer Klavio-Instanz – als Grundlage für die eigene
Datenschutzerklärung. Sie beschreibt, was die Software speichert; sie ist **keine Rechtsberatung** und
ersetzt keine Datenschutzerklärung.

## Grundsätze

- **Audio bleibt auf dem Gerät.** Die Tonerkennung läuft im Browser (AudioWorklet). Nur Zahlen wie
  Tonhöhe und Lautstärke verlassen die Analyse – und auch die nur innerhalb der Seite. Es gibt keine
  Aufnahme, keinen Upload, keine Speicherung von Audio. Die App sagt das sichtbar (Hinweis und Abzeichen
  im Kopf).
- **Vorlesen bleibt auf dem Gerät.** «Klavi liest vor» nutzt die Sprachausgabe des Browsers, aber nur
  Stimmen, die auf dem Gerät installiert sind (`localService`). Online-Stimmen, die den Text an einen
  Dienst schicken würden, verwendet Klavio nie; fehlt eine lokale Stimme, gibt es keinen Vorlese-Knopf.
- **So wenig wie möglich:** keine Geburtsdaten, kein Alter, kein Geschlecht, kein Standort, kein
  Tracking, keine Analyse- oder Werbedienste, keine Anfragen an fremde Server (Schriften und
  Notenschrift werden mitgeliefert).
- **Ein Konto pro Familie:** Erwachsene registrieren sich mit ihrer E-Mail-Adresse; Kinder bekommen
  Profile ohne eigene E-Mail-Adresse, der Name darf ein Spitzname sein.

## Auf dem Server (MongoDB)

| Daten                   | Inhalt                                                                                                                                                                                                                                                                                                                                                                                      | Zweck                                        | Löschung                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| **Konto**               | Anzeigename (frei wählbar, z. B. «Familie Muster»), bestätigte E-Mail-Adresse, zufällige WebAuthn-Kennung, Rolle (user/admin), HMAC der optionalen Eltern-PIN, Zeitpunkte von Erstellung/Änderung                                                                                                                                                                                           | Anmeldung, Wiederherstellung per E-Mail-Code | mit dem Konto                            |
| **Passkeys**            | öffentlicher Schlüssel, Credential-ID, Zähler, Transportwege, Gerätetyp, «synchronisiert ja/nein», Name des Anbieters (z. B. «iCloud-Schlüsselbund», umbenennbar), zuletzt verwendet                                                                                                                                                                                                        | Anmeldung ohne Passwort                      | einzeln unter «Konto» oder mit dem Konto |
| **Sessions**            | SHA-256 des Session-Tokens, Konto, aktives Profil, bis wann der Elternbereich offen ist, Ablaufzeit                                                                                                                                                                                                                                                                                         | angemeldet bleiben                           | automatisch nach 60 Tagen, beim Abmelden |
| **Profile**             | Name, Figur, Darstellung (Kids/Classic), Tagesziel, Mikrofon-Kalibrierung (Kammerton in Hz, Raumrauschpegel in dB), XP, Level, Streak (Zahlen und Datum des letzten Übungstags), Abzeichen mit Datum, optional ein «Traumlied» (nur Titel, Stil und gewünschte Fähigkeiten – keine Noten; das Lied wird lokal aus einer eingebauten Liste erkannt, der Titel geht an keinen anderen Dienst) | Lernen, Belohnungen, Motivation              | mit dem Profil oder Konto                |
| **Lektionsfortschritt** | je Profil und Lektion: beste Sterne, Anzahl Durchgänge, letzter Abschluss (Zeitpunkt und lokaler Tag), Wiederholungsstufe und Anzahl Wiederholungen                                                                                                                                                                                                                                         | Lernpfad, Freischaltung, Wiederholen         | mit dem Profil oder Konto                |
| **Übungstage**          | je Profil und Tag: Übungszeit in Sekunden, XP                                                                                                                                                                                                                                                                                                                                               | Tagesziel, Streak                            | mit dem Profil oder Konto                |
| E-Mail-Codes            | E-Mail-Adresse, HMAC des Codes, Anzahl Fehlversuche                                                                                                                                                                                                                                                                                                                                         | Anmeldung, Adressbestätigung                 | automatisch nach 10 Minuten              |
| WebAuthn-Challenges     | Zufallswert, bei «Passkey hinzufügen» das Konto                                                                                                                                                                                                                                                                                                                                             | Schutz vor Wiederholung                      | nach Gebrauch, spätestens nach 5 Minuten |
| Einstellungen           | «Registrierung offen»                                                                                                                                                                                                                                                                                                                                                                       | Betrieb                                      | –                                        |

**Nicht gespeichert:** Audio, einzelne gespielte Töne oder Versuche, Fehler im Detail (nur die Zahl
fliesst in die Sterne ein und wird nicht aufbewahrt), IP-Adressen, Browser- oder Gerätekennungen.

Das Feld `locale` im Konto ist für eine spätere Sprachwahl vorgesehen und steht derzeit auf dem
Standardwert. Die **Eltern-PIN** ist kein Passwort, sondern ein Schutz vor Kinderhänden; gespeichert
wird nur ein HMAC mit dem Server-Geheimnis, und Eingabeversuche sind auf 5 pro 5 Minuten begrenzt.

## In Logs und im Arbeitsspeicher

- **Server-Log:** pro Anfrage Methode, Pfad (enthält z. B. Lektions- oder Profil-IDs), Status und
  Dauer – **keine IP-Adressen**. Aufbewahrung über die Log-Rotation von Docker steuern
  (z. B. `logging: { driver: json-file, options: { max-size: 10m, max-file: '3' } }`).
- **Caddy** schreibt kein Zugriffsprotokoll.
- **Rate-Limits** halten IP-Adressen (und bei E-Mail-Codes die Adresse) nur im Arbeitsspeicher, für
  das jeweilige Zeitfenster von höchstens 10 Minuten.

## Auf dem Gerät

| Ort                  | Inhalt                                                                                     | Zweck                                    | Löschung                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Cookie `klavio_sid`  | zufälliges Session-Token (httpOnly, Secure, SameSite=Lax, nur für `/api`)                  | angemeldet bleiben                       | Abmelden, nach 60 Tagen                                      |
| Cookie `klavio_ch`   | zufälliges Token zur WebAuthn-Challenge                                                    | Passkey-Anmeldung                        | nach Gebrauch, spätestens nach 5 Minuten                     |
| `localStorage`       | letzter Stand von Konto (inkl. E-Mail-Adresse) und Profilen, Fortschritt je Profil         | Nutzung ohne Internet                    | beim Abmelden                                                |
| `localStorage`       | offline gespielte Ergebnisse (Lektions-ID, Fehlerzahl, Dauer, Datum, Konto- und Profil-ID) | spätere Übertragung                      | nach erfolgreicher Übertragung; ältere als 14 Tage verworfen |
| `localStorage`       | «Installationshinweis ausgeblendet»                                                        | Hinweis nicht erneut zeigen              | Browserdaten löschen                                         |
| `localStorage`       | je Profil-ID: «Mikrofon-Hinweis ausgeblendet», «Klavi liest vor» ein/aus                   | Hinweis nicht erneut zeigen              | Browserdaten löschen                                         |
| `localStorage`       | Farbschema, Sprache; je Profil-ID die Kapitel, deren «Nebel» sich schon gelichtet hat      | Einstellung, Animation nur einmal zeigen | Browserdaten löschen                                         |
| Service-Worker-Cache | nur die Dateien der App                                                                    | schneller Start, offline                 | Browserdaten löschen                                         |

Beide Cookies sind technisch notwendig; es gibt keine Tracking-Cookies. Mikrofon- und MIDI-Freigaben
verwaltet der Browser. Passkeys selbst (private Schlüssel, Fingerabdruck, Gesicht) bleiben im Gerät
bzw. im Passwort-Manager und erreichen den Server nie.

## Weitergabe an Dritte

- **SMTP-Anbieter:** bekommt die E-Mail-Adresse und den einmaligen Code jeder Anmelde- oder
  Bestätigungsmail.
- **Hosting:** der Betreiber des Servers.
- **Let's Encrypt:** sieht nur den Domainnamen (Zertifikat), keine Nutzerdaten.
- Synchronisierte Passkeys laufen über den Passwort-Manager des Nutzers (z. B. Apple, Google) –
  ausserhalb von Klavio.

Keine weiteren Empfänger: keine Analyse-, Werbe- oder Fehlerberichtsdienste, kein CDN.

## Rechte der Nutzer

- **Einsehen:** Konto, Passkeys, Profile, Fortschritt und Abzeichen sind in der App sichtbar.
- **Berichtigen:** Name des Kontos, E-Mail-Adresse (mit Bestätigung an die neue Adresse), Profile,
  Passkey-Namen – alles unter «Konto» bzw. auf der Profilwahl.
- **Löschen:**
  - Profil löschen entfernt Fortschritt, Übungstage und Abzeichen dieses Profils.
  - **Konto löschen** (unter «Konto») entfernt sofort Konto, Passkeys, Sessions, Profile, Fortschritt
    und Übungstage. Den Passkey im Passwort-Manager des Geräts entfernt der Nutzer selbst.
  - In Sicherungen bleiben Daten bis zu deren Ablauf; die Aufbewahrungsdauer legt der Betreiber fest.

## Hinweise für Betreiber

- Kinder nutzen die App über das Konto eines Erwachsenen; die E-Mail-Adresse gehört dem Erwachsenen.
  Mit der Eltern-PIN lässt sich verhindern, dass Kinder Konto, Profile oder Passkeys verändern.
- Je nach Land (z. B. revDSG in der Schweiz, DSGVO in der EU) eine Datenschutzerklärung bereitstellen
  und die Aufbewahrung von Sicherungen und Logs festlegen.
- Wer Fehlerberichte oder Statistiken ergänzen möchte, sollte das nur selbst gehostet und ohne
  personenbezogene Daten tun – und diese Übersicht anpassen.
