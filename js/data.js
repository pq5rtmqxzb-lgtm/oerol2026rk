/*
 * ============================================================================
 *  OERALL — onze Oerol 2026 content file
 * ============================================================================
 *  Dit is het enige bestand dat je hoeft te bewerken om de app bij te werken.
 *  Inhoud is gebaseerd op ons groepsschema (Oerol 2026, 12–21 juni, Terschelling).
 *
 *  BEWERKEN:
 *   - `home`     → ons huis (Castor in Oosterend).
 *   - `events`   → de gekozen voorstelling per dag (de "blauwe" keuze) + extra's.
 *   - `crew`     → onze hele groep.
 *   - `occupancy`→ wie slaapt welke nacht.
 *
 *  LET OP locaties: de kaart is Google Maps en zoekt op het echte adres/naam
 *  (venue.query), dus elke locatie staat op de juiste plek — ook voor "Open in
 *  Google Maps" en de route. `lat`/`lng` zijn alleen nog een optionele
 *  terugvaloptie; pas vooral `query` aan als een locatie verkeerd staat.
 *
 *  Geen build-stap. Opslaan en pagina verversen.
 * ============================================================================
 */

window.OERALL_DATA = {
  // ---- Festival meta -------------------------------------------------------
  festival: {
    name: "Oerol",
    edition: 45,
    year: 2026,
    start: "2026-06-12", // eerste festivaldag
    end: "2026-06-21", // laatste festivaldag
    island: "Terschelling",
    tagline: "Theater, muziek en kunst in het landschap",
    // Centrale coördinaat voor de weersverwachting op 'Vandaag' (open-meteo).
    // Eiland is klein, één punt volstaat. Valt anders terug op het huis.
    lat: 53.39,
    lng: 5.31,
    // Zee-coördinaat voor de getijden (open-meteo marine API). Moet in open
    // water liggen (ten zuidwesten van West-Terschelling), niet op land.
    marineLat: 53.33,
    marineLng: 5.2,
  },

  // ---- De hele groep -------------------------------------------------------
  crew: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Fabian", "Jaco", "Joeri"],

  // ---- Ons huis ------------------------------------------------------------
  home: {
    name: "Vakantiehuis Castor",
    address: "Lijkweg 3-2, 8897 HC Oosterend (Terschelling)",
    // Coördinaten bij benadering; de Maps-knop gebruikt het volledige adres (query).
    lat: 53.4361,
    lng: 5.4163,
    query: "Lijkweg 3, 8897 HC Oosterend, Terschelling",
    arrival: "2026-06-15", // eerste nacht: ma 15 juni
    departure: "2026-06-21", // iedereen vertrekt zo 21 juni
    wifi: { network: "nog invullen", password: "nog invullen" },
    notes: [
      "7 slaapplekken — zie 'Wie slaapt wanneer' hieronder.",
      "Oosterend ligt aan de oostkant; de meeste voorstellingen zijn westelijker, dus neem de fiets.",
      "Vul hier de praktische dingen in zodra we ze van Castor weten (sleutel, afval, verwarming).",
    ],
    houseRules: [
      "Laat de boel netjes achter — samen opruimen op de laatste ochtend (zo 21 juni).",
      "Na 23:00 een beetje rustig i.v.m. de buren.",
      "Zondag checken hoe laat iedereen weg gaat — boot op tijd halen!",
    ],
    nearby: [
      { label: "Oosterend dorp", note: "klein, gezellig oostelijk dorp" },
      { label: "Strand bij paal 18–20", note: "dichtstbijzijnde strandopgang" },
      { label: "Fietsroute naar West", note: "± 12 km langs de zuidkant" },
    ],
    emergency: [
      { label: "Alarmnummer", value: "112" },
      { label: "Huisarts Terschelling", value: "0562 442 181" },
      { label: "Verhuurder Castor", value: "nog invullen" },
    ],
  },

  // ---- Wie slaapt welke nacht (Huisbezetting) ------------------------------
  occupancy: [
    { date: "2026-06-15", who: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies"] },
    { date: "2026-06-16", who: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies"] },
    { date: "2026-06-17", who: ["Rik", "Kevin", "Marianne", "Marieke", "Jaco"] },
    { date: "2026-06-18", who: ["Rik", "Kevin", "Marianne", "Marieke", "Fabian", "Jaco"] },
    { date: "2026-06-19", who: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"] },
    { date: "2026-06-20", who: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"] },
  ],

  // ---- Quick links ---------------------------------------------------------
  links: {
    // icon = naam uit de icoonset in js/app.js (ICONS); valt terug op ruwe tekst/emoji.
    oerol: { label: "Officiële Oerol-website", url: "https://oerol.nl/en/", icon: "events" },
    krant: { label: "Oerol Krant (dagkrant)", url: "https://dagkrant.oerol.nl/", icon: "news" },
    program: { label: "Volledig programma", url: "https://oerol.nl/en/programmeoverview/", icon: "calendar" },
    tickets: { label: "Tickets & verkoop", url: "https://oerol.nl/en/plan-your-visit/tickets-and-sales/", icon: "ticket" },
    map: { label: "Oerol plattegrond", url: "https://kaart.oerol.nl/", icon: "map" },
    ferry: { label: "Veerboot (Rederij Doeksen)", url: "https://www.rederij-doeksen.nl/en", icon: "ferry" },
    weather: { label: "Weer op Terschelling", url: "https://www.knmi.nl/nederland-nu/weer/waarschuwingen", icon: "w-partly" },
    instagram: { label: "Oerol op Instagram", url: "https://www.instagram.com/oerolterschelling/", icon: "camera" },
  },

  // ---- Veerboot (Rederij Doeksen, Harlingen <-> West-Terschelling) ---------
  // NOG INVULLEN: neem de juni-dienstregeling over van rederij-doeksen.nl.
  // Zolang de lijsten leeg zijn verbergt de app het boten-kaartje vanzelf.
  // type: "boot" = gewone veerboot (± 1u55), "snel" = sneldienst (± 45 min).
  // Voorbeeldregel: { time: "07:30", type: "boot" }
  ferry: {
    operator: "Rederij Doeksen",
    crossingMin: { boot: 115, snel: 45 },
    schedule: {
      "harlingen-terschelling": {
        "ma-vr": [],
        "za": [],
        "zo": [],
      },
      "terschelling-harlingen": {
        "ma-vr": [],
        "za": [],
        "zo": [],
      },
    },
    note: "Tijden onder voorbehoud — check rederij-doeksen.nl en reserveer op tijd.",
  },

  // ---- Getijden: vaste terugvaltabel (West-Terschelling) -------------------
  // Wordt alleen gebruikt als de getijden-API (open-meteo marine) niet lukt.
  // NOG INVULLEN vanaf getij.nl (station West-Terschelling) — 10 regels data
  // en de getijden werken 100% offline. Voorbeeldregel:
  //   { day: "2026-06-12", high: ["03:40", "16:05"], low: ["11:20", "23:50"] },
  tides: [],

  // ---- Terschelling in beeld (galerij op 'Vandaag' en 'Meer') --------------
  // Handgemaakte natuurkunst van het eiland. img verwijst naar de SVG's in /img.
  // title + caption verschijnen als museumlabel onder elke plaat.
  gallery: [
    {
      img: "img/brandaris.svg",
      title: "De Brandaris",
      caption: "De oudste vuurtoren van Nederland houdt al sinds 1594 de wacht over West. Bij laagstaande zon kleurt het baken oranje boven de duinen.",
    },
    {
      img: "img/duinen.svg",
      title: "Duinen & helmgras",
      caption: "Zandpaden slingeren door het golvende duinlandschap. Het helmgras houdt het eiland bijeen — buig je oor en je hoort het ruisen.",
    },
    {
      img: "img/wad.svg",
      title: "Het Wad",
      caption: "Bij eb valt de Waddenzee droog tot glanzende slikplaten vol wadvogels. UNESCO-werelderfgoed, en het grootste podium van Oerol.",
    },
    {
      img: "img/kwelder.svg",
      title: "Kwelder & schapen",
      caption: "Op de zilte graslanden achter de dijk grazen schapen tussen het lamsoor. Wijds, weids en typisch Terschellings.",
    },
    {
      img: "img/strand.svg",
      title: "Noordzeestrand",
      caption: "Dertig kilometer onafgebroken strand langs de hele noordkant. Ruimte genoeg voor een voorstelling onder de sterren.",
    },
    {
      img: "img/cranberry.svg",
      title: "Cranberryveld",
      caption: "In de natte duinvalleien groeien de wereldberoemde Terschellinger cranberries — volgens de sage aangespoeld uit een gestrand vat.",
    },
  ],

  // ---- Onze voorstellingen -------------------------------------------------
  // De "blauwe" keuze per dag uit ons schema. Woensdag 17 juni is een rustdag
  // (geen vaste keuze). genre: "theater" | "muziek" | "straat" | "woord" |
  // "kunst" | "eten" | "dans".
  // attendees = wie er volgens rij 3 ("Wie") daadwerkelijk bij is.
  // venue.query = het Oerol-adres uit de sheet → wordt gebruikt voor de route.
  // end (optioneel, "HH:MM") = eindtijd; zonder end rekent de app met 1 uur.
  // Vul echte eindtijden in zodra bekend — dan kloppen "nog X min", de vrije
  // gaten in de dagtijdlijn en de agenda-export precies.
  events: [
    {
      id: "ma15-notyet",
      title: "Not Yet",
      artist: "Ivgi&Greben",
      genre: "dans",
      day: "2026-06-15",
      start: "15:00",
      venue: { name: "Heester Dyk", area: "loc. 14", lat: 53.392, lng: 5.282, approx: true, query: "Heester Dyk, Terschelling" },
      description:
        "Het Leeuwarder dansgezelschap Ivgi&Greben keert terug met Not Yet: dansers én publiek leggen samen een route af door een onbekend landschap, op zoek naar houvast en verbinding met de plek en met elkaar.",
      attendees: ["Rik", "Marianne", "Marieke", "Kevin"],
      ticket: true,
    },
    {
      id: "di16-aisademeter",
      title: "Aisa Demeter",
      artist: "Anne-Fay Kops / Orkater",
      genre: "theater",
      day: "2026-06-16",
      start: "18:45",
      venue: { name: "Bostheater", area: "vaste locatie", lat: 53.413, lng: 5.345, approx: true, query: "Bostheater Oerol, Terschelling" },
      description:
        "Orkater komt met speciale Oerol-edities van Aisa Demeter. Een moderne muzikale mythe over de kracht van woede, met indringende zangmelodieën, Caribische samples en diepe baslijnen.",
      attendees: ["Rik", "Marianne", "Marieke", "Kevin", "Anja", "Marlies"],
      ticket: true,
    },
    {
      id: "do18-reinaard",
      title: "ReinAard",
      artist: "Tom Lanoye",
      genre: "woord",
      day: "2026-06-18",
      start: "14:00",
      venue: { name: "Bostheater", area: "vaste locatie", lat: 53.413, lng: 5.345, approx: true, query: "Bostheater Oerol, Terschelling" },
      description:
        "Woordkunst van Tom Lanoye: een eigentijdse ReinAard. Onze donderdagmiddag-keuze.",
      attendees: ["Rik", "Marianne", "Marieke", "Kevin", "Jaco"],
      ticket: true,
    },
    {
      id: "do18-starmap",
      title: "Star Map",
      artist: "Cello Octet Amsterdam / Kate Moore",
      genre: "theater",
      day: "2026-06-18",
      start: "22:15",
      venue: { name: "Strand Midsland aan Zee", area: "loc. 21", lat: 53.413, lng: 5.293, approx: true, query: "Strand Midsland aan Zee, Terschelling" },
      description:
        "Late voorstelling onder de sterren met het Cello Octet Amsterdam en muziek van Kate Moore. Op het strand bij Midsland aan Zee — neem een warme jas mee, het wordt fris en donker. (Volgens het schema: 'Star map voor 3'.)",
      attendees: ["Rik", "Marianne", "Marieke", "Kevin", "Jaco"],
      ticket: true,
    },
    {
      id: "vr19-bambie",
      title: "Bambie Gaat Tot De Bodem",
      artist: "Bambie",
      genre: "theater",
      day: "2026-06-19",
      start: "11:30",
      venue: { name: "Landje Laura en Wietse", area: "loc. 25 · Oost", lat: 53.432, lng: 5.405, approx: true, query: "Landje Laura en Wietse, Oosterend, Terschelling" },
      description:
        "Fysiek, absurd en hilarisch beeldend theater van Bambie. Onze vrijdagochtend-keuze, op een landje aan de oostkant.",
      attendees: ["Rik", "Marianne", "Marieke", "Kevin", "Jaco", "Fabian"],
      ticket: true,
    },
    {
      id: "za20-northsidestory",
      title: "North Side Story",
      artist: "YoungGangsters",
      genre: "theater",
      day: "2026-06-20",
      start: "15:30",
      venue: { name: "Dellewal", area: "loc. 4 · West", lat: 53.357, lng: 5.230, approx: true, query: "Dellewal, West-Terschelling" },
      description:
        "Buitenspektakel bij Dellewal: een actie-musical en moderne Romeo & Julia van YoungGangsters, over de spanning tussen oude en nieuwe eilanders — trots versus verandering, vlees versus veggie, pils versus kombucha.",
      attendees: ["Rik", "Marianne", "Joeri", "Kevin", "Jaco", "Fabian"],
      ticket: true,
    },
    {
      id: "zo21-azc",
      title: "AZC de Musical",
      artist: "TOBAL",
      genre: "theater",
      day: "2026-06-21",
      start: "13:00",
      venue: { name: "Parkeerplaats Formerum aan Zee", area: "loc. 24 · Midden", lat: 53.427, lng: 5.345, approx: true, query: "Parkeerplaats Formerum aan Zee, Terschelling" },
      description:
        "TOBAL speelt AZC de Musical: waar ooit een asielzoekerscentrum stond en nu dure appartementen staan, klinkt nog steeds de roep 'AZC ga weg'. Onze afsluiter op zondag bij Formerum aan Zee — check je boottijd!",
      attendees: ["Rik", "Marianne", "Joeri", "Kevin", "Jaco", "Fabian"],
      ticket: true,
    },
  ],
};
