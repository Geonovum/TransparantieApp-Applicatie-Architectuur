# Reflectie

Mijn zorg is dat een gedistribueerde opslag met frontend-samenvoeging:
- verantwoordelijkheden rondom verborgen verwerkingen bij de verkeerde partij kan leggen ([zie bedenking 1](#bedenking-1-verborgen-verwerkingen-en-verantwoordelijkheid)).
- spanning oplevert met dataminimalisatie ([zie bedenking 1](#bedenking-1-verborgen-verwerkingen-en-verantwoordelijkheid)).
- security-risico’s introduceert in de vorm van traceId-endpoints ([zie bedenking 2](#bedenking-2-data_subject_id-en-toegangscontrole)).
- niet overheidsbreed opschaalt ([zie bedenking 3](#bedenking-3-schaalbaarheid)).
- inconsistent wordt zodra niet-digitale inzage nodig is ([zie bedenking 4](#bedenking-4-niet-digitale-inzage)).
- en wordt gelegitimeerd met een vergelijking (VO-rijk) die inhoudelijk niet opgaat.

## Bedenking 1 – Verborgen verwerkingen en verantwoordelijkheid

Tijdens ons overleg in Den Haag van 27 januari j.l. werd terecht opgemerkt dat het in sommige gevallen juist níet wenselijk is dat een verwerking zichtbaar is voor de burger. Denk bijvoorbeeld aan een bevraging van het kentekenregister van de Rijksdienst voor het Wegverkeer (RDW) door de Fiscale Inlichtingen- en Opsporingsdienst (FIOD) in het kader van een lopend onderzoek. Vergelijkbare situaties kunnen zich voordoen bij onder andere de Politie, Zorginspectie, Veilig Thuis, het Openbaar Ministerie en de Algemene Inlichtingen- en Veiligheidsdienst (AIVD).

Dit roept vragen op:

- Mag of moet de bevraagde organisatie (bijvoorbeeld het RDW) weten dat een gegevensraadpleging plaatsvindt in het kader van een proces dat (tijdelijk of permanent) verborgen moet blijven?
- Kunnen we van bevraagde organisaties verlangen dat zij per inzage registreren of deze verborgen moet blijven?
- Is dat verenigbaar met het beginsel van dataminimalisatie?
- Indien het een tijdelijk karakter heeft: wie bepaalt wanneer de verwerking alsnog zichtbaar wordt?

De kern is dat de vragende organisatie (bijvoorbeeld FIOD of politie) weet of een inzage verborgen moet blijven en hoe lang. Het is daarom logischer dat de applicatie primair het logboek van de vragende organisatie raadpleegt. Indien nodig kan die organisatie vervolgens server-to-server aanvullende tracing data ophalen bij bijvoorbeeld de bevraagde organisatie (b.v. het RDW).

Hiermee:

- blijft de kennis over het "verborgen karakter" bij de juiste partij
- wordt de bevraagde organisatie niet belast met contextinformatie over onderzoeken
- voorkomen we dat iedere deelnemende organisatie logica moet implementeren over zichtbaarheid

Dit wringt met een model waarin alle partijen hun tracing data "blind" beschikbaar stellen voor frontend-samenvoeging.

## Bedenking 2 – `data_subject_id` en toegangscontrole

Volgens de standaard moet iedere logregel een `data_subject_id` bevatten. In de referentie-implementatie van de WOZ-casus werd dit echter niet toegepast.
Voor de demo is de WOZ-service uitgebreid zodat het BSN wordt gelogd als `data_subject_id`. Dat werkt voor WOZ-service, maar roept vragen op bij registraties zoals de Basisregistratie Adressen en Gebouwen (BAG). Hierin worden enkel adressen en gebouwen beheerd, geen persoonsinformatie. 

Dan rijst de vraag:
- Moeten we daar alsnog een data_subject_id introduceren? _Antwoord Tim: Ja, maar nog geen beslissing welke waarde te gebruiken als data_subject_id._
- Zo ja, wat is dan de juiste waarde? 
- Of moeten we erkennen dat niet elke logregel altijd _losstaand_ direct herleidbaar is tot een betrokkene?

Bij de demo ontstond bovendien een technisch patroon waarbij de frontend in twee rondes de volledige trace opbouwde:

- Bevraging op basis van BSN → alleen WOZ retourneert een traceId.
- Bevraging op basis van traceId → alle organisaties retourneren hun deel van de trace.

Dit impliceert echter dat organisaties een endpoint moeten aanbieden dat op basis van een willekeurig traceId trace-informatie verstrekt, zonder toegangscontrole dus. Vanuit security- en privacy-oogpunt is dit onacceptabel.

Wanneer we in plaats daarvan de backend van de WOZ-applicatie verantwoordelijk maken voor server-to-server bevraging van BAG en BRK, dan:

- blijft toegangscontrole geborgd
- hoeft b.v. de BAG geen publiek endpoint op basis van enkel een traceId aan te bieden;

## Bedenking 3 - Schaalbaarheid 

Nederland kent circa 1600 overheidsorganisaties (rijk, uitvoeringsorganisaties, provincies, gemeenten, waterschappen en zbo’s). In de demo worden drie organisaties bevraagd; dat is overzichtelijk en technisch goed beheersbaar, maar dit schaalt niet op wanneer dit wordt uitgerold naar het volledige overheidslandschap. 

De frontend zal de logboeken van alle overheidsorganisaties moeten raadplegen terwijl de verwachting is dat een burger of bedrijf in een gegeven tijdsperiode (b.v. `de afgelopen 6 maanden`) slechts in de logboeken van een beperkt aantal overheidsorganisaties terug te vinden zal zijn.

## Bedenking 4 – Niet-digitale inzage

Naast een digitale applicatie moet er ook een papieren inzage-mogelijkheid zijn voor digitaal minder vaardige burgers. Ongeveer één op de vijf Nederlands is niet voldoende digitaal vaardig [[?BIBLIOTHEEKNETWERK]]. Dan zijn er in feite twee opties:

1. Iedere organisatie stuurt afzonderlijk een brief met haar deel van de trace.
2. De burger ontvangt één samengevoegde brief.

Optie 1 is weinig realistisch: het samenvoegen van technische trace-informatie is complex, zeker voor burgers die al moeite hebben met digitale processen.

Optie 2 vereist onvermijdelijk een centraal systeem dat alle delen ophaalt en samenvoegt. Daarmee ontstaat een inconsistentie: voor de digitale variant vermijden we centrale aggregatie, maar voor de papieren variant hebben we die alsnog nodig.

Dat roept de vraag op of het vermijden van centrale samenvoeging in de digitale variant werkelijk een principieel uitgangspunt moet zijn, of een middel dat mogelijk meer complexiteit introduceert dan het oplost.

## De vergelijking met het vorderingenoverzicht (VOrijk / "Mijn betaaloverzicht")
Er wordt regelmatig verwezen naar het Vorderingenoverzicht rijk (VOrijk), dat inmiddels ook bekendstaat als "Mijn betaaloverzicht". Dit overzicht toont onder meer schulden bij verschillende overheidsorganisaties, b.v. Dienst Uitvoering Onderwijs (DUO) en de Belastingdienst.

Deze vergelijking gaat echter mank. Bij het vorderingenoverzicht is het samenvoegen van gegevens conceptueel eenvoudig:

|  | 
| -- | 
| Je hebt x,- euro schuld bij DUO. | 
| Je hebt y,- euro schuld bij de Belastingdienst. | 
| Totaal = x + y euro. | 

Er zijn geen inhoudelijke verbanden tussen de onderliggende datasets. Het gaat om optelbare, zelfstandige grootheden zonder onderlinge afhankelijkheid.

Bij tracing data ligt dat wezenlijk anders:

- De zichtbaarheid van logregels kan afhankelijk zijn van contextinformatie welke niet binnen de bevraagde organisatie aanwezig is (bijvoorbeeld lopend onderzoek).
- Tijdelijkheid (wel/niet vrijgeven) kan per trace verschillen.
- Er kunnen onderlinge afhankelijkheden zijn tussen verwerkingen die niet te leggen zijn zonder gebruik te maken van het traceId. 
- De VO-Rijk applicatie kent geen niet-digitale variant.

Het probleem is dus niet alleen technisch complexer, maar ook wezenlijk anders. Het samenvoegen is geen eenvoudige aggregatie, maar het reconstrueren van een keten van verwerkingen met onderlinge relaties. Daarom is het de vraag of het verstandig is om dezelfde architectuurprincipes toe te passen als bij het Vorderingenoverzicht. Het onderliggende probleem is simpelweg niet hetzelfde.

## Conclusie

1. Waar ligt de verantwoordelijkheid voor zichtbaarheid (vragende of bevraagde organisatie)?
2. Waar kan toegangscontrole het veiligst worden ingericht?
3. Is een gecontroleerde vorm van centrale aggregatie – al dan niet via een aggregatie backend – uiteindelijk eenvoudiger en veiliger?

