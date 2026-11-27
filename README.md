# KK Songbook

**[Download the offline songbook](https://github.com/krystofkomanec/zpevnik-kk/releases/latest/download/index.html)**

Open the downloaded `index.html` in your browser on a tablet, phone, or computer. The file includes the app and the song library. Once downloaded, it works offline.

## Playing songs

Search the library by song title or artist. On smaller screens, the menu button opens the library. Expand **Guitar chords** to see six-string chord shapes, including open and muted strings. Use the song controls to transpose or resize the text. The header lets you switch appearance and language. **English** shows songs with English lyrics, while **Čeština** shows the full collection. Both modes use Czech chord names (H and B).

Use **Sort by** to list titles alphabetically, by date added to the songbook, or by the original file date preserved in the downloaded ZIP. Date sorts show newest first. Missing dates appear last. Songs from the same import are ordered by title. Edits keep the original addition date.

Select **Play mode** to hide the controls. Landscape screens at least 700 pixels wide display two columns. Tap the screen edges or use the arrow keys to turn pages. Choose **Save** beside the transposition controls to remember the displayed offset for this song. Clicking the checked button clears it.

Long-press a line, right-click it, or focus it and press Enter to report a missing chord, a misplaced chord, or incorrect lyrics. Reports stay in this browser until you export them together from **Library tools → Export reports**. Send the exported JSON to share your corrections.

The [automatic arrangement checks](./ARRANGEMENT-CHECKS.md) run on every publication and link directly to lines that may need a correction.

## Moving song settings between devices

Under **Library tools**, choose **Export song settings**. Copy the downloaded JSON file to your other device and choose **Import song settings** there. This works offline. The backup includes saved capo frets and transpositions. Import merges settings per song: values in the file take precedence, and other saved values stay in place.

## Updating your library

Open **Library tools** and select **Check for updates** while online. The check compares your local data version with a small version file. If a newer library is available, select **Load latest songs**. The browser keeps the update for offline use. If direct loading is unavailable, follow the download link shown in the app and select the downloaded `library.json`. To update the app itself, download the latest HTML file above.

## Adding a song

1. Open the [PDF inbox](https://github.com/krystofkomanec/zpevnik-kk/upload/main/inbox). Upload one song per PDF, named `Artist - Title.pdf`. Adding files requires repository write access.
2. Commit the upload to `main`. The [publishing workflow](https://github.com/krystofkomanec/zpevnik-kk/actions/workflows/import.yml) extracts text or reads scanned pages with OCR, detects the language from the lyrics, aligns chords with lyrics, and publishes an updated library. Single-column sheets with chords above the lyrics work best.
3. After the workflow completes, check for updates in the app. Sheets awaiting conversion are listed in the [conversion overview](#conversion-overview) below. For a correction to an existing arrangement, edit its [ChordPro file](./ChordPro/) and commit the change. Review OCR transcriptions against the source, especially chord symbols and verse order.

Uploaded PDFs are stored in the repository and inherit its visibility.


## Library statistics

<!-- statistics:start -->
**601 songs** · 1 added · 259 revisions since tracking began.

```mermaid
pie showData
    title Library by lyrics language
    "English" : 138
    "Other or undetermined" : 463
```

The initial 600 arrangements form the baseline. Each subsequent entry records the author and date of the source commit.

### Published changes by month

```text
2026-11  ████████████████████████  1 added · 259 updated
```

| Date | Song | Change | Revision | Contributor |
|---|---|---|---:|---|
| 2026-11-27 | twenty one pilots – Drag Path | Updated | 2 | krystofkomanec |
| 2026-11-27 | Cage the Elephant – Come A Little Closer | Updated | 2 | krystofkomanec |
| 2026-11-27 | Bill Withers – Ain’t No Sunshine | Updated | 2 | krystofkomanec |
| 2026-11-27 | LEAP – Burnt Matches | Updated | 2 | krystofkomanec |
| 2026-11-27 | Mick Wingert – Spin the Wheel (bez kapodastru podle názvu) | Updated | 2 | krystofkomanec |
| 2026-11-27 | John Mayer – Slow Dancing in a Burning Room | Updated | 2 | krystofkomanec |
| 2026-11-27 | Alex Clare – Too Close | Updated | 2 | krystofkomanec |
| 2026-11-27 | Passenger – Let Her Go | Updated | 2 | krystofkomanec |
| 2026-11-27 | Glass Animals – Heat Waves | Updated | 2 | krystofkomanec |
| 2026-11-27 | Nirvana – Where Did You Sleep Last Night (Acoustic) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Eric Clapton – Wonderful Tonight | Updated | 2 | krystofkomanec |
| 2026-11-27 | twenty one pilots – Heathens | Updated | 2 | krystofkomanec |
| 2026-11-27 | The Rolling Stones – Wild Horses | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Braxatoris – Na Bíledni | Updated | 2 | krystofkomanec |
| 2026-11-27 | Green Day – Last Night On Earth | Updated | 2 | krystofkomanec |
| 2026-11-27 | A Great Big World feat. Christina Aguilera – Say Something | Updated | 2 | krystofkomanec |
| 2026-11-27 | Of Monsters and Men – Destroyer | Updated | 2 | krystofkomanec |
| 2026-11-27 | Simple Plan – Welcome To My Life | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Listen Up Acoustic | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jason Mraz – I Won’t Give Up | Updated | 2 | krystofkomanec |
| 2026-11-27 | Every Avenue – I Can’t Not Love You | Updated | 2 | krystofkomanec |
| 2026-11-27 | Keane – Dirt | Updated | 2 | krystofkomanec |
| 2026-11-27 | Nothing But Thieves – Sorry | Updated | 2 | krystofkomanec |
| 2026-11-27 | Steve Earle – The Galway Girl | Updated | 2 | krystofkomanec |
| 2026-11-27 | All Time Low – Dear Maria, Count Me In | Updated | 2 | krystofkomanec |
| 2026-11-27 | Richy Mitch &amp; The Coal Miners – BC, Victoria | Updated | 2 | krystofkomanec |
| 2026-11-27 | John Denver – Leaving On A Jet Plane | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ronan Keating – When You Say Nothing at All | Updated | 2 | krystofkomanec |
| 2026-11-27 | The High Kings – The Parting Glass | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Whatever | Updated | 2 | krystofkomanec |
| 2026-11-27 | MIG 21 – Hurá! | Updated | 2 | krystofkomanec |
| 2026-11-27 | Linkin Park – Lost | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Married With Children | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Vrať se | Updated | 2 | krystofkomanec |
| 2026-11-27 | Avril Lavigne – I’m With You (verze 2) | Updated | 2 | krystofkomanec |
| 2026-11-27 | All Time Low – Therapy | Updated | 2 | krystofkomanec |
| 2026-11-27 | Paolo Nutini – Through The Echoes | Updated | 2 | krystofkomanec |
| 2026-11-27 | Liam Gallagher – Once (verze 2) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Rybičky 48 – Klasický pomalý song | Updated | 2 | krystofkomanec |
| 2026-11-27 | The Script – It’s Not Right for You | Updated | 2 | krystofkomanec |
| 2026-11-27 | Cage the Elephant – Trouble | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ben E. King – Stand By Me | Updated | 2 | krystofkomanec |
| 2026-11-27 | No Doubt – Don’t Speak | Updated | 2 | krystofkomanec |
| 2026-11-27 | Amy Macdonald – This Is The Life | Updated | 2 | krystofkomanec |
| 2026-11-27 | Elton John – Your Song | Updated | 2 | krystofkomanec |
| 2026-11-27 | Neil Young – Heart Of Gold | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Láska Není | Updated | 2 | krystofkomanec |
| 2026-11-27 | Sheryl Crow – If It Makes You Happy | Updated | 2 | krystofkomanec |
| 2026-11-27 | Elán – Voda čo ma drží nad vodou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Champagne Supernova | Updated | 2 | krystofkomanec |
| 2026-11-27 | Chinaski – Schody | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Čaruj | Updated | 2 | krystofkomanec |
| 2026-11-27 | The Killers – Exitlude | Updated | 2 | krystofkomanec |
| 2026-11-27 | Wabi Ryvola – Bledá hvězda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Green Day – Good Riddance (Time of Your Life) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Goo Goo Dolls – Iris | Updated | 2 | krystofkomanec |
| 2026-11-27 | Weekend – Polední vlak | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Tady jsem doma | Updated | 3 | krystofkomanec |
| 2026-11-27 | Wanastowi Vjecy – Sbírka zvadlejch růží | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Vrány taky (lepší) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Donots &amp; Frank Turner – So Long | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Hrůza – Jsi má baletka, co tančí | Updated | 3 | krystofkomanec |
| 2026-11-27 | Wanastowi Vjecy – Slečna Anna je za vodou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Rybičky 48 – Slibuju že nebudu pít | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Plíhal – Květina | Updated | 2 | krystofkomanec |
| 2026-11-27 | Spirituál kvintet – Válka růží | Updated | 2 | krystofkomanec |
| 2026-11-27 | Biffy Clyro – Many Of Horror Acoustic | Updated | 2 | krystofkomanec |
| 2026-11-27 | Our Last Night – Sunrise | Updated | 2 | krystofkomanec |
| 2026-11-27 | Death Cab for Cutie – Fragments from the Decade | Updated | 2 | krystofkomanec |
| 2026-11-27 | Anna K. – Nebe | Updated | 2 | krystofkomanec |
| 2026-11-27 | Bob Dylan – Blowin’ in the Wind | Updated | 2 | krystofkomanec |
| 2026-11-27 | Eagles – Take It Easy | Updated | 2 | krystofkomanec |
| 2026-11-27 | Tomáš Klus – Nina | Updated | 2 | krystofkomanec |
| 2026-11-27 | Folk Team – Motýlí hra | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Kryl – Anděl | Updated | 2 | krystofkomanec |
| 2026-11-27 | Nickelback – How You Remind Me | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jaromír Nohavica – Mám jizvu na rtu | Updated | 2 | krystofkomanec |
| 2026-11-27 | Biffy Clyro – Space | Updated | 2 | krystofkomanec |
| 2026-11-27 | Queen – I Want It All | Updated | 2 | krystofkomanec |
| 2026-11-27 | Stu Larsen – San Francisco | Updated | 2 | krystofkomanec |
| 2026-11-27 | Buty – Normální den na frontě | Updated | 2 | krystofkomanec |
| 2026-11-27 | Marek Ztracený – Ztrácíš se | Updated | 2 | krystofkomanec |
| 2026-11-27 | Biffy Clyro – God And Satan | Updated | 2 | krystofkomanec |
| 2026-11-27 | Eagles – Tequila Sunrise | Updated | 2 | krystofkomanec |
| 2026-11-27 | Eagles – Hotel California | Updated | 2 | krystofkomanec |
| 2026-11-27 | Hana Zagorová – Málokdo ví | Updated | 3 | krystofkomanec |
| 2026-11-27 | Cage the Elephant – Cigarette Daydreams | Updated | 2 | krystofkomanec |
| 2026-11-27 | EARTH (Czech Republic) – Je Mi Fajn | Updated | 2 | krystofkomanec |
| 2026-11-27 | Spirituál kvintet – Z Betléma se ozývá | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ozzy Osbourne – Mama, I’m Coming Home | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ed Sheeran – I See Fire | Updated | 2 | krystofkomanec |
| 2026-11-27 | The Beatles – Yesterday | Updated | 2 | krystofkomanec |
| 2026-11-27 | Lady Gaga &amp; Bradley Cooper – Shallow | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Tučný – Cesty toulavý | Updated | 2 | krystofkomanec |
| 2026-11-27 | Matthew and the Atlas – I Will Remain | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Wonderwall | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Do ticha | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Tučný – Rád se brouzdám rosou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vladimír Mišík – Jednohubky | Updated | 3 | krystofkomanec |
| 2026-11-27 | Country – Život je jen náhoda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Žlutý pes – Sametová | Updated | 2 | krystofkomanec |
| 2026-11-27 | Elán – Zanedbaný sex (kapo 3) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Stop Crying Your Heart Out | Updated | 2 | krystofkomanec |
| 2026-11-27 | Lou Reed – Perfect Day | Updated | 2 | krystofkomanec |
| 2026-11-27 | Simon &amp; Garfunkel – Scarborough Fair | Updated | 2 | krystofkomanec |
| 2026-11-27 | Frank Sinatra – Fly Me To The Moon | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Odpočiň si, Sáro (verze 2) | Updated | 3 | krystofkomanec |
| 2026-11-27 | Norah Jones – Sunrise | Updated | 2 | krystofkomanec |
| 2026-11-27 | Pink Floyd – Comfortably Numb | Updated | 2 | krystofkomanec |
| 2026-11-27 | Poutníci – Wayfaring stranger | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Dívka ze severu | Updated | 3 | krystofkomanec |
| 2026-11-27 | All Time Low – Remembering Sunday | Updated | 2 | krystofkomanec |
| 2026-11-27 | John Lennon – Imagine | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vladimír Mišík – Stříhali dohola malého chlapečka | Updated | 3 | krystofkomanec |
| 2026-11-27 | Táborová klasika – Hledám děvče na neděli | Updated | 2 | krystofkomanec |
| 2026-11-27 | Cop – Pár minut | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jaroslav Uhlíř – Když se zamiluje kůň | Updated | 2 | krystofkomanec |
| 2026-11-27 | Janek Ledecký – Proklínám | Updated | 2 | krystofkomanec |
| 2026-11-27 | Voskovec, Werich a Ježek – Babička Mary | Updated | 2 | krystofkomanec |
| 2026-11-27 | Olympic – Želva | Updated | 2 | krystofkomanec |
| 2026-11-27 | Táborová klasika – Zelený pláně | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Proměny | Updated | 3 | krystofkomanec |
| 2026-11-27 | Bob Dylan – Knockin’ on Heaven’s Door | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Lano, co k nebi nás poutá | Updated | 3 | krystofkomanec |
| 2026-11-27 | Traband – Taková ženská | Updated | 3 | krystofkomanec |
| 2026-11-27 | Traband – V jejích šlépějích | Updated | 3 | krystofkomanec |
| 2026-11-27 | Traband – Vetřelec | Updated | 3 | krystofkomanec |
| 2026-11-27 | Jelen – Jelen | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Tučný – Sundej z hodin závaží | Updated | 2 | krystofkomanec |
| 2026-11-27 | Mňága &amp; Žďorp – Měsíc | Updated | 3 | krystofkomanec |
| 2026-11-27 | Jiří Suchý a Jiří Šlitr – Pramínek vlasů | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Kryl – Bratříčku, zavírej vrátka (verze 2) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Coldplay – Paradise | Updated | 2 | krystofkomanec |
| 2026-11-27 | Radiohead – Creep | Updated | 2 | krystofkomanec |
| 2026-11-27 | Kamelot – Fénix | Updated | 3 | krystofkomanec |
| 2026-11-27 | The Longest Johns – Wellerman | Updated | 2 | krystofkomanec |
| 2026-11-27 | Nirvana – The Man Who Sold The World | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Jericho | Updated | 2 | krystofkomanec |
| 2026-11-27 | Filmová Hudba Cz – Chodí horou 300 ovec | Updated | 3 | krystofkomanec |
| 2026-11-27 | Žalman – Tulácká ukolébavka | Updated | 2 | krystofkomanec |
| 2026-11-27 | Marta Kubišová – Nechte zvony znít | Updated | 2 | krystofkomanec |
| 2026-11-27 | Petr Lutka – Točí se točí | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vypsaná fixa – Robí Valentýn | Updated | 2 | krystofkomanec |
| 2026-11-27 | Hoboes – Tereza | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Vrány Taky | Updated | 2 | krystofkomanec |
| 2026-11-27 | David Stypka – Kříž (opraveno) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Plíhal – Vzpomínky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Spirituál kvintet – Širý proud | Updated | 2 | krystofkomanec |
| 2026-11-27 | Passenger – Simple Song | Updated | 2 | krystofkomanec |
| 2026-11-27 | Alestorm – Fucked With An Anchor | Updated | 2 | krystofkomanec |
| 2026-11-27 | Tenacious D – Beelzeboss | Updated | 2 | krystofkomanec |
| 2026-11-27 | Petr Skoumal – Když jde malý bobr spát | Updated | 2 | krystofkomanec |
| 2026-11-27 | Bear&#x27;s Den – Sophie | Updated | 2 | krystofkomanec |
| 2026-11-27 | Oasis – Stand By Me Acoustic | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ag Flek – Carpe diem | Updated | 2 | krystofkomanec |
| 2026-11-27 | Lidové písně – Na kopečku stála | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Ještě není tma | Updated | 3 | krystofkomanec |
| 2026-11-27 | Jára Cimrman – Píseň Proti Trudomyslnosti | Updated | 2 | krystofkomanec |
| 2026-11-27 | Záviš – Čepice | Updated | 3 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Až si jednou | Updated | 3 | krystofkomanec |
| 2026-11-27 | Záviš – Cukrářská | Updated | 3 | krystofkomanec |
| 2026-11-27 | Javory – Javory | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jaromír Nohavica – Jdou po mně jdou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Spirituál kvintet – Za svou pravdou stát | Updated | 2 | krystofkomanec |
| 2026-11-27 | Monty Python – Always look on the bright Side of Life | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Pět prstů | Updated | 3 | krystofkomanec |
| 2026-11-27 | Traband – Žižkovská romance | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Tučný – Rovnou, tady rovnou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Kryl – Karavana mraků | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vojta Kiďák Tomáško – Toulavej | Updated | 2 | krystofkomanec |
| 2026-11-27 | Táborové písně – Řekni, kde ty kytky jsou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Spirituál kvintet – Tisíc mil | Updated | 2 | krystofkomanec |
| 2026-11-27 | Nedvědi – Ptáčata | Updated | 2 | krystofkomanec |
| 2026-11-27 | Katapult – Blues | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Tučný – Kosmickej vandr | Updated | 2 | krystofkomanec |
| 2026-11-27 | Coldplay – Paradise (capo 3) | Added | 1 | krystofkomanec |
| 2026-11-27 | Oasis – Don’t Look Back in Anger | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Sbohem Angelíno | Updated | 2 | krystofkomanec |
| 2026-11-27 | Kamelot – Fénix | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Tady jsem doma | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Hrůza – Jsi má baletka, co tančí | Updated | 2 | krystofkomanec |
| 2026-11-27 | Filmová Hudba Cz – Chodí horou 300 ovec | Updated | 2 | krystofkomanec |
| 2026-11-27 | Václav Neckář – Časy se mění | Updated | 2 | krystofkomanec |
| 2026-11-27 | Karel Plíhal – Akordy | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Jak mlýn se točí svět | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ivan Mládek – Dívka s modrou matrací | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Dřív než se rozloučíme | Updated | 2 | krystofkomanec |
| 2026-11-27 | Kamil Střihavka – Země vzdálená | Updated | 2 | krystofkomanec |
| 2026-11-27 | Ivan Mládek – Dívka s dolíčky | Updated | 2 | krystofkomanec |
| 2026-11-27 | František Nedvěd – Třetí pokus | Updated | 2 | krystofkomanec |
| 2026-11-27 | Hana Zagorová – Málokdo ví | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jakub Smolík – Zahrada ticha | Updated | 2 | krystofkomanec |
| 2026-11-27 | Bluesberry – Za sto let | Updated | 2 | krystofkomanec |
| 2026-11-27 | Hana Hegerová – Čerešne | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vladimír Mišík – Jednohubky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Petr Hapka – Na Hotelu V Olomouci | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Odpočiň si, Sáro (verze 2) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Jelen – Klidná jako voda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Ještě není tma | Updated | 2 | krystofkomanec |
| 2026-11-27 | Lidové písně – A te Rehradice | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Dívka ze severu | Updated | 2 | krystofkomanec |
| 2026-11-27 | Vladimír Mišík – Stříhali dohola malého chlapečka | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Hej, bystrá voda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Čeká nás poslední ráno (One Too Many Mornings) | Updated | 2 | krystofkomanec |
| 2026-11-27 | Záviš – Čepice | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Až si jednou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Mňága &amp; Žďorp – Nagasaki Hirošima | Updated | 2 | krystofkomanec |
| 2026-11-27 | Záviš – Cukrářská | Updated | 2 | krystofkomanec |
| 2026-11-27 | The Animals – The House of the Rising Sun | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Stojí hruška v širém poli | Updated | 2 | krystofkomanec |
| 2026-11-27 | Druhá tráva – Marcipán z Toleda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Čechomor – Proměny | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Cirkus Praha | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Černej pasažér | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Deža ví | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Doma nejlíp | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Duchové zemřelých | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Dva rychlý vlaky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Historka z podsvětí | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Jaromil Hodněpil | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Jdu krajinou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Kantorovy varhany | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Koleda | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Kolotoč | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Lano, co k nebi nás poutá | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Leží dáma na kolejích | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Marie! | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Markéto! | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Měla jsem já pejska | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Milovaný syn | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Moji učitelé | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Mraky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Na širém moři | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Nad Koločavou | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Nejsem sám | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Namám rád trpaslíky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Nezdárný syn | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Obešel jsem horu | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Orel &amp; panna | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Pálíš, doutnáš, nehoříš | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Paní domácí | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Pět prstů | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Ponorná řeka | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Princezna Lada | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Přijíždí posel | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Ranní rány | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Romeo &amp; Julie po dvaceti letech | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Tak to mám rád | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Taková ženská | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Tlustý muž | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – V jejích šlépějích | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – V oku dravce | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Ve zlatém kočáře | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Vetřelec | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Viděl jsem člověka | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Vraťte mi mou hlavu | Updated | 2 | krystofkomanec |
| 2026-11-27 | Traband – Zlá/sky | Updated | 2 | krystofkomanec |
| 2026-11-27 | Mňága &amp; Žďorp – Měsíc | Updated | 2 | krystofkomanec |
| 2026-11-27 | Michal Prokop – Blues o spolykaných slovech | Updated | 2 | krystofkomanec |
| 2026-11-27 | Tradiční – Bella Ciao | Updated | 2 | krystofkomanec |
<!-- statistics:end -->

## Conversion overview

<!-- pending:start -->
6 source files awaiting conversion.

<ul>
<li>Wohnout - LSD.pdf</li>
<li>pocity.png</li>
<li>Jaromír Nohavica - Hlídač krav.pdf</li>
<li>Poutníci - Až uslyším hvízdání.pdf</li>
<li>Pavel Dydovič - Bláznova ukolébavka.pdf</li>
<li>Škwor - Síla starejch vín.pdf</li>
</ul>
<!-- pending:end -->
