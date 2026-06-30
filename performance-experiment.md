# Performance-experiment: schaalbaarheid van de VO-Rijk-aanpak

## Aanleiding en vraagstelling

De [Vorderingenoverzicht Rijk-aanpak (VO-Rijk)](https://vorijk.nl/docs/introductie) laat de
frontend van een applicatie *rechtstreeks* alle deelnemende organisaties bevragen en voegt de
antwoorden pas in de client samen. Er is bewust géén centrale koppeltabel
of index die vooraf bepaalt welke bronnen relevant zijn. Op de huidige schaal van VO-Rijk — circa
acht deelnemende organisaties — werkt dit uitstekend.

De TransparantieApp mikt echter op een overheidsbrede uitrol. Nederland kent circa 1.600
overheidsorganisaties, en elke organisatie kan meerdere logboeken beheren. De centrale vraag van dit experiment is daarom:

> **Schaalt de VO-Rijk-aanpak — waarbij de frontend zelf alle bronnen bevraagt — naar duizend of
> meer onafhankelijke organisaties, binnen een voor de gebruiker acceptabele laadtijd?**

Als acceptabel verstaan wij hieronder < 1 seconde onder normale omstandigheden. 

## De VO-Rijk-aanpak in het kort

VO-Rijk rust op drie principes:

1. **Burger-geïnitieerd** — de burger vraagt zélf zijn overzicht op.
2. **Data bij de bron** — de gegevens komen rechtstreeks van de organisatie die ze verwerkt.
3. **Geen tussenliggende verwerking** — alleen de bronorganisatie en de burger zien de
   persoonsgegevens; er is geen aggregerende tussenpartij.

Het derde principe is aantrekkelijk vanuit privacy-oogpunt, maar het heeft een belangrijke
technische consequentie: zónder index die het zoekgebied verkleint, moet de frontend *alle* 
deelnemende organisaties aanroepen om zeker te weten dat het overzicht compleet
is. Bij een overheidsbrede uitrol potentieel duizenden. Dit experiment onderzoekt of een browser 
die last technisch aankan.

## Opzet van het experiment

De volledige code van de testopstelling staat in
[github.com/henkerik/performance-test](https://github.com/henkerik/performance-test). De opstelling
bestaat uit twee delen.

TODO: Verplaatsen naar Github account Geonovum? 

### De testopstelling

- **Frontend** — een statische HTML-pagina met JavaScript die met een pool van *workers*
  een instelbaar aantal `fetch`-verzoeken afvuurt en de totale wandkloktijd meet met
  `performance.now()`.

- **Backend** — een Cloudflare Worker die elke "organisatie" simuleert. De Worker beantwoordt de
  CORS-preflight (`OPTIONS`), wacht een instelbare latentie (`?delay=`, standaard 200 ms) en
  retourneert een klein JSON-antwoord.

De kern van de opzet zit in het adres dat per verzoek wordt opgebouwd:

```js
`https://${i}-${Math.floor(Math.random() * 999999)}-test.henkerikvanderhoek.nl/performance-test?delay=${delay}`
```

TODO: Domeinnaam vervangen.

Elk verzoek gaat naar een **uniek subdomein** en dus naar een **aparte origin**. Daarmee modelleert
de test getrouw de werkelijkheid van 1.600 onafhankelijke organisaties: voor elke organisatie moet
de browser een volledig nieuwe verbinding opzetten (DNS-lookup, TCP-handshake, TLS-handshake) en —
omdat het een niet-simpel cross-origin verzoek betreft — een **CORS-preflight** uitvoeren. Niets
hiervan kan tussen organisaties worden hergebruikt.

<figure id="Sequence diagram: VO-Rijk-aanpak in de browser">
<pre class="diagram mermaid">
sequenceDiagram

actor U as Burger
participant B as Browser (frontend)
participant O as Organisaties 1..N (elk een eigen origin)

autonumber

U->>B: open overzicht

loop Per organisatie, maximaal parallel afhankelijk van workerpool size
    B->>O: DNS-lookup + TCP-handshake + TLS-handshake
    B->>O: OPTIONS (CORS-preflight)
    O-->>B: 204 (CORS-headers)
    B->>O: POST (verzoek om data)
    O-->>B: 200 (data)
end

B-->>U: toon samengevoegd overzicht (pas na de laatste golf)
</pre>
<figcaption>Sequence diagram</figcaption>
</figure>

### Parameters

De frontend is parametriseerbaar. De standaardwaarden zijn zo gekozen dat ze de overheidsbrede
situatie benaderen:

| Parameter                     | Default  | Toelichting                                                                  |
|-------------------------------|----------|------------------------------------------------------------------------------|
| Total Requests                | 1.600    | aantal te bevragen organisaties (≈ aantal Nederlandse overheidsorganisaties) |
| Workerpool Size (max parallel)| 200      | aantal gelijktijdige *workers* dat de frontend probeert te draaien           |
| Base Delay                    | 300 ms   | basis latency die elke gesimuleerde organisatie aanhoudt                     |
| Max Jitter                    | 100 ms   | willekeurige extra latency (0–100 ms) per verzoek                            |

### Technische realisatie en representativiteit

Een paar keuzes in de opstelling zijn bewust gemaakt om een *realistische* (en niet kunstmatig
gunstige) meting te krijgen:

- **Niet-simpele verzoeken.** De frontend gebruikt `POST` met `Content-Type: application/json`.
  Daarmee is het verzoek per definitie *niet-simpel* en dwingt de browser een CORS-preflight af.
  Dit is representatief: ook een `GET` met een `Authorization`-header (een Bearer-token, zoals de
  TransparantieApp-architectuur gebruikt) is niet-simpel en leidt tot een preflight.

- **Geen preflight-caching mogelijk.** De backend zet `Access-Control-Max-Age: 0`, maar dat is voor
  de conclusie niet eens doorslaggevend: omdat elke organisatie een eigen origin is en precies
  *één* keer wordt bevraagd, valt er per definitie niets te hergebruiken. De preflight-cache is
  immers per origin. In deze topologie is de preflight-overhead dus *onvermijdbaar*, ongeacht de 
  waarde van `Access-Control-Max-Age`. 

- **Worker-pool in plaats van `Promise.all` over alles.** De frontend start `Workerpool Size` workers die
  elk uit een gedeelde wachtrij verzoeken trekken tot deze leeg is. Hiermee wordt de concurrency op
  applicatieniveau begrensd. Zoals hieronder blijkt, legt de browser daarbovenop nog een eigen,
  hardere grens op.

## Waarom een browser geen duizenden parallelle verbindingen opzet

Een veelvoorkomend misverstand is dat de frontend, als deze maar genoeg `fetch`-aanroepen
tegelijk start, ook daadwerkelijk duizenden verbindingen parallel opzet. Dat is niet het geval.
Browsers begrenzen het aantal gelijktijdige verbindingen op twee niveaus, en verzoeken die de grens
overschrijden komen in een wachtrij terecht.

### Limiet per host

Onder HTTP/1.1 openen moderne browsers maximaal circa **6 verbindingen per hostnaam**. Verzoeken
daarboven blijven wachten tot er een verbinding vrijkomt. In dit experiment is de per-host-limiet 
niet de beperkende factor — elke organisatie heeft immers een *eigen* host. Maar voor organisaties 
die meerdere Logboeken op hetzelfde domein aanbieden, wordt deze limiet alsnog relevant. Onder HTTP2/3 
vervalt deze beperking.

### Globale verbindingslimiet

Naast de per-host-limiet hanteren browsers een **globaal maximum** over álle hosts samen. Een browser 
hanteert een pool van beschikbare TCP sockets. De grens verschilt per browser en per operating system. 
Met behulp van de workerpool-size parameter kan experimenteel bekeken worden waar deze grens ligt: de grens 
is bereikt wanneer het verhogen van de workerpool size parameter geen verbetering van de waargenomen test
snelheid oplevert. 

### Gevolg: queueing

Wanneer het maximum is bereikt, worden nieuwe verzoeken niet geweigerd maar **in een wachtrij van de browser
geplaatst** tot er een socket vrijkomt (in Chrome DevTools zichtbaar als de status *"Queueing"* /
*"Stalled"*). De gevolgen voor de VO-Rijk-aanpak:

- Ook al start de frontend 1.600 verzoeken tegelijk, de browser voert er feitelijk maar
  een stuk minder tegelijk uit. De rest wacht.

### HTTP/2 en HTTP/3 bieden hier geen uitweg

HTTP/2- en HTTP/3-multiplexing kunnen vele verzoeken over één TCP verbinding bundelen en omzeilen zo de
per-host-limiet — maar uitsluitend *binnen dezelfde origin*. Omdat elke organisatie een aparte
origin is, vereist elke organisatie een eigen verbinding. Multiplexing helpt dus niet tegen het
fundamentele probleem van veel onafhankelijke bronnen.

## Overhead per verbinding

Voor elke afzonderlijke organisatie betaalt de browser de volledige prijs van het opzetten van een
verbinding, zonder dat ook maar iets tussen organisaties kan worden hergebruikt. De onderstaande
tabel toont de opbouw van die overhead.

| Fase                          | Toelichting                                                         |
|-------------------------------|---------------------------------------------------------------------|
| DNS-lookup                    | nieuw (sub)domein per organisatie, geen hergebruik                  |
| TCP-handshake                 | 3-way handshake, 1 RTT                                              |
| TLS-handshake.                | TLS 1.3 sleuteluitwisseling, 1 RTT                                  |
| CORS-preflight (`OPTIONS`)    | verplicht bij niet-simpele verzoeken, extra round-trip vóór de POST |
| Daadwerkelijk verzoek (`POST`)| inclusief gesimuleerde serververwerking (`Base Delay` + jitter)     |

## Meetresultaten

De onderstaande metingen zijn uitgevoerd met oplopende workerpool size, telkens met 2.000 organisaties, een
basislatentie van 300 ms en tot 100 ms jitter per organisatie.

### Macbook Pro M1 Max, Chrome versie 144

| Workerpool size | Totale wandkloktijd | Mislukt / timeout |
|------------|---------------------|-------------------|
| 50         | 19,6 s              | 0                 |
| 100        | 10,8 s              | 0                 |
| 150        | 7,6 s               | 0                 |
| 200        | 6,5 s               | 0                 |
| 250        | 6,4 s               | 0                 |
| 300        | 6,5 s               | 0                 |
| 350        | 7,2 s               | 0                 |

###  Macbook Pro M1 Max, Safari versie 26.3.1

| Workerpool size | Totale wandkloktijd | Mislukt / timeout |
|------------|---------------------|-------------------|
| 50         | 32,6 s              | 0                 |
| 100        | 32,7 s              | 0                 |
| 150        | 35,5 s              | 0                 |
| 200        | 23,6 s              | 0                 |
| 250        | 22,9 s              | 0                 |
| 300        | 22,0 s              | 0                 |
| 350        | 23,6 s              | 0                 |

###  Macbook Pro M1 Max, Firefox versie 148.0.2

| Workerpool size | Totale wandkloktijd | Mislukt / timeout |
|------------|---------------------|-------------------|
| 50         | 44,5 s              | 1                 |
| 100        | 49,9 s              | 0                 |
| 150        | 44,4 s              | 7                 |
| 200        | 50,3 s              | 38                |
| 250        | 43,4,9 s            | 30                |
| 300        | 64,0 s              | 14                |
| 350        | 69,9 s              | 9                 |

###  iPhone 14, Safari

| Workerpool size | Totale wandkloktijd | Mislukt / timeout |
|------------|---------------------|-------------------|
| 20         | 63,1 s               | 0                |
| 30         | 39,3 s               | 0                |
| 40         | 57,5 s               | 0                |
| 50         | 27,4 s               | 0                |
| 60         | 27,0 s               | 0                |
| 70         | 28,4 s               | 0                |
| 100        | 68,8 s               | 0                |

## Analyse

De meetreeks bevestigt:

1. Totale doorloopt tijd blijft nergens onder de 1 seconde. De snelste doorlooptijd is waargenomen op 
   desktop, met Chrome als browser en een worker pool size van 250. 

2. Het vergroter van de workerpool size levert niet altijd een snellere doorlooptijd op. Ook de browser en 
   het operating system werpen beperkingen op in het aantal parallel uit te voeren TCP verbindingen. 
   Er is geen snelheidswinst wanneer deze grens wordt bereikt, sterker nog de totale doorloopttijd 
   zal toenemen. De globale verbindingslimiet lijkt op desktop rond de 250 TCP verbindingen te liggen, 
   terwijl op een iPhone deze limiet al rond 50 TCP verbindingen wordt bereikt.

3. De verschillen tussen webbrowsers zijn groot. Chrome is veruit het snelste. 

4. Daarnaast speelt een betrouwbaarheidsprobleem. Met name op Firefox mislukt een niet insignificant deel
   van de HTTP aanroepen. 

## Conclusie

**De VO-Rijk-aanpak schaalt niet naar grote aantallen (1.000+) onafhankelijke logboeken.** De
overhead per verbinding — DNS-lookup, TCP-handshake, TLS-handshake en CORS-preflight — is eenvoudigweg
te groot wanneer deze voor elk logboek afzonderlijk en zonder hergebruik moet worden betaald.
Bovendien zet de browser de verzoeken niet werkelijk allemaal parallel op: vanwege de globale
verbindingslimiet en de per-host-limiet (~6) worden de verzoeken in een wachtrij
geplaatst. De vaste overhead per verzoek en gedwongen serialisatie maakt 
dat de laadtijd bij overheidsbrede schaal ver buiten het acceptabele bereik valt.