# Voorstel 2: Federated Aggregator 

## Kernidee
Dit voorstel is in essentie een variant op Architectuuroplossing 1: server-side aggregatie. Echter, om het nadeel van een backend component dat tot een single point of failure leidt te voorkomen, wordt de backend component bij alle deelnemende organisaties gedraaid. De client verbindt met een willekeurige instance, of altijd met de instance van bijvoorbeeld de gemeente waar iemand is ingeschreven/gevestigd (nader uit te werken).

_Tijdelijke opmerking_ HE: willekeurig zou mijn voorkeur hebben. Voorkomt ook complexiteit met b.v. burgers welke op dit moment niet in Nederland wonen en dus bij geen enkele gemeente zijn ingeschreven. Ook technisch beter, want waarom zou de applicatie down zijn voor iemand uit, zeg Amersfoort, als enkele de federated aggregator van de gemeente Amersfoort er uit licht? 


## Oplossing in meer detail

In de eerste fase wordt een set van traceId's opgebouwd per root-organisatie. In de tweede fase wordt de volledige trace opgehaald bij de root organisatie. De root organisatie is verantwoordelijk voor het ophalen van de trace informatie bij andere deelmenende organisaties. 

<figure id="Sequence diagram voor federated aggregator">
<pre class="diagram mermaid">
sequenceDiagram

participant A as Client applicatie
participant B as Federated Aggregator
participant C as Logboeken (1000+)

autonumber

A->>B: 1. HTTP GET /get-traces

note right of B: Fase 1

loop Voor elk Logboek ID
    B->>C: HTTP GET /get-trace-ids
    C-->>B: Response
end

note right of B: Fase 2

loop Voor elk Logboek waarbij in fase 1 een resultaat is gevonden
    B->>C: HTTP GET /get-traces
    C->>C: Recursief andere deelmende logboeken uitvragen
    C-->>B: Response
end

B-->>A: Response
</pre>
<figcaption>Sequence diagram: Opvragen van TraceId's</figcaption>
</figure>

### Fase 1: TraceId's verzamelen

Van iedere deelnemende organisatie (Logboek) ontvangt de federated aggregator een response met de volgende structuur:

```
[{
    "rootLogbookId": "DUO-studiefinanciering",
    "traceId": "xyz",
}, 
...
]
```

Er zijn drie scenario's mogelijk:

1. Geen logverwerkingen gevonden, geef een lege lijst als response.

2. Logverwerkingen gevonden, maar de trace spans hebben betrekking op een trace welke niet gestart is bij het bevraagde Logboek. In de response wordt dit aangegeven door in het `rootLogbookId` veld aan te geven bij welke organisatie de trace is gestart. Dit vereist dat we in het logboek per trace span gaan bij houden wat het root Logboek is (aanpassing huidige log-standaard). 

3. Logverwerkingen gevonden, en de trace spans hebben betrekking op een trace welke gestart is door de aangeroepen Logboek. 

### Fase 2: Trace 

Iedere _root_ Logboek waarvoor traceId's gevonden zijn in fase 1 worden in fase 2 aangeroepen met het verzoek voor deze traces volledige span terug te geven. 

Dit verzoek is altijd gericht aan het root Logboek. Hierdoor kan het root Logboek, bij het moment van uitvragen, controleren of de ingelogde gebruiker toegang mag hebben. 

Ieder root Logboek geeft de volledige trace terug. Als een trace dus over meerdere organisaties loopt, dan is het de verantwoordelijkheid van het root Logboek om alle trace spans te verzamelen en geaggregeerd terug te sturen. 

### Voorbeeld

We geven een voorbeeld. Opsporingsinstantie FIOD bevraagt het RDW in het kader van een lopend onderzoek naar een misdrijf. Betrokkene mag geen inzage krijgen in de verwerking door FIOD, omdat dit het onderzoek zou kunnen hinderen. 

__Logboek van FIOD__

| Verwerking                       | TraceId | SpanId | ParentSpanId | Root Organization (Logboek) | DataSubjectId |
|---                               |---      | ---    | ---          | ---                         | ---           |
| Kenteken uitvragen               | T1      | S1     | NULL         | FIOD                        | NULL          |

__Logboek van RDW__

| Verwerking                       | TraceId | SpanId | ParentSpanId | Root Organization (Logboek) | DataSubjectId |
|---                               |---      | ---    | ---          | ---                         | ---           |
| Kenteken informatie verstrekken  | T1      | S2     | S1           | FIOD                        | BSN1          |


Het onderzoek waar Trace `T1` betrekking op heeft is nog lopende. De betrokkene met `BSN1` mag de trace (nog) niet zien. Deze beslissing wordt genomen door het logboek applicatie van de FIOD.

<figure id="Sequence diagram voor federated aggregator">
<pre class="diagram mermaid">
sequenceDiagram

participant A as Client applicatie
participant B as Federated Aggregator
participant C as FIOD
participant D as RDW

autonumber
rect rgb(191, 223, 255)
note left of A: Fase 1
A->>B: 1. HTTP GET /get-traces

B->>C: HTTP GET /get-trace-ids?SubjectId=BSN1
Note over C: mapping = []
C-->>B: Response

B->>D: HTTP GET /get-trace-ids?SubjectId=BSN1
Note over D: mapping = [{ rootOrganization: "FIOD", traceId: "T1"  }]
D-->>B: Response
end

rect rgb(191, 223, 255)
note left of A: Fase 2
B->>C: HTTP GET /get-trace?traceId=T1
C->>D: HTTP GET /get-trace?traceId=T1

D-->>C: Response (met inhoud)
C-->>B: Response (zonder inhoud, gebruiker niet geautoriseerd)
B-->>A: Response
end
</pre>
<figcaption>Sequence diagram: voorbeeld</figcaption>
</figure>

_Note_ HE: Als de trace vertrouwelijk is, dan hoeft de FIOD de RDW uberhaupt niet meer aan te roepen om daar de trace spans op te halen.

## Oplossing per bedenking

### Bedenking 1 – Verborgen verwerkingen

__Probleem__:

Bedenking 1 stelt dat sommige verwerkingen niet zichtbaar mogen worden via frontend-samenvoeging. Een voorbeeld in het project besluit [Vertrouwelijkheid wordt vastgelegd per Verwerkingsactiviteit](https://developer.overheid.nl/kennisbank/data/standaarden/logboek-dataverwerkingen/project-besluiten#vertrouwelijkheid-wordt-vastgelegd-per-verwerkingsactiviteit) illustreert het probleem:

> Opsporingsinstantie A bevraagt bij Overheidsorgaan B data over Betrokkene X in het kader van een lopend onderzoek naar een misdrijf. Betrokkene mag geen inzage krijgen in de verwerking door Opsporingsinstantie A, omdat dit het onderzoek zou kunnen hinderen. Als Betrokkene wel inzage krijgt in de verwerking van Overheidsorgaan B, kan hij alsnog afleiden dat Opsporingsinstantie A deze data heeft opgevraagd, met hetzelfde ongewenste effect.


__Oplossing binnen dit model__:

In dit model wordt de vertrouwelijkheid gewaarborgt doordat altijd de root-organisatie de volledige trace terug geeft aan de federated aggregator. Hiermee is de root-organisatie verantwoordelijk voor het bepalen of een trace _in zijn geheel_ vertouwelijk is. 

### Bedenking 2 – traceId-endpoints

__Probleem:__

Het algoritme verloopt in twee fases:

- Bevraging op basis van BSN → alleen organisaties met matchende trace spans retourneren een traceId.
- Bevraging op basis van traceId → alle organisaties retourneren hun deel van de trace.

Op basis van een willekeurig traceId trace-informatie verstrekken, zonder toegangscontrole, bij een bevraging op basis van traceID is vanuit security en privacy oogpunt onacceptabel.

__Oplossing binnen dit model__:

Nu niet langer de webclient van de gebruiker, maar de federated aggregator de uitvragen op basis van traceID uitvoert, dient dus te worden gegarandeerd dat de partij die de data op basis van een traceID verstrekt, er zeker van kan zijn dat de federated aggregator die de vraag stelt, een mede-speler in dit stelsel is.
Dergelijk vertrouwen wordt normaalgesproken gegarandeerd door het over en weer tussen partijen uitwisselen van PKI-certificaten. Dat kan ook in dit geval.
Echter, dat betekent bij 1600 deelnemende partijen/logboeken, dat elke partij van elke andere partij een publieke sleutelmoet kennen. Dat leidt tot een ingewikkeld onderhouds-probleem, omdat deze keys met regelmaat gewijzigd (geroteerd) moeten worden. 
Een potentiele oplossing daarvoor kan zijn om de data van de vraag die een aggregator naar een collega-aggregator verzendt, wordt versleuteld (ondertekend) met de private-sleutel van de vraagstellende aggregator. De bevraagde aggregator haalt uit een centraal register (levend naast het trace-register?) de publieke sleutel op van de vragende organisatie op en checkt daarmee of de vraagsteller ook tot het stelsel behoort. Dit betekent dat het traceregister - bij de vraag om een publieke sleutel - de controle moet doen of degene die om de publieke sleutel vraagt tot het stelsel behoort. Dat kan op zijn beurt door ondertek=
ening van die vraag met het cerificaat van de betreffende partij gebeuren.

__Note__: Goede vraag?

### Bedenking 3 - Schaalbaarheidsuitdagingen bij overheidsbrede uitrol

De Federated Aggregator kent een performance bottlneck in de vorm van een parallele aanroep naar alle deelnemende logboeken in fase 1 van het algoritme. Verder onderzoek is nodig om te vast te stellen binnen welke response tijd dit haalbaar is.

## Pseudonimiseren

Om deze bottlneck weg te nemen, kan deze oplossing worden gecombineerd met de transparantie-index.

## Voor- en nadelen

**Voordelen**

- Geschikt voor zowel web- als native applicaties
- Geen CORS headers nodig bij webapplicatie.
- Eenvoudige frontend implementatie. 
- Functionaliteit eenvoudig aan te bieden vanuit meerdere clients (web, native app, etc). 
- Open standaarden, tried-and-tested security model

**Nadelen**

~~- Aggregation backend is single point of failure.~~
- Aggregation backend heeft toegang tot het totaal overzicht alle log gegevens.
- Partieel resultaat tonen tijdens inladen lastiger te realiseren. Eventueel mogelijk door het streamen van newline delimited JSON via chucked HTTP maar dat maakt zowel de frontend als backend complexer.
