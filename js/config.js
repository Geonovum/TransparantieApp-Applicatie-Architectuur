let respecConfig = {
  useLogo: true,
  useLabel: true,

  // TODO: title is verplicht! Neem hieronder de titel van het document op
  title: "TransparantieApp Bijlage Applicatie Architectuur",
  //-- specStatus is verplicht! (activeer 1 van de volgende)
  specStatus: "wv",                 // Werkversie
  //specStatus: "cv",               // Consultatieversie
  //specStatus: "vv",               // Versie ter vaststelling
  //specStatus: "def",              // Vastgestelde versie
  //specStatus: "basis",            // Basis Document

  //-- specType is verplicht bij alle andere dan BASIS
  //specType: "NO",                 // Norm
  //specType: "ST",                 // Standaard
  //specType: "IM",                 // Informatie Model
  //specType: "PR",                 // Praktijkrichtlijn
  specType: "HR",                   // HandReiking
  //specType: "WA",                 // Werkafspraak
  //specType: "BD",                 // Beheer Documentatie
  //specType: "AL",                 // Algemeen document
  //specType: "BP",                 // Best Practice

  //-- pubDomain is verplicht! (komt in de URL)
  //-- zie: https://geonovum.github.io/handleiding-tooling/ReSpec/#pubdomain
  //-- TODO: vul pubDomain in
  pubDomain: "ldv",

  //-- license: voor de geldende gebruiksvoorwaarden. Default is cc-by.
  //license: "cc-by-nd",            // bronvermelding, geen afgeleide werken (default)
  //license: "cc0",                 // Public Domain Dedication
  license: "cc-by",                 // Attribution, met bronvermelding

  //-- TODO shortName is verplicht! (komt in de URL: kies logische afkorting)
  shortName: "transparantieapp-arch",
  
  //edDraftURI = De URI van de draft version. Deze wordt automatisch afgeleid van de github URI; maar kan hier overschreven worden. 
	//edDraftURI: ["https://geonovum.github.io", "/", "shortName"],

  //-- publishDate is verplicht. Als je werkversie gekozen hebt  dan pakt Respec
  //-- de pushdate maar de publishDate is nog steeds verplicht.
  publishDate: "2025-11-17",
  
  //-- publishVersion is verplicht. Hij mag wel leeg zijn [], maar niet de lege string zijn "".
  publishVersion: [],

  preProcess: [window.respecMermaid.createFigures],
 
  //-- Voor dit blok geldt: alleen als er eerdere versies zijn en altijd beide aan/uit! 
  //previousPublishDate: "2014-05-01",
  //previousMaturity: "CV",

  //-- Deze gebruiken we niet binnen Geonovum
  //prevVersion: "0.0.1",

  //-- TODO: de namen van de Editor(s) / Redacteur(en)
  //-- vul in: per Editor: name:, company:, companyURL:
  editors:
    [
      {
        name: "Frank Terpstra",
        company: "Geonovum",
        companyURL: "https://www.geonovum.nl",
      }
    ],

  //-- de namen van de auteur(s) 
  //-- vul in: per auteur: name:, company:, companyURL: 
  authors:
    [
      {
        name: "Frank Terpstra",
        company: "Geonovum",
        companyURL: "https://www.geonovum.nl",
      },
	  {
        name: "Carmen Burghardt",
        company: "Geonovum",
        companyURL: "https://www.geonovum.nl",
      },
	  {
        name: "Henk Erik van der Hoek",
        company: "Geonovum",
        companyURL: "https://www.geonovum.nl",
      },
	  {
        name: "Klaas van Veelen",
        company: "Geonovum",
        companyURL: "https://www.geonovum.nl",
      }
    ],

  // TODO: Vul de github URL in.
  //neem hier de URL van de github repository op waar het respec document in staat
  github: "https://github.com/Geonovum/TransparantieApp-Applicatie-Architectuur",

  // Create PDF and link to file in header (optional):
  // TODO: Change the filename as preferred.
  //alternateFormats: [
  //    {
  //        label: "pdf",
  //        uri: "static/template.pdf",
  //    },
  //],

  // Lokale lijst voor bibliografie
  // - Kijk eerst naar de beschikbare www.specref.org .
  // - Kijk daarna in de organisatieconfig.
  // - Voeg dan pas hieronder toe.
  localBiblio: 
  {
    FSAUTH: {
      id: "FSAUTH",
      title: "Forum Standaardisatie Authenticatie Standaarden",
      href: "https://www.forumstandaardisatie.nl/open-standaarden/authenticatie-standaarden",
      status: "Definitief",
      publisher: "Geonovum",
      date: "2020-03-23"
    },
    LDV: {
      id: "LDV",
      title: "Standaard Logboek dataverwerkingen",
      href: "https://logius-standaarden.github.io/logboek-dataverwerkingen/#detailniveaus",
      status: "Werkversie",
      publisher: "Logius",
      date: "2026-01-06"
    },
    DIGIDAPP2APP: {
      id: "DIGIDAPP2APP",
      title: "Functionele beschrijving DigiD app",
      href: "https://www.logius.nl/onze-dienstverlening/toegang/digid/documentatie/functionele-beschrijving-digid-app",
      status: "Definitief",
      publisher: "Logius",
      date: "2023-11-18"
    },
	  GRIP : {
      id: "GRIP",
      title: "Grip op eigen gegevens ",
      status: "Definitief",
      publisher: "Danny Lämmerhirt & Julia Jansen (Waag)",
      date: "2024-01-05"
    },
	  KWALITATIEF: {
      id: "KWALITATIEF",
      title: "Kwalitatief burgeronderzoek: gegevens bij besluiten ",
      status: "Definitief",
      publisher: "Bureau Mare",
      date: "2025-25-07"
    },
	  DIGNITY: {
      id: "DIGNITY",
      title: "D1.2 Benchmark of factors affecting use of digital products and services across Europe",
      status: "Definitief",
      publisher: "DIGNITY",
      date: "2022-27-06"
    },
    BIBLIOTHEEKNETWERK: {
      id: "bibliotheeknetwerk",
      title: "Digitale vaardigheden en digitaal burgerschap in de bibliotheek",
      href: "https://www.bibliotheeknetwerk.nl/artikel/digitale-vaardigheden-en-digitaal-burgerschap-in-de-bibliotheek",
      status: "Definitief",
      publisher: "Bibliotheeknetwerk",
      date: "2025-10-30"
    },
    OAuth: {
      id: "OAuth",
      title: "NL GOV Assurance profile for OAuth 2.0",
      href: 'https://gitdocumentatie.logius.nl/publicatie/api/oauth/',
      status: "Definitief",
      publisher: "Logius",
      date: "2024-12-03"
    },
    NLDesign: {
      id: "NLDesign",
      title: "NL Design System",
      href: "https://nldesignsystem.nl/",
    }
  }
};
