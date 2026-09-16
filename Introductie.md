# Introductie

De overheid verwerkt enorme hoeveelheden burgerdata, bijvoorbeeld bij het nemen van besluiten. Op individueel niveau is echter niet altijd duidelijk welke data wordt gebruikt bij besluitvorming. Er bestaan standaarden zoals het Logboek Dataverwerkingen, Nen-normen en EU-Dataspaces die vastleggen hoe data worden verwerkt en hoe beslissingen tot stand komen. Het toegankelijk maken van deze informatie voor het brede publiek, met oog voor privacybelangen van alle betrokkenen, is een grote uitdaging. 

Om dit doel te bereiken willen we een standaard voor het lezen van logging voor transparantie besluitvorming definieren en een App bouwen, de TransparantieApp die van deze standaard gebruik maakt. In een simulatieomgeving die automatisch informatie ophaalt en inzichtelijk maakt uit een al bestaand logbestand zoals bijvoorbeeld een logbestand gemaakt met Logboek Dataverwerkingen. Logboek Dataverwerkingen is een standaard voor overheden waarmee zij vastleggen hoe zij gegevens verwerken (ook wel 'loggen'). Hierdoor kunnen overheden transparant maken wat er met gegevens gebeurt, zowel binnen hun eigen organisatie als in samenwerking met andere instanties. De App is vergelijkbaar met de Vorderingenoverzicht Rijk-app (vorijk.nl) en sluit aan bij het overheidsbeleid rondom data-uitwisseling, zoals vastgelegd in de Nederlandse Digitaliseringsstrategie. De App haalt zijn data direct bij de bron via API's, werkt volledig op basis van open standaarden en legt nadruk op privacy van de burger door de data alleen bij de burger samen te brengen.

Dit document is onderdeel van de rapportage over het project TransparantieApp de rapportage bestaat uit drie documenten:

| **Naam**                         | **publicatie**                                            | **werkversie**                                                       | **github**                                                           |
|----------------------------------|-----------------------------------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------|
| TransparantieApp rapport         | https://docs.geostandaarden.nl/ldv/transparantieapp       | https://geonovum.github.io/TransparantieApp/                         | https://github.com/Geonovum/TransparantieApp                         |
| Gebruikersonderzoek en UX design | https://docs.geostandaarden.nl/ldv/transparantieapp-go-ux | https://geonovum.github.io/TransparantieApp-Gebruikers-Onderzoek-UX/ | https://github.com/Geonovum/TransparantieApp-Gebruikers-Onderzoek-UX |
| Applicatie Architectuur          | https://docs.geostandaarden.nl/ldv/transparantieapp-arch  | https://geonovum.github.io/TransparantieApp-Applicatie-Architectuur/ | https://github.com/Geonovum/TransparantieApp-Applicatie-Architectuur |

## Leeswijzer

Deze bijlage volgt de weg die het project heeft afgelegd: eerst de architectuurkeuzes voor de eerste werkende versie van de app, vervolgens de bedenkingen die daarbij naar boven kwamen, en ten slotte de voorstellen en metingen die daarop antwoord geven.

- [Applicatie architectuur](#applicatie-architectuur) beschrijft de context en de randvoorwaarden, werkt vier oplossingsrichtingen voor authenticatie en autorisatie uit — server-side aggregatie, JWT met decentrale aggregatie, de VO-Rijk-aanpak en pseudoniemen — en vergelijkt ze op onder meer de vraag of het BSN in de frontend terechtkomt. Het hoofdstuk sluit af met de keuze tussen een web-app en een native app.
- [Reflectie](#reflectie) beschrijft vier bedenkingen bij gedistribueerde opslag met samenvoeging in de frontend: de verantwoordelijkheid voor verborgen verwerkingen, de toegangscontrole rond `data_subject_id`, de schaalbaarheid bij overheidsbrede uitrol, en de omgang met niet-digitale inzage.
- [Voorstel 1: Trace index](#voorstel-1-trace-index) adresseert de eerste drie bedenkingen met een index die uitsluitend bijhoudt welke trace-ID's bij welke betrokkene en welk logboek horen — dus zonder loggegevens, en met pseudonimisering in plaats van het BSN.
- [Voorstel 2: Federated Aggregator](#voorstel-2-federated-aggregator) beschrijft een variant op server-side aggregatie waarbij de aggregatiecomponent niet centraal staat, maar bij alle deelnemende organisaties draait.
- [Performance-experiment](#performance-experiment-schaalbaarheid-van-de-vo-rijk-aanpak) toetst met metingen op vier combinaties van browser en apparaat of de VO-Rijk-aanpak opschaalt naar overheidsbrede aantallen logboeken, en verklaart de uitkomst vanuit de verbindingslimieten van de browser.

Wie alleen in de uitkomsten geïnteresseerd is, kan zich beperken tot de vergelijking en de conclusies in het hoofdstuk Applicatie architectuur, en tot de conclusie van het performance-experiment.
