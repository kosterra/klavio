import type { Localized } from '@klavio/shared';

/** The entry with the changes that are not released yet (shown as «Kommt bald»). */
export const UPCOMING = 'Next release';

export interface Release {
  /** {year}.{month}.{sequence}, or UPCOMING */
  version: string;
  /** a topic before the colon is shown in bold; a fix starts with «Korrektur: » / «Fix: » */
  changes: Localized[];
}

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

/**
 * What changed for learners and parents, newest first. New changes go into the
 * «Next release» entry on top; right before the pull request the version is
 * set (scripts/version.mjs) and that entry gets its number. A numbered entry
 * is never changed again (see .claude/skills/whats-new).
 */
export const CHANGELOG: Release[] = [
  {
    version: UPCOMING,
    changes: [
      L(
        'Eigene Stücke: Unter «Lieder» kannst du deine eigenen Noten als MusicXML-Datei importieren (aus MuseScore, Finale, Sibelius oder Dorico) – zum Üben wie ein Lied, mit Anhören und einer Hand allein, und zum Drucken im Klavio-Look.',
        'Own pieces: under «Songs» you can import your own notes as a MusicXML file (from MuseScore, Finale, Sibelius or Dorico) – to practise like a song, with listening and one hand alone, and to print in Klavio’s look.',
      ),
      L(
        'Erinnerung ans Üben: In «Mein Profil» kannst du dich auf diesem Gerät zur gewählten Zeit erinnern lassen – nur an Tagen, an denen du noch nicht gespielt hast. Auf iPhone und iPad geht das, wenn Klavio auf dem Home-Bildschirm installiert ist.',
        'Practice reminder: in «My profile» you can have this device remind you at a chosen time – only on days you have not played yet. On iPhone and iPad this works when Klavio is installed on the home screen.',
      ),
      L(
        'Wochenbericht für Eltern: Wer will, bekommt jeden Montag eine E-Mail mit der Klavier-Woche jedes Profils – Minuten, Übungstage, gespielte Lektionen und was als Nächstes kommt. Einschalten und abbestellen unter «Konto».',
        'Weekly report for parents: if you like, you get an e-mail every Monday with each profile’s piano week – minutes, practice days, lessons played and what comes next. Switch it on and off under «Account».',
      ),
      L(
        'Die E-Mail für «PIN vergessen?» sagt jetzt, wofür der Code ist, statt «zum Anmelden».',
        'The e-mail for «Forgot the PIN?» now says what the code is for, instead of «to sign in».',
      ),
      L(
        'Fingersätze: Lieder, bei denen die Hand wandern muss (zum Beispiel «Alle meine Entchen» oder «Bruder Jakob»), zeigen jetzt die Fingernummer genau dort, wo die Hand weiterrückt – in der Lektion und auf dem gedruckten Notenblatt.',
        'Fingering: songs where the hand has to move (for example «Alle meine Entchen» or «Frère Jacques») now show the finger number exactly where the hand moves on – in the lesson and on the printed sheet.',
      ),
      L(
        'Freies Spielen: «Aufnehmen» merkt sich, was du spielst – bis zu zwei Minuten –, und «Anhören» spielt es dir mit dem gewählten Klang vor. Gespeichert werden nur die Töne, nur auf diesem Gerät und nur bis du die Seite verlässt.',
        'Free play: «Record» remembers what you play – up to two minutes – and «Listen» plays it back with the chosen sound. Only the notes are kept, only on this device and only until you leave the page.',
      ),
      L(
        'Stücke für beide Hände: Übe zuerst eine Hand allein und nur ein paar Takte – die Übungsrunde beginnt immer wieder von vorn und zählt noch nicht für die Sterne. Anhören spielt dann auch nur, was du übst.',
        'Pieces for both hands: practise one hand alone and only a few bars first – the practice round starts over and over and does not count for the stars yet. Listening then plays only what you practise.',
      ),
      L(
        'Noten drucken: Jedes offene Lied gibt es jetzt als Notenblatt im Klavio-Look – mit Welt, Tempo, Notennamen und Fingersätzen nach Wahl, einem Übungstipp von Klavi und einer Woche zum Abhaken. Zum Üben am Klavier zu Hause oder für die Klavierstunde.',
        'Printing sheet music: every open song is now a sheet in Klavio’s look – with its world, tempo, note names and fingering as you like, a practice tip from Klavi and a week to tick off. For practising at the piano at home or for the piano lesson.',
      ),
      L(
        'Das Traumlied auf der Startseite lässt sich zuklappen: Dann siehst du nur noch Titel und Fortschritt. Klavio merkt sich, ob es offen ist.',
        'The dream song on the start page can be folded: then you only see its title and progress. Klavio remembers whether it is open.',
      ),
      L(
        'Für Eltern: Die Seite «Familie und Fortschritt» zeigt jetzt, wann jedes Kind zuletzt geübt hat, die Tage in Folge, die nächste Lektion mit Namen und welche Lektionen sich nochmals lohnen (bisher ein Stern).',
        'For parents: the «Family and progress» page now shows when each child last practised, the days in a row, the next lesson by name and which lessons are worth another go (one star so far).',
      ),
      L(
        'Nach einer Lektion steht, welche Töne noch knifflig waren – so weisst du, worauf du beim nächsten Mal achten kannst.',
        'After a lesson you see which notes were still tricky – so you know what to watch next time.',
      ),
      L(
        'Tage in Folge: Dass ein Tag Pause pro Woche erlaubt ist, steht jetzt immer dabei – und auch, wenn der Pausentag schon gebraucht ist. Die schnelle Runde zeigt am Schluss, wie viele Aufgaben beim ersten Versuch richtig waren, und das Metronom merkt sich Tempo und Takt.',
        'Days in a row: that one day off a week is fine is now always shown – and also when the day off has been used. The quick round shows at the end how many tasks were right at the first try, and the metronome remembers tempo and beats per bar.',
      ),
      L(
        'Korrektur: Auf dem Handy öffnet sich das Menü hinter der Figur oben rechts jetzt immer – auch wenn die Seite nach unten gescrollt ist; vorher sprang die Seite hin und her.',
        'Fix: on a phone the menu behind the figure at the top right now always opens – also when the page is scrolled down; before, the page jumped back and forth.',
      ),
      L(
        'Dunkles Farbschema: Der Lernpfad zeigt gesperrte Lektionen und den Weg in den Farben der Welt statt in Grau.',
        'Dark colour scheme: the learning path shows locked lessons and the road in the colours of the world instead of grey.',
      ),
      L(
        'Handy: Die Startseite ist kürzer – sie zeigt die neusten Abzeichen, alle findest du in «Mein Profil». Die Traumlied-Karte zeigt den nächsten Schritt zuerst und die Fähigkeiten auf Wunsch. Knöpfe und Auswahlen werden nicht mehr abgeschnitten, und das X von Fenstern ist grösser.',
        'Phone: the start page is shorter – it shows the latest badges, all of them are in «My profile». The dream song card shows the next step first and the skills on request. Buttons and choices are no longer cut off, and the X of dialogs is bigger.',
      ),
      L(
        'Metronom: jetzt als dritter Reiter unter «Spielen», mit Start gleich unter dem Tempo und Knöpfen für 5 Schläge langsamer oder schneller.',
        'Metronome: now the third tab under «Play», with Start right under the tempo and buttons for 5 beats slower or faster.',
      ),
      L(
        'Gleiche Namen überall: «Lernpfad», «Elternbereich» und «Mikrofon und MIDI» heissen im Menü und auf der Seite gleich; die Seitenleiste ordnet Lernen und Spielen getrennt.',
        'The same names everywhere: «Learning path», «Parent area» and «Microphone and MIDI» are called the same in the menu and on the page; the side bar groups learning and playing separately.',
      ),
      L(
        'Mikrofon einrichten geht jetzt ohne Eltern-PIN – wie versprochen – und führt danach zurück, wo du warst, zum Beispiel in die Lektion. Steht doch einmal die PIN-Abfrage im Weg, bringt dich «Zurück» weiter.',
        'Setting up the microphone now works without the parent PIN – as promised – and takes you back where you were afterwards, for example into the lesson. If the PIN prompt is ever in the way, «Back» gets you on.',
      ),
      L(
        'Nicht aus Versehen aufhören: Das X während einer Lektion oder der schnellen Runde fragt jetzt «Wirklich aufhören?», und «Abmelden» fragt auch – mit einer Warnung, wenn noch Ergebnisse auf die Übertragung warten.',
        'No stopping by mistake: the X during a lesson or the quick round now asks «Stop now?», and «Sign out» asks too – with a warning when results are still waiting to be sent.',
      ),
      L(
        'Korrektur: Die Traumlied-Karte führt nur noch zu Lektionen, die schon offen sind; liegt die passende noch weiter vorne, steht dabei, wann sie kommt.',
        'Fix: the dream song card only leads to lessons that are already open; if the right one is further ahead, it says when it comes.',
      ),
      L(
        'Korrektur: Wer beim Start Kapitel übersprungen hat, bekommt beim ersten richtigen Spielen einer übersprungenen Lektion die vollen XP, und Abzeichen gibt es nur für wirklich gespielte Kapitel. Fertige Lektionen bleiben offen, auch wenn später eine neue Lektion davor dazukommt.',
        'Fix: whoever skipped chapters at the start gets the full XP when really playing a skipped lesson for the first time, and badges only come for chapters really played. Finished lessons stay open, even when a new lesson is added before them later.',
      ),
      L(
        'Korrektur: Ist der Server kurz nicht erreichbar, wirst du nicht mehr abgemeldet – Klavio lernt weiter mit dem, was auf dem Gerät ist, und überträgt Ergebnisse, sobald der Server wieder da ist. Eine Lektion wird erst nach den vorher gespielten gespeichert, ein doppelt gesendetes Ergebnis zählt nur einmal, und ein Profilwechsel ohne Internet gilt auch auf dem Server.',
        'Fix: when the server is briefly unreachable you are no longer signed out – Klavio keeps going with what is on the device and sends results once the server is back. A lesson is saved only after the ones played before it, a result sent twice counts once, and switching profile without internet also reaches the server.',
      ),
      L(
        'Korrektur: Lädt der Fortschritt nicht, zeigt Klavi das jetzt mit «Nochmals versuchen» an – statt endlos zu laden. Wurde das Profil auf einem anderen Gerät gelöscht, geht es zur Profilwahl.',
        'Fix: if the progress does not load, Klavi now says so with «Try again» – instead of loading forever. If the profile was deleted on another device, you get to the profile picker.',
      ),
      L(
        'Angemeldet bleiben: Wer Klavio benutzt, bleibt angemeldet – neu anmelden erst nach 60 Tagen ohne Benutzung. Läuft die Anmeldung doch einmal während einer Lektion ab, bleibt das Ergebnis auf dem Gerät und wird nach der Anmeldung übertragen.',
        'Staying signed in: whoever uses Klavio stays signed in – signing in again only after 60 days without use. If the sign-in still runs out during a lesson, the result stays on the device and is sent after signing in.',
      ),
    ],
  },
  {
    version: '2026.11.3',
    changes: [
      L(
        'Datenschutz: Die Seite «Datenschutz» nennt jetzt alle gespeicherten Angaben (auch Wochenziel, Startfragen und Fehlversuche), der Daten-Download enthält zusätzlich die angemeldeten Geräte, und beim Abmelden werden auch die Einstellungen der Profile und noch nicht übertragene Ergebnisse vom Gerät gelöscht.',
        'Privacy: the privacy page now lists everything stored (including the weekly goal, start-up answers and failed attempts), the data download also contains the logged-in devices, and signing out also removes the profiles’ settings and results not sent yet from the device.',
      ),
      L(
        'Konto: «Auf allen anderen Geräten abmelden» – und wer die E-Mail-Adresse ändert, wird überall sonst abgemeldet; die alte Adresse bekommt eine Nachricht.',
        'Account: «Log out on all other devices» – and changing the e-mail address logs out everywhere else; the old address gets a notice.',
      ),
      L(
        'Fair üben: Dieselbe Lektion bringt beim Wiederholen einmal am Tag die halben Punkte, danach zählen nur noch bessere Sterne. Die Figur eines Geschwisters ändert man nur noch im Elternbereich.',
        'Fair practice: replaying the same lesson gives half the points once a day, after that only better stars count. A sibling’s figure can only be changed in the parent area.',
      ),
      L(
        'Sicherheit: Nach einer neuen Anmeldung bleibt der Elternbereich gesperrt, wenn eine PIN eingerichtet ist. Wer die PIN vergessen hat, bekommt mit «PIN vergessen?» einen Code an die E-Mail-Adresse des Kontos. Falsche PINs und falsche E-Mail-Codes sperren nach einigen Versuchen für eine Weile – unabhängig davon, von wo sie kommen.',
        'Security: after a new login the parent area stays locked when a PIN is set. If you forgot the PIN, «PIN vergessen?» sends a code to the account’s e-mail address. Wrong PINs and wrong e-mail codes lock for a while after a few tries – wherever they come from.',
      ),
      L(
        'Korrektur: Ein ungültiges Datum kann eine Lektion nicht mehr unbrauchbar machen.',
        'Fix: an invalid date can no longer make a lesson unusable.',
      ),
      L(
        'Neue Startseite: Klavio auf dem Handy gleich oben, ein erstes Lied zum Ausprobieren, was Klavio kann (zuhören, mitspielen, Notenregen, Traumlied), die zwei Wege für Kinder und Erwachsene, ehrliche Zahlen – und die Anmeldung am Schluss, mit «Anmelden» oben rechts. Auf dem Handy ist sie gut ein Drittel kürzer.',
        'New start page: Klavio on a phone right at the top, a first song to try, what Klavio does (listening, playing along, note rain, dream song), the two ways for children and adults, honest numbers – and the login at the end, with «Anmelden» at the top right. On phones it is a good third shorter.',
      ),
      L(
        'Mehr Weihnachten: Ab dem ersten Advent ändert sich jeden Tag etwas – am 6. kommt der Samichlaus und lässt seinen Sack da, ein Rentier mit roter Nase schaut oben rechts herein, ein Schneemann schmilzt und ein neuer wird gebaut, es gibt Guetzli, einen Engel, den Schlitten, den Stern von Betlehem und an Heiligabend fliegt der Schlitten über den Himmel. Auch Kopfzeile, Logo und Navigation feiern mit: Tannengirlande, Zipfelmütze, Schnee und Glocken.',
        'More Christmas: from the first Sunday of Advent something changes every day – on the 6th Samichlaus comes and leaves his sack, a reindeer with a red nose peeks in at the top right, a snowman melts and a new one is built, there are Christmas biscuits, an angel, the sleigh, the star of Bethlehem, and on Christmas Eve the sleigh flies across the sky. The header, logo and navigation join in too: a fir garland, a Santa cap, snow and bells.',
      ),
      L(
        'Drei neue Welten: Jedes Kapitel hat jetzt seine eigene – neu sind der Takt-Zirkus, die Tonleiter-Wüste und der Konzert-Garten.',
        'Three new worlds: every chapter now has its own – new are the Beat Circus, the Scale Desert and the Concert Garden.',
      ),
      L(
        'Korrektur: Auf grösseren Handys überlappen die Kapitel-Überschriften im Lernpfad nicht mehr mit den Bildern der Welten, und die Stufen passen nebeneinander. In der Verwaltung nutzen die Zahlenfelder wieder die ganze Breite für ihre Erklärung.',
        'Fix: on larger phones the chapter headings on the learning path no longer overlap the world pictures, and the stages fit side by side. In the administration the number fields use the full width for their explanation again.',
      ),
      L(
        'Classic hat wieder Farbe: Der Hintergrund zeigt die Farbflächen und Noten wie bei Kids – nur leiser.',
        'Classic has colour again: the background shows the colour fields and notes like Kids – only quieter.',
      ),
      L(
        'Klavio als App: Auf dem Handy erscheint nach einem Moment ein Hinweis von unten – mit dem Installieren-Knopf des Browsers oder Schritt für Schritt für Safari und das Browser-Menü. «Später» fragt in einer Woche wieder, «Nicht mehr zeigen» nie mehr.',
        'Klavio as an app: on phones a hint slides up after a moment – with the browser’s install button, or step by step for Safari and the browser menu. «Later» asks again in a week, «Don’t show again» never.',
      ),
      L(
        'Wo spielst du? gilt jetzt auf allen Geräten: Die Wahl gehört zum Profil, nicht mehr zum Gerät.',
        'Where do you play? now applies on every device: the choice belongs to the profile, no longer to the device.',
      ),
      L(
        'Freies Spielen: Wer auf dem Klavier spielt, sieht keine Bildschirm-Tasten mehr – ein Tipp holt sie bei Bedarf. Auf dem Handy passt die Klaviatur jetzt ohne seitliches Wischen auf den Bildschirm; mit den Pfeilen wechselst du die Oktave, und bei Tönen vom Klavier wandert sie von selbst mit.',
        'Free play: if you play on the piano you no longer see the screen keys – one tap brings them when needed. On phones the keyboard now fits the screen without swiping sideways; the arrows change the octave, and with notes from the piano it follows by itself.',
      ),
    ],
  },
  {
    version: '2026.11.2',
    changes: [
      L(
        'Mehr Schritte mit beiden Händen: «Beide zugleich» (der gleiche Ton links und rechts), «Spiegelbild» (die Hände gehen auseinander und wieder zusammen) und «Halten und spielen» (links ein langer Ton, rechts die Melodie) – vor dem ersten Lied mit Begleitung.',
        'More steps with both hands: «Beide zugleich» (the same note left and right), «Spiegelbild» (the hands move apart and back together) and «Halten und spielen» (a long note on the left, the melody on the right) – before the first song with accompaniment.',
      ),
      L(
        'Abwechslung in den Lektionen: Viele Lektionen haben jetzt zwei Teile – zum Beispiel erst Noten lesen, dann ein kurzer Notenregen, oder erst Tasten finden, dann nachspielen. Oben siehst du, in welchem Teil du bist.',
        'Variety in the lessons: many lessons now have two parts – for example first reading notes, then a short note rain, or first finding keys, then playing along. At the top you see which part you are in.',
      ),
      L(
        'Notenregen ohne Ende: Unter «Spielen» regnet es Noten, bis drei gelandet sind – im Violinschlüssel, im Bassschlüssel oder in beiden, mit wenigen oder vielen Tönen. Es wird immer schneller, und dein Rekord wartet darauf, geschlagen zu werden.',
        'Endless note rain: under «Spielen» notes rain down until three have landed – in treble clef, bass clef or both, with few or many notes. It keeps getting faster, and your record is waiting to be beaten.',
      ),
      L(
        'Für Admins: «Festzeit ausprobieren» unter «Verwaltung» zeigt Advent, Weihnachten und Neujahr an einem Tag deiner Wahl – nur auf deinem Gerät.',
        'For admins: «Festzeit ausprobieren» under «Verwaltung» shows Advent, Christmas and New Year on a day of your choice – on your device only.',
      ),
      L(
        'Freies Spielen auf dem Klavier: Mit «Auf meinem Klavier spielen» hört Klavio über das Mikrofon zu, ein Digitalpiano ist einfach da. Jeder Ton leuchtet auf der Klaviatur auf, springt mit seinem Namen hervor und steht im Notensystem – dazu deine letzten Töne als kleine Spur.',
        'Free play on the piano: with «Play on my piano» Klavio listens through the microphone, a digital piano just works. Every note lights up on the keyboard, pops up with its name and appears on the staff – with your last notes as a little trail.',
      ),
      L(
        'Wo spielst du? In «Mein Profil» stellst du ein, ob die Lektionen zuerst das Klavier oder den Bildschirm anbieten – für jedes Profil auf diesem Gerät.',
        'Where do you play? In «Mein Profil» you choose whether lessons offer the piano or the screen first – for each profile on this device.',
      ),
      L(
        'Korrektur: Der Startknopf der Lektion schneidet auf schmalen Bildschirmen den Text nicht mehr ab.',
        'Fix: the lesson start button no longer cuts off its text on narrow screens.',
      ),
    ],
  },
  {
    version: '2026.11.1',
    changes: [
      L(
        'Advent bis Neujahr: Ab dem ersten Advent kommt jeden Tag ein Stück Weihnachten dazu – Adventskranz (jeden Sonntag eine Kerze mehr), Schnee, Zipfelmütze, Lichterkette, Christbaum, Geschenke und Stern. Nach Weihnachten Partyhut und Girlanden, an Silvester und Neujahr ein Feuerwerk. Ab dem 2. Januar ist alles wieder wie immer.',
        'Advent to New Year: from the first Sunday of Advent a piece of Christmas arrives every day – Advent wreath (one more candle every Sunday), snow, Santa cap, fairy lights, Christmas tree, presents and star. After Christmas a party hat and streamers, fireworks on New Year’s Eve and New Year’s Day. From 2 January everything is as usual again.',
      ),
      L(
        'Mehr Musik auf dem Weg: «Hot Cross Buns» schon im ersten Kapitel, «Au clair de la lune» zum Notenlesen, das «Menuett in G» bei den Tonarten und zum Schluss ein Abschlusskonzert – Beethovens «Freude» ganz, mit Wechselbass. Alles als Bonus, niemand wird aufgehalten.',
        'More music along the way: “Hot Cross Buns” already in the first chapter, “Au clair de la lune” for reading notes, the “Minuet in G” with the keys and at the end a final concert – Beethoven’s “Ode to Joy” in full, with alternating bass. All as bonus lessons, nobody is held up.',
      ),
      L(
        'Tempostufen «Im Takt»: Langsam, Mittel oder Originaltempo – wie bei einer Klavierlehrerin zuerst langsam, dann schneller.',
        'Tempo levels “In time”: slow, medium or original tempo – like with a piano teacher, slowly first, then faster.',
      ),
      L(
        'Stücke für Erwachsene: Auf der Reise spielst du statt Kinderliedern bekannte Stücke mit den gleichen Tönen – Griegs «Morgenstimmung», Dvořáks «Going Home», Mozarts «Ah, vous dirai-je, Maman» und Beethovens «Freude» in der linken Hand. Fortschritt und Sterne bleiben, wie sie sind.',
        'Pieces for grown-ups: on the journey you play well-known pieces with the same notes instead of children’s songs – Grieg’s “Morning Mood”, Dvořák’s “Going Home”, Mozart’s “Ah, vous dirai-je, Maman” and Beethoven’s “Ode to Joy” in the left hand. Progress and stars stay as they are.',
      ),
      L(
        'Notenregen: Noten fallen vom Himmel, und du spielst jede, bevor sie landet. Je länger du durchhältst, desto schneller regnet es. Als Bonus-Lektion im Violinschlüssel (Kapitel 3) und im Bassschlüssel (Kapitel 6).',
        'Note rain: notes fall from the sky and you play each one before it lands. The longer you keep going, the faster it rains. As a bonus lesson in the treble clef (chapter 3) and the bass clef (chapter 6).',
      ),
      L(
        'Klavi spielt mit: Zu deinen Liedern spielt Klavi Bass und Akkorde – beim Anhören, im Takt und Schritt für Schritt, sobald du einen neuen Akkord erreichst. So klingt schon «Hänschen klein» nach richtiger Musik. Mit dem Mikrofon am besten mit Kopfhörern; ein Schalter stellt es ab.',
        'Klavi plays along: with your songs Klavi plays bass and chords – when listening, in time and step by step whenever you reach a new chord. So even «Hänschen klein» sounds like real music. With the microphone best with headphones; a switch turns it off.',
      ),
      L(
        'Deine Reise in vier Etappen: Oben wartet dein Traumlied als Gipfel, darunter Aufbruch, Durststrecke, Aufstieg und Gipfelsturm. Jede Etappe sagt, was du danach spielst, die Durststrecke kündigt sich ehrlich an – mit dem, was dir hilft – und mit deinem Wochenziel rechnet Klavio aus, wann du ungefähr oben bist.',
        'Your journey in four stages: your dream song waits as the summit on top, below it setting out, the hard stretch, the climb and the summit push. Each stage says what you’ll play afterwards, the hard stretch is announced honestly – with what helps – and with your weekly goal Klavio works out roughly when you’ll reach the top.',
      ),
      L(
        'Bühnenlicht in den Lektionen: Entdecken, Start und Ergebnis in Klavios Farben wie auf der Startseite, beim Spielen ein ruhiges Licht, damit Tasten und Noten im Vordergrund stehen. Der Fortschrittsbalken zählt jetzt auch das Entdecken.',
        'Stage lighting in lessons: Discover, start and result in Klavio’s colours like the public page, a calm light while playing so keys and notes stand out. The progress bar now counts Discover too.',
      ),
      L(
        'Lektionsstart: Klavio merkt sich, ob du auf dem Klavier oder auf dem Bildschirm spielst – aus den Startfragen oder vom letzten Mal. Ein grosser Knopf startet, ein kleiner Link wechselt.',
        'Lesson start: Klavio remembers whether you play on the piano or on the screen – from the start-up questions or from last time. One big button starts, a small link switches.',
      ),
      L(
        'Lektionen in Classic: ein ruhiger Hintergrund in der Farbe des Kapitels, der Name der Lektion steht oben im «Entdecken», und kurze Antworten wie Zahlen oder Notennamen sind grosse Felder zum Antippen.',
        'Lessons in Classic: a quiet background in the chapter colour, the lesson name at the top of «Discover», and short answers such as numbers or note names are big tiles to tap.',
      ),
      L(
        'Korrektur: Die Fragen «Und diese?» in den Übungen sagen jetzt ganz, wonach sie fragen – zum Beispiel «Und welche Nummer hat dieser Finger?».',
        'Fix: the questions «And this one?» in the exercises now say in full what they ask – for example «And which number is this finger?».',
      ),
      L(
        'Klavi erklärt mitten in der Übung: Wo etwas Neues kommt, steht in der ersten Übung ein kurzer Tipp direkt über den Tasten.',
        'Klavi explains in the middle of the exercise: where something new comes up, a short tip sits right above the keys in the first exercise.',
      ),
      L(
        'So liegt deine Hand: Vor Lektionen mit fester Handlage zeigt eine gezeichnete Hand, welcher Finger auf welche Taste gehört.',
        'This is where your hand goes: before lessons with a fixed hand position, a drawn hand shows which finger belongs on which key.',
      ),
      L(
        'Neu im Menü: «Lieder» – alle Lieder an einem Ort, die offenen zum Nochmals-Spielen.',
        'New in the menu: «Songs» – every song in one place, the open ones to play again.',
      ),
      L(
        'Lernpfad: Eigene Zeichen für Hören, Akkorde und Ausdruck, und unter dem Pfad erklärt «Was bedeuten die Zeichen?» alle Lektionsarten.',
        'Learning path: own symbols for listening, chords and expression, and below the path «What do the symbols mean?» explains every kind of lesson.',
      ),
      L(
        'Guter Start: Ein neues Profil beginnt mit ein paar kurzen Fragen – worauf du spielst (Klavier, Digitalpiano oder Bildschirm), was du am liebsten möchtest, dein Traumlied, wie oft du üben möchtest und ob du schon Noten lesen kannst. Wer schon spielt, beginnt gleich beim passenden Kapitel. Jede Frage lässt sich überspringen.',
        'A good start: a new profile begins with a few short questions – what you play on (piano, digital piano or screen), what you would like most, your dream song, how often you want to practise and whether you can already read music. If you already play, you start right at the matching chapter. Every question can be skipped.',
      ),
      L(
        'Wochenziel: Statt nur Tage in Folge zählt jetzt auch, an wie vielen Tagen pro Woche du übst. Die Startseite zeigt deine Woche, in «Mein Profil» stellst du das Ziel ein.',
        'Weekly goal: besides days in a row, Klavio now counts on how many days a week you practise. The home page shows your week; set the goal in «My profile».',
      ),
      L(
        'Traumlied: Beliebte Stücke wie «Für Elise» oder «Canon in D» lassen sich mit einem Tipp wählen.',
        'Dream song: popular pieces like «Für Elise» or «Canon in D» can be chosen with one tap.',
      ),
      L(
        'Hören und Erfinden: In «Hör zu und spiel nach» spielt Klavi ein paar Töne vor, du spielst sie nach Gehör nach. Dazu «Erfinden auf den weissen Tasten» zu einer Begleitung in C. Alles als Bonus-Lektionen – sie halten niemanden auf.',
        'Listening and making up: in «Listen and play back» Klavi plays a few notes and you play them back by ear. Plus «Making up music on the white keys» over an accompaniment in C. All as bonus lessons – they hold nobody up.',
      ),
      L(
        'Mehr Musik: der Sechsachteltakt (das Metronom zählt Achtel), die a-Moll-Tonleiter mit Hörspiel «Dur oder Moll?», «Laut und leise» und «Das Pedal» – mit einem Digitalpiano prüft Klavio auch, wie fest du drückst und ob das Pedal unten ist. Damit lassen sich jetzt alle Fähigkeiten für das Traumlied lernen.',
        'More music: six-eight time (the metronome counts eighths), the A minor scale with the listening game «Major or minor?», «Loud and soft» and «The pedal» – with a digital piano Klavio also checks how hard you press and whether the pedal is down. Every skill for the dream song can now be learned.',
      ),
      L(
        'Auftakt und Haltebogen: «Happy Birthday» im Dreivierteltakt beginnt vor dem ersten «eins», und in «Haltebögen» hältst du verbundene Noten einfach weiter. «Im Takt» zählt beides richtig.',
        'Upbeat and ties: «Happy Birthday» in three-four time starts before the first «one», and in «Ties» you simply keep holding tied notes. «In time» counts both correctly.',
      ),
      L(
        'Neues Kapitel «Begleiten» (Stufe 3): «Hänschen klein» mit Wechselbass, gebrochene Akkorde und die Akkorde C, F und G. Mit einem Digitalpiano müssen alle drei Töne zusammen klingen.',
        'New chapter «Accompanying» (level 3): «Little Hans» with an alternating bass, broken chords and the chords C, F and G. With a digital piano all three notes have to sound together.',
      ),
      L(
        'Neues Kapitel «Tonarten» (Stufe 3): das ♭ und das Auflösungszeichen ♮, die Tonleitern G-Dur und F-Dur mit Fingersatz und Notenlesen mit Vorzeichen am Zeilenanfang.',
        'New chapter «Keys» (level 3): the flat ♭ and the natural sign ♮, the G major and F major scales with fingering, and reading with a key signature at the start of the line.',
      ),
      L(
        'Neues zum Entdecken: wie du gut am Klavier sitzt, gebunden und kurz spielen (legato, staccato), laut und leise (forte, piano) mit Hörspielen, die punktierte Viertel zum Mitklatschen – und Erklärungen zu Achteln und zum Walzer.',
        'More to discover: how to sit well at the piano, playing connected and short (legato, staccato), loud and soft (forte, piano) with listening games, the dotted quarter to tap along – and explanations of eighths and the waltz.',
      ),
      L(
        'Lieder «Im Takt»: Nach dem Kennenlernen spielst du jedes Lied nochmals – mit Einzählen und Metronom. Jetzt zählt auch, ob der Ton zur richtigen Zeit kommt.',
        'Songs «In time»: after getting to know a song, you play it once more – with a count-in and the metronome. Now it also counts whether each note comes at the right time.',
      ),
      L(
        'Fingersatz: Über den Noten und auf der markierten Taste steht, welcher Finger spielt – in den Fünf-Finger-Lektionen, bei der C-Dur-Tonleiter (Daumen untersetzen!) und in den ersten Liedern.',
        'Fingering: above the notes and on the marked key it shows which finger plays – in the five-finger lessons, in the C major scale (thumb under!) and in the first songs.',
      ),
      L(
        'Vor jeder Lektion fragt Klavio: «Auf meinem Klavier» oder «Auf dem Bildschirm»? Mit einem Digitalpiano geht es mit der ersten Taste los. Während der Lektion zeigt «Ich höre: E», dass dein Ton angekommen ist.',
        'Before each lesson Klavio asks: «On my piano» or «On the screen»? With a digital piano the first key starts the lesson. During the lesson «I hear: E» shows that your note arrived.',
      ),
      L(
        'Traumlied: Bei jeder Fähigkeit steht, in welchem Kapitel du sie lernst. Mit «Die Reise» zeigt die Karte des Traumlieds auch das Höhenprofil – im Stil des Lernpfads.',
        'Dream song: every skill shows the chapter where you learn it. With «The journey» the dream song card also shows the elevation profile – in the style of the learning path.',
      ),
      L(
        'Neues Kapitel «Neue Rhythmen» (Stufe 3): Achtelnoten und der Dreivierteltakt.',
        'New chapter «New rhythms» (level 3): eighth notes and three-four time.',
      ),
      L(
        'Bonus-Lieder: «Bruder Jakob», «Jingle Bells» und «Old MacDonald» – sie öffnen sich mit den ersten Liedern und halten niemanden auf.',
        'Bonus songs: «Brother John», «Jingle Bells» and «Old MacDonald» – they open with the first songs and hold nobody up.',
      ),
      L(
        'Freies Spielen: ohne Aufgabe auf der Bildschirm-Klaviatur, mit Klavier, Spieluhr, Marimba oder Orgel.',
        'Free play: no task, just the screen keyboard, with piano, music box, marimba or organ.',
      ),
      L(
        'Kleiderschrank: Mit jedem Level gibt es ein neues Stück für deine Figur – Zipfelmütze, Schleife, Brille, Schal, Kopfhörer und Krone.',
        'Wardrobe: every level brings a new piece for your figure – pointy hat, bow, glasses, scarf, headphones and crown.',
      ),
      L(
        'Eine ganze Welt geschafft? Das wird jetzt gefeiert – und das Tor zur nächsten Welt geht auf.',
        'Finished a whole world? That is now celebrated – and the gate to the next world opens.',
      ),
      L(
        'Ein freier Tag pro Woche: Wer einen Tag auslässt, behält seine Serie trotzdem.',
        'One free day per week: skipping a day no longer ends your streak.',
      ),
      L(
        'Für Eltern: «Familie und Fortschritt» zeigt jedes Profil mit Lektionen, Sternen und Übungsminuten der letzten acht Wochen. Unter «Mein Profil» siehst du deinen eigenen Verlauf.',
        'For parents: «Family and progress» shows every profile with lessons, stars and minutes practised over the last eight weeks. «My profile» shows your own history.',
      ),
      L(
        'Für Erwachsene: «Ich kann schon …» – auf dem Lernpfad später einsteigen. Dazu ein Metronom mit Tempo tippen, und am Gipfel steht ehrlich, wie es mit dem Traumlied weitergeht.',
        'For adults: «I can already …» – join the learning path later. Plus a metronome with tap tempo, and the summit says honestly how to go on with your dream song.',
      ),
      L(
        'Deine Daten: Unter «Konto» lässt sich alles herunterladen, was über dein Konto gespeichert ist. Admins können lange unbenutzte Konten nach einer Warnung löschen lassen und die Instanz vor Suchmaschinen verbergen.',
        'Your data: under «Account» you can download everything stored about your account. Admins can have long-unused accounts deleted after a warning and hide the instance from search engines.',
      ),
      L(
        'Auf dem Handy: eine Leiste unten für Lernen, Spielen, Wissen und Profil; ein kürzeres Formular für neue Profile; Noten und Klaviatur nebeneinander, wenn das Handy quer liegt; ein kurzes Brummen bei richtig und falsch.',
        'On phones: a bar at the bottom for learn, play, knowledge and profile; a shorter form for new profiles; notes and keyboard side by side with the phone sideways; a short buzz for right and wrong.',
      ),
      L(
        'Die Startseite zeigt jetzt, wie Klavio aussieht, was es kostet (nichts) und wie Familien und Schulen es selbst betreiben.',
        'The start page now shows what Klavio looks like, what it costs (nothing) and how families and schools run it themselves.',
      ),
      L(
        'Neue Welt «Die Reise»: von der Alp hinunter durch Tobel, Schlucht und Stollen bis in die Hölle, das schwerste Kapitel, und dann hinauf über den Gipfelgrat zum Traumlied. Ein Höhenprofil zeigt, wo du gerade bist. Ab einem Alter, das Admins einstellen (Standard 12), wählt jedes Profil zwischen den bunten Welten und der Reise.',
        'New world «The journey»: from the alp down through ravine, gorge and mine into hell, the hardest chapter, and then up over the summit ridge to the dream song. An elevation profile shows where you are. From an age admins set (12 by default), every profile chooses between the colourful worlds and the journey.',
      ),
      L(
        'E-Mails im Klavio-Look: Die Codes kommen jetzt in einer gestalteten E-Mail mit Logo und Klavi, in der Sprache, in der du Klavio nutzt. Admins können die Texte auf Deutsch und Englisch anpassen, mit Vorschau und Test-E-Mail.',
        'E-mails in Klavio’s look: codes now arrive in a designed e-mail with the logo and Klavi, in the language you use Klavio in. Admins can change the texts in German and English, with a preview and a test e-mail.',
      ),
      L(
        'Datenschutz: Eine eigene Seite erklärt in einfachen Worten, welche Daten wo liegen und wie du sie löschst. Admins tragen ein, wer die Instanz betreibt und wie man sie erreicht.',
        'Privacy: a page of its own explains in plain words which data is kept where and how you delete it. Admins fill in who runs the instance and how to reach them.',
      ),
      L(
        'Profile fragen nach dem Geburtsjahr (nur das Jahr, kein Datum) – so bietet Klavio die passenden Welten an. Bestehende Profile behalten ihre Welt, bis das Jahr eingetragen ist.',
        'Profiles ask for the year of birth (just the year, no date) – so Klavio offers the right worlds. Existing profiles keep their world until the year is filled in.',
      ),
      L(
        'Neue Fusszeile mit Datenschutz, Was ist neu, Kontakt, Quellcode, Fehler melden und Lizenz – auf allen Seiten.',
        'New footer with privacy, what’s new, contact, source code, problem reports and licence – on every page.',
      ),
      L(
        'Korrektur: Auf dem Handy lässt sich die Seite über der Klaviatur wieder scrollen, ohne dass dabei Tasten gespielt werden. Eine Taste spielt beim Antippen; zum Wischen über die Tasten verschiebt sich die Klaviatur.',
        'Fix: on phones the page scrolls over the keyboard again without playing keys. A key plays when tapped; swiping across the keys moves the keyboard.',
      ),
      L(
        'Handy und Tablet zuerst: In Lektionen bleibt die Klaviatur unten am Bildschirm, mit Tasten in Fingergrösse – auch quer gehalten. Dialoge füllen auf dem Handy den Bildschirm, Knöpfe und Schalter werden nicht mehr abgeschnitten.',
        'Phone and tablet first: in lessons the keyboard stays at the bottom of the screen, with finger-sized keys – also held sideways. Dialogs fill the screen on phones; buttons and switches are no longer cut off.',
      ),
      L(
        'Auf dem Handy schlägt Klavio vor, sich als App zu installieren – auch in Browsern ohne eigenen Installieren-Knopf.',
        'On phones Klavio suggests installing it as an app – also in browsers without an install button of their own.',
      ),
    ],
  },
  {
    version: '2026.11.0',
    changes: [
      L(
        'Klavi liest vor: Aufgaben und Erklärungen auf Knopfdruck oder ganz von selbst – für Kinder, die noch nicht lesen können. Die Stimme kommt von deinem Gerät; ein- und ausschalten unter «Mein Profil».',
        'Klavi reads aloud: tasks and explanations at the tap of a button or all by itself – for children who can’t read yet. The voice comes from your device; switch it on or off under “My profile”.',
      ),
      L(
        'Klavio spricht Englisch: Die Sprache lässt sich auf der Startseite und im Menü umschalten.',
        'Klavio speaks English: switch the language on the start page or in the menu.',
      ),
      L(
        'Was ist neu: Diese Seite zeigt, was sich in Klavio ändert – Version für Version.',
        'What’s new: this page shows what changes in Klavio – version by version.',
      ),
      L(
        'Elternbereich: Eltern öffnen ihn auf Wunsch auch mit einem Passkey statt mit der PIN – einschalten unter «Konto» → «Elternbereich». Die Einrichtung von Mikrofon und Digitalpiano gehört jetzt zum Elternbereich.',
        'Parent area: parents can also open it with a passkey instead of the PIN – switch it on under “Account” → “Parent area”. Setting up the microphone and digital piano now belongs to the parent area.',
      ),
      L(
        'Korrektur: «Zum Lernpfad» wird auf dem Ergebnis-Bildschirm nicht mehr abgeschnitten.',
        'Fix: “To the learning path” on the result screen is no longer cut off.',
      ),
      L(
        'Geteilte Links: Ein Link zu Klavio zeigt in Nachrichten-Apps jetzt Titel, Beschreibung und ein Bild der Welten.',
        'Shared links: a link to Klavio now shows a title, a description and a picture of the worlds in messaging apps.',
      ),
    ],
  },
  {
    version: '0.1.0',
    changes: [
      L(
        'Lernpfad: acht Welten in zwei Stufen – vom Tasten-Tal bis zur Sternen-Nacht, mit Bass-Höhle, Brücken-Stadt und Stücken für beide Hände.',
        'Learning path: eight worlds on two levels – from Key Valley to Starry Night, with Bass Cave, Bridge Town and pieces for both hands.',
      ),
      L(
        'Am echten Klavier: Klavio hört über das Mikrofon zu, nimmt ein Digitalpiano per MIDI oder lässt dich auf der Bildschirm-Klaviatur spielen. Audio bleibt auf dem Gerät.',
        'On a real piano: Klavio listens through the microphone, takes a digital piano over MIDI or lets you play on the screen keyboard. Audio stays on the device.',
      ),
      L(
        'Entdecken: vor jeder Lektion eine kurze Erklärung mit Bildern, Spielen und Quiz; alles Gelernte unter «Wissen».',
        'Discover: a short explanation with pictures, games and quizzes before each lesson; everything learned under “Knowledge”.',
      ),
      L(
        'Wiederholen wie mit Lernkarten: Gespielte Lektionen kommen nach 1, 3, 7, 14 und 30 Tagen wieder, mit Bonus-XP, der «Schnellen Runde» und eigenen Medaillen.',
        'Review like flash cards: lessons come back after 1, 3, 7, 14 and 30 days, with bonus XP, the “Quick round” and medals of their own.',
      ),
      L(
        'Mein Traumlied: Erwachsene wählen das Lied, das sie einmal spielen möchten – Klavio erkennt es, zeigt die nötigen Fähigkeiten und wie nah man ihm schon ist.',
        'My dream song: adults pick the song they’d like to play one day – Klavio recognises it, shows the skills it needs and how close you already are.',
      ),
      L(
        'Für die ganze Familie: mehrere Profile, Kids- und Classic-Darstellung, dunkles Farbschema, Eltern-PIN und Anmeldung mit Passkey oder E-Mail-Code.',
        'For the whole family: several profiles, Kids and Classic view, a dark colour scheme, a parent PIN and sign-in with a passkey or e-mail code.',
      ),
    ],
  },
];

/** The release build of main has no «Next release»: everything in it is out. */
export const RELEASES: Release[] = __APP_RELEASED__
  ? CHANGELOG.filter((r) => r.version !== UPCOMING)
  : CHANGELOG;

/** A fix starts with «Korrektur: » (German) or «Fix: » (English). */
export const FIX = /^(Korrektur|Fix):\s+/;

export function isFix(text: string) {
  return FIX.test(text);
}
