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
 *  LET OP locaties: Oerol publiceert geen exacte GPS-coördinaten, dus de
 *  speldjes op de kaart staan BIJ BENADERING (venue.approx = true). De knop
 *  "Route ernaartoe" zoekt op naam in Google Maps (venue.query), dus de
 *  navigatie klopt ook als het speldje een paar honderd meter verkeerd staat.
 *  Weet je de exacte plek? Zet dan `lat`/`lng` goed en haal `approx` weg.
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
  },

  // ---- De hele groep -------------------------------------------------------
  crew: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Lori", "Fabian", "Jaco", "Joeri"],

  // ---- Ons huis ------------------------------------------------------------
  home: {
    name: "Vakantiehuis Castor",
    address: "Oosterend, Terschelling",
    // Coördinaten van Oosterend (bij benadering — zet exact op het adres van Castor).
    lat: 53.4366,
    lng: 5.4181,
    approx: true,
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
    { date: "2026-06-15", who: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Lori"] },
    { date: "2026-06-16", who: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Lori"] },
    { date: "2026-06-17", who: ["Rik", "Kevin", "Marianne", "Marieke", "Jaco"] },
    { date: "2026-06-18", who: ["Rik", "Kevin", "Marianne", "Marieke", "Fabian", "Jaco"] },
    { date: "2026-06-19", who: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"] },
    { date: "2026-06-20", who: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"] },
  ],

  // ---- Quick links ---------------------------------------------------------
  links: {
    oerol: { label: "Officiële Oerol-website", url: "https://oerol.nl/en/", icon: "🎭" },
    krant: { label: "Oerol Krant (dagkrant)", url: "https://oerol.nl/nl/oerol-krant/", icon: "📰" },
    program: { label: "Volledig programma", url: "https://oerol.nl/en/programmeoverview/", icon: "📅" },
    tickets: { label: "Tickets & verkoop", url: "https://oerol.nl/en/plan-your-visit/tickets-and-sales/", icon: "🎟️" },
    map: { label: "Oerol plattegrond", url: "https://oerol.nl/en/plan-your-visit/", icon: "🗺️" },
    ferry: { label: "Veerboot (Rederij Doeksen)", url: "https://www.rederij-doeksen.nl/en", icon: "⛴️" },
    weather: { label: "Weer op Terschelling", url: "https://www.knmi.nl/nederland-nu/weer/waarschuwingen", icon: "🌤️" },
    instagram: { label: "Oerol op Instagram", url: "https://www.instagram.com/oerolterschelling/", icon: "📸" },
  },

  // ---- Onze voorstellingen -------------------------------------------------
  // De "blauwe" keuze per dag uit ons schema, plus een paar vriendenacties.
  // genre: "theater" | "muziek" | "straat" | "woord" | "kunst" | "eten" | "dans"
  // attendees = wie er die dag op het eiland is (uit de huisbezetting).
  events: [
    {
      id: "ma15-notyet",
      title: "Not Yet",
      artist: "Ivgi&Greben",
      genre: "dans",
      day: "2026-06-15",
      start: "15:00",
      venue: { name: "Duinen", area: "Terschelling", lat: 53.412, lng: 5.355, approx: true, query: "Ivgi&Greben Not Yet Oerol Terschelling" },
      description:
        "Het Leeuwarder dansgezelschap Ivgi&Greben keert terug met Not Yet: dansers én publiek leggen samen een route af door een onbekend landschap, op zoek naar houvast en verbinding met de plek en met elkaar.",
      attendees: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Lori"],
      ticket: true,
    },
    {
      id: "di16-aisademeter",
      title: "Aisa Demeter",
      artist: "Anne-Fay Kops / Orkater",
      genre: "theater",
      day: "2026-06-16",
      start: "18:45",
      venue: { name: "Festivalhart (West)", area: "West-Terschelling", lat: 53.360, lng: 5.217, approx: true, query: "Aisa Demeter Orkater Oerol Terschelling" },
      description:
        "Orkater komt met speciale Oerol-edities van Aisa Demeter. Een moderne muzikale mythe over de kracht van woede, met indringende zangmelodieën, Caribische samples en diepe baslijnen.",
      attendees: ["Rik", "Kevin", "Marianne", "Marieke", "Anja", "Marlies", "Lori"],
      ticket: true,
    },
    {
      id: "wo17-destreken",
      title: "De Streken (vriendenactie)",
      artist: "Marc van Vliet",
      genre: "kunst",
      day: "2026-06-17",
      start: "10:00",
      venue: { name: "Dijk Perkweg (loc. 36)", area: "Oost-Terschelling", lat: 53.430, lng: 5.400, approx: true, query: "Marc van Vliet De Streken Oerol Terschelling" },
      description:
        "Vriendenactie: uitleg bij het getijdenkunstwerk De Streken. Marieke's keuze — sluit gerust aan.",
      attendees: ["Marieke"],
      ticket: false,
    },
    {
      id: "wo17-dansenaanzee",
      title: "Dansen aan zee (vriendenactie)",
      artist: "Oerol",
      genre: "muziek",
      day: "2026-06-17",
      start: "20:00",
      venue: { name: "Strand", area: "Noordkant", lat: 53.410, lng: 5.345, approx: true, query: "Dansen aan zee Oerol Terschelling strand" },
      description:
        "Onze woensdagavond: dansen aan zee. Gezellig met de groep die er die dag is.",
      attendees: ["Rik", "Kevin", "Marianne", "Marieke", "Jaco"],
      ticket: false,
    },
    {
      id: "do18-reinaard",
      title: "ReinAard",
      artist: "Tom Lanoye",
      genre: "woord",
      day: "2026-06-18",
      start: "14:00",
      venue: { name: "Festivalhart (West)", area: "West-Terschelling", lat: 53.361, lng: 5.218, approx: true, query: "Tom Lanoye ReinAard Oerol Terschelling" },
      description:
        "Woordkunst van Tom Lanoye: een eigentijdse ReinAard. Onze donderdagmiddag-keuze.",
      attendees: ["Rik", "Kevin", "Marianne", "Marieke", "Fabian", "Jaco"],
      ticket: true,
    },
    {
      id: "do18-starmap",
      title: "Star Map",
      artist: "Cello Octet Amsterdam / Kate Moore",
      genre: "theater",
      day: "2026-06-18",
      start: "22:15",
      venue: { name: "Duinen (avond)", area: "Midsland aan Zee", lat: 53.401, lng: 5.276, approx: true, query: "Cello Octet Amsterdam Star Map Oerol Terschelling" },
      description:
        "Late voorstelling onder de sterren met het Cello Octet Amsterdam en muziek van Kate Moore. Neem een warme jas mee — het wordt fris en donker.",
      attendees: ["Rik", "Kevin", "Marianne", "Marieke", "Fabian", "Jaco"],
      ticket: true,
    },
    {
      id: "vr19-bambie",
      title: "Bambie Gaat Tot De Bodem",
      artist: "Bambie",
      genre: "theater",
      day: "2026-06-19",
      start: "11:30",
      venue: { name: "Festivalhart (West)", area: "West-Terschelling", lat: 53.360, lng: 5.216, approx: true, query: "Bambie Gaat Tot De Bodem Oerol Terschelling" },
      description:
        "Fysiek, absurd en hilarisch beeldend theater van Bambie. Onze vrijdagochtend-keuze.",
      attendees: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"],
      ticket: true,
    },
    {
      id: "za20-northsidestory",
      title: "North Side Story",
      artist: "YoungGangsters",
      genre: "theater",
      day: "2026-06-20",
      start: "15:30",
      venue: { name: "Buitenlocatie (duinen)", area: "Midsland-Noord", lat: 53.405, lng: 5.290, approx: true, query: "North Side Story YoungGangsters Oerol Terschelling" },
      description:
        "Buitenspektakel: een actie-musical en moderne Romeo & Julia van YoungGangsters, over de spanning tussen oude en nieuwe eilanders — trots versus verandering, vlees versus veggie, pils versus kombucha.",
      attendees: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"],
      ticket: true,
    },
    {
      id: "zo21-azc",
      title: "AZC de Musical",
      artist: "TOBAL",
      genre: "theater",
      day: "2026-06-21",
      start: "13:00",
      venue: { name: "Voormalig AZC-terrein", area: "West-Terschelling", lat: 53.366, lng: 5.235, approx: true, query: "AZC de Musical TOBAL Oerol Terschelling" },
      description:
        "TOBAL speelt AZC de Musical op de plek waar ooit een asielzoekerscentrum stond. Waar nu dure appartementen staan, klinkt nog steeds de roep: AZC ga weg. Onze afsluiter op zondag — check je boottijd!",
      attendees: ["Rik", "Kevin", "Marianne", "Fabian", "Jaco", "Joeri"],
      ticket: true,
    },
  ],
};
