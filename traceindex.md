# Voorstel 1: Trace index

## Doelstelling
In aanloop naar de demodag van 12 februari is er een eerste versie van de transparantie app gerealiseerd. Enkele bedenkingen zijn achteraf beschreven in het hoofdstuk reflectie. Dit document beschrijft een voorstel welke drie van deze bedenkingen adresseert. Het doel is een oplossing te realiseren voor de volgende drie bedenkingen:

- Verantwoordelijkheid voor vertrouwelijke verwerkingen 
([zie bedenking 1](#bedenking-1-verborgen-verwerkingen-en-verantwoordelijkheid))
- Security-risico’s in de vorm van traceId-endpoints ([zie bedenking 2](#bedenking-2-data_subject_id-en-toegangscontrole)).
- Schaalbaarheidsuitdagingen bij overheidsbrede uitrol ([zie bedenking 3](#bedenking-3-schaalbaarheid))

## Kernidee
Er wordt een Trace index geïntroduceerd. De Trace-index geeft een veilig digitaal pasje (het JWT token) aan een burger of bedrijf. Dit pasje laat zien welke gegevens zij mogen bekijken, maar bevat geen gevoelige persoonlijke informatie zoals BSN.

- Het pasje werkt tijdelijk: na korte tijd verloopt het automatisch.
- Als iemand het pasje laat zien aan een organisatie, controleert die organisatie eerst of het pasje geldig is. Pas daarna mogen ze de gegevens laten zien die bij dat pasje horen.

Zo zorgt de Trace-index ervoor dat iedereen alleen toegang krijgt tot de gegevens die voor hen bedoeld zijn, zonder dat iemand per ongeluk te veel kan zien.

Hiervoor registereert de Trace-index uitsluitend de volgende drie gegevens:

- Betrokkene ID
- Trace ID
- Logboek ID

Er worden in de trace-index dus geen log gegevens of inhoudelijke trace-informatie opgeslagen. De index weet alleen welke trace ID's horen bij welke betrokkenne.

##  Oplossing in meer detail

### Registratie van traceId’s
De organisatie __welke de trace start__ bepaalt zelf of deze trace direct zichtbaar is, tijdelijk verborgen moet blijven of zelfs permanent uitgesloten is van inzage.

Een niet vertrouwelijke trace wordt direct aangemeld bij de trace-index. Een vertrouwelijke trace wordt niet aangemeld bij de trace-index. Wanneer vertrouwelijkheid vervalt (bijvoorbeeld na afronding van een opsporingsonderzoek), kan de betreffende organisatie alsnog de betreffende traceId’s aanmelden.

### Opvragen door burger of bedrijf
Een burger of bedrijf logt in, bijv. via DigiD of eHerkenning bij de trace-index. Vervolgens wordt de trace-index gevraagd om een JWT te genereren met als claim een lijst van gekoppelde traceId’s. Het JWT token heeft een beperkte geldigheid (korte time-to-live, TTL) 

Voorbeeld (conceptueel):
```json
{
  "trace_ids": [
    "abc-123",
    "def-456"
  ],
  "exp": 1700000000
}
```

De claims bevatten géén BSN of andere persoonsgegevens — uitsluitend traceId’s.

### Bevraging van logboek-API’s
De frontend stuurt het token mee naar iedere bevraagde organisatie. Elke organisatie:

- Verifieert de handtekening in het token via de publieke sleutel van de trace-index.
- Controleert of de gevraagde traceId in de claims staat.
- Retourneert uitsluitend logregels die corresponderen met geautoriseerde traceId’s in het betreffende logboek.

Er zijn dus geen bevragingen meer op basis van traceID zonder enige vorm van access control. 

## Oplossing per bedenking

### Bedenking 1 – Verborgen verwerkingen

__Probleem__:

Bedenking 1 stelt dat sommige verwerkingen niet zichtbaar mogen worden via frontend-samenvoeging. Een voorbeeld in het project besluit [Vertrouwelijkheid wordt vastgelegd per Verwerkingsactiviteit](https://developer.overheid.nl/kennisbank/data/standaarden/logboek-dataverwerkingen/project-besluiten#vertrouwelijkheid-wordt-vastgelegd-per-verwerkingsactiviteit) illustreert het probleem:

> Opsporingsinstantie A bevraagt bij Overheidsorgaan B data over Betrokkene X in het kader van een lopend onderzoek naar een misdrijf. Betrokkene mag geen inzage krijgen in de verwerking door Opsporingsinstantie A, omdat dit het onderzoek zou kunnen hinderen. Als Betrokkene wel inzage krijgt in de verwerking van Overheidsorgaan B, kan hij alsnog afleiden dat Opsporingsinstantie A deze data heeft opgevraagd, met hetzelfde ongewenste effect.


__Oplossing binnen dit model__:

Alleen opsporingsorganisatie A weet of een verwerking verborgen is. Opsporingsorganisatie A start de trace en kiest er voor om de trace niet aan te melden bij de trace-index. Zolang een traceId niet is aangemeld, kan er geen geldig JWT voor worden afgegeven en blijft de trace verborgen. Andere organisaties hoeven geen additionele logica te implementeren over zichtbaarheid en hoeven bovendien hierover geen informatie op te slaan (maar blijven wel gewoon de verwerking loggen). 

### Bedenking 2 – traceId-endpoints

__Probleem:__

Bij de demo ontstond een technisch patroon waarbij de frontend in twee rondes de volledige trace opbouwde:

- Bevraging op basis van BSN → alleen WOZ retourneert een traceId.
- Bevraging op basis van traceId → alle organisaties retourneren hun deel van de trace.

Op basis van een willekeurig traceId trace-informatie verstrekken, zonder toegangscontrole, bij een bevraging op basis van traceID is vanuit security en privacy oogpunt onacceptabel.

__Oplossing binnen dit model__:

Het introduceren van een trace-index welke tokens uitgeeft met het traceId in de claims lost dit op: iedere bevraging is ondertekend met een JWT en elke organisatie valideert zelf het token. Trace data wordt enkel verstrekt indien de gevraagde trace informatie is gekoppeld aan één van de trace ID's in het JWT token. 

Bijkomend voordeel: er is geen noodzaak voor `data_subject_id` bij elke organisatie. Dit lost een probleem op bij b.v. de BAG waarbij er geen `data_subject_id` in de logregels staan, en hieraan ook moeilijk een zinvolle invulling te geven is.

### Bedenking 3 - Schaalbaarheidsuitdagingen bij overheidsbrede uitrol

De Trace-index weet per betrokkene welke traceId’s bestaan én bij welke organisatie-ID deze horen. Daardoor hoeft de frontend niet alle organisaties te bevragen, maar uitsluitend organisaties welke daadwerkelijk traces van de betrokkene hebben vastgelegd. 

Het patroon _"Vraag alle 1600 overheidsorganisaties of zij trace informatie hebben over betrokkene"_ verandert in _"Vraag alleen de organisaties die volgens de Trace-index daadwerkelijk betrokken zijn"_.

Hierdoor ontstaat een oplossing welke overheidsbreed uitgerold kan worden. 

## Pseudonimiseren

De introductie van de trace-index geeft enkele privacy overwegingen. In de trace-index wordt enkel één tabel bijgehouden met de volgende drie kolommen: `Betrokkene ID`, `Trace ID` en `Logboek ID`. De trace data zelf blijft decentraal opgeslagen.

Bij een naïve implementatie, waarbij als `Betrokkene ID` het BSN wordt gebruikt kan er desondanks het nodige afgeleid worden. B.v. per persoon kan er een lijst opgesteld worden met welke organisaties een persoon contact heeft gehad. Bij sommige overheidsorganisaties kan enkel het wel of niet hebben van contact een privacy gevoelig aspect zijn. Het loggen van een BSN als `Betrokkene ID` is dus geen optie. 


Daarom stellen we voor om pseudoniemen op te slaan als `Betrokkene ID`. Qua werking en terminologie sluiten we aan bij het PRS van VWS. 

Het PRS maakt per organisatie en domein een ander pseudoniem. Vanuit één BSN wordt er dus voor de Belastingdienst een ander pseudoniem aangemaakt dan voor het Kadaster. Daardoor zijn datasets van het Kadaster en van de Belastingdienst dus niet te koppelen, _zonder hulp van de pseudoniemendienst_. 

Daarnaast wordt er onderscheid aangebracht tussen:

- Herleidbare pseudoniemen 
- Niet herleidbare pseudoniemen

Herleidbare pseudoniemen kunnen door een Pseudoniemendienst terugvertaald worden naar een BSN. Enkel de Pseudoniemendienst is hiertoe in staat en bepaalt dus of een partij welke deze vertaling aanvraagt, hiertoe gerechtigd is. Een niet herleidbaar pseudoniem kan door niemand terugvertaald worden naar een BSN, ook niet door de pseudoniemendienst. 

Aangezien niet herleidbare pseudoniemen een sterkere vorm van privacy met zich mee brengen stellen we voor om enkel niet herleidbare pseudoniemen op te slaan in de Trace-index. 

### Aanmelden van een `traceId`

<figure id="Sequence diagram voor het aanmelden van een trace">
<pre class="diagram mermaid">
sequenceDiagram;

participant A as Organisatie
participant B as Pseudoniemendienst
participant C as Trace-index

autonumber

A->>B: BSN of herleidbaar pseudoniem
B-->>A: Referentie Code

A->>C: Trace-index [TraceId, ReferentieCode, Logboek ID]
C->>B: Referentie Code, Domein = Logboek ID
B-->>C: Niet herleidbaar pseudoniem
</pre>
<figcaption>Sequence diagram: Aanmelden van een trace</figcaption>
</figure>

Bij stap 4 wordt de referentie code ingewisseld voor een pseudoniem. In het request wordt naast de referentie code het Logboek ID als domein meegestuurd. Hierdoor worden er verschillende pseudoniemen aangemaakt voor verschillende organisaties (en zelfs per logboek van die organisatie), zelfs als deze pseudoniemen dezelfde persoon beschrijven.

### Opvragen van `traceId`'s

<figure id="Sequence diagram voor het opvragen van traceId's">
<pre class="diagram mermaid">
sequenceDiagram

participant X as Client applicatie
participant D as Transparantie-App
participant B as Pseudoniemendienst
participant C as Trace-index

autonumber

X->>D: 1. HTTP GET https://transparantie-app.nl/get-trace-ids
D->>B: 2. BSN
B-->>D: 3. Referentie Code
D-->>X: 3. HTTP Redirect https://trace-index.nl?referentie-code=...

X->>C: 4. HTTP GET https://trace-index.nl?referentie-code=...
C->>B: 5. Referentie Code, Domein = Batch
B-->>C: 6. Pseudoniem per domein
C-->>X: 7. Response
</pre>
<figcaption>Sequence diagram: Opvragen van TraceId's</figcaption>
</figure>

_Note: In het bovenstaande sequence diagram gaan we er vanuit dat het BSN van de ingelogde gebruiker bekend is bij de transparantie-app, bijvoorbeeld doordat deze is geauthentiseerd via Digi-D of zijn BSN heeft overlegd via b.v. OpenID Connect verifiable credentials._

Stap 6-7 is een batch request waarbij één referentie code en een lijst aan domeinen wordt opgestuurd en er een lijst aan pseudoniemen terug komt. De trace-index vult de lijst met domeinen met alle logboek ID's van alle deelnemende organisaties. Als alle overheidsorganisaties deelnemen en alle organisaties één logboek hebben, dan is dit dus een lijst van zo'n 1600 domeinen. Potentieel doen organisaties echter mee met meerdere logboeken omdat diverse applicaties elk hun eigen logboek geven.

Deze batch operatie is niet beschreven in de documentatie van VWS. Zolang het aantal deelnemende organisaties te overzien is kan er ook een request per deelmende organisatie verstuurd worden. Later optimaliseren is dan triviaal door een batch operatie te introduceren.

_Vraag_: kan één referentie code één of meerdere keren ingewisseld worden voor een pseudoniem. Zo, nee dan dient de transparantie-app backend meerdere referentie codes aan te vragen zolang er geen batch operatie is. 

De Trace-index retourneert een JSON response met de volgende structuur:

```json
{
  "traces": [{
    "traceId": "dfac4819-6ced-4f2e-8801-7bcd3970eea8",
    "logboek": "DUO-studiefinanciering",
    "accessToken": "... short lived JWT .."
  }, {
    ...
  }]
}
```

Met behulp van het `traceId` en het `accessToken` kan de browser applicatie vervolgens rechtstreeks de logboek API van een deelnemende organisatie bevragen. Met behulp van de public key van de Trace-index kan iedere deelnemende organisatie vervolgens verifieren dat het access token authentiek is. 

De extra HTTP redirect (stap 3 en 4) is geïntroduceerd om een duidelijke splitsing in beschikbare informatie af te dwingen tussen de transparantie-app backend en de trace-index. De transparantie-app backend weet wie er ingelogd is, maar beschikt niet over bijbehoorde `traceId`'s. De trace-index daarentegen weet niet wie er ingelogd is, maar beschikt wel over de `traceId`'s. Pas in de client applicatie (browser of native) komt deze informatie samen.

In tabel vorm: 

| Applicatie onderdeel | Kennis van identiteit ingelogde gebruiker | Kennis van `traceId`'s van gebruiker |
|---|---|---|
| Transparantie App | Ja | Nee | 
| Trace-index | Nee | Ja | 
| Client applicatie | Ja | Ja |

**Alternatief**

Een alternatief is om geen pseudoniemdomeinen te gebruiken. Hiermee vervalt de behoefte om een batch endpoint te implementeren. De implicatie hiervan is echter dat voor iedere organisatie voor één persoon altijd hetzelfde pseudoniem gebruikt. Pseudoniemen zijn niet herleidbaar, echter de combinatie van organisaties waarmee één persoon contact heeft, kan fungeren als fingerprint.