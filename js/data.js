/*
 * ============================================================================
 *  OERALL — your Oerol 2026 content file
 * ============================================================================
 *  This is the ONLY file you need to edit to make the app yours.
 *  Everything below is sample data for Oerol 2026 (12–21 June, Terschelling).
 *
 *  HOW TO EDIT:
 *   - Change `home` to the house you're actually staying in.
 *   - Add / edit / remove items in `events` (keep the shape the same).
 *   - For each venue, fill in `lat` / `lng` so it shows on the map + routing.
 *     Tip: right-click a spot in Google Maps → "What's here?" to get coords.
 *   - `attendees` are just names (free text) — who from the group is going.
 *   - Update `links` if any official URL changes.
 *
 *  No build step. Just save and reload the page.
 * ============================================================================
 */

window.OERALL_DATA = {
  // ---- Festival meta -------------------------------------------------------
  festival: {
    name: "Oerol",
    edition: 45,
    year: 2026,
    start: "2026-06-12", // first day
    end: "2026-06-21", // last day
    island: "Terschelling",
    tagline: "Theater, muziek en kunst in het landschap",
  },

  // ---- The group (used as default attendees + the 'who's going' chips) -----
  crew: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],

  // ---- The house we sleep in (EDIT THIS) -----------------------------------
  home: {
    name: "Vakantiehuis Duinroos",
    address: "Oosterburen 12, Midsland",
    lat: 53.3886,
    lng: 5.2823,
    arrival: "2026-06-12",
    departure: "2026-06-22",
    wifi: { network: "Duinroos-Gast", password: "wadlopen2026" },
    notes: [
      "Sleutel: in het sleutelkastje naast de voordeur (code 1982).",
      "Fietsen staan in de schuur — slot hangt aan de eerste fiets.",
      "Afval: restafval op donderdag buiten zetten, GFT in de groene bak.",
      "Verwarming: thermostaat in de hal, graag op 18° bij vertrek.",
    ],
    houseRules: [
      "Schoenen uit in de woonkamer 🙂",
      "Na 23:00 rustig aan i.v.m. de buren.",
      "Roken alleen buiten op het terras.",
      "Laat de boel netjes achter — samen opruimen op de laatste ochtend.",
    ],
    nearby: [
      { label: "Supermarkt (Spar Midsland)", note: "± 600 m, dagelijks open" },
      { label: "Bakker Stavenuiter", note: "verse broodjes vanaf 7:30" },
      { label: "Fietsverhuur Zeilen", note: "voor extra fietsen / reparatie" },
      { label: "Bushalte lijn 1", note: "richting West & Oosterend" },
    ],
    emergency: [
      { label: "Alarmnummer", value: "112" },
      { label: "Huisarts Terschelling", value: "0562 442 181" },
      { label: "Verhuurder (Anneke)", value: "06 1234 5678" },
    ],
  },

  // ---- Quick links (EDIT IF URLS CHANGE) -----------------------------------
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

  // ---- Events we plan to visit (EDIT FREELY) -------------------------------
  // genre options used for color coding:
  //   "theater" | "muziek" | "straat" | "woord" | "kunst" | "eten"
  events: [
    {
      id: "ev1",
      title: "Brandende Branding",
      artist: "Toneelgroep Wad",
      genre: "theater",
      day: "2026-06-12",
      start: "20:30",
      end: "22:00",
      venue: { name: "Stortemelk (duinen)", area: "West-Terschelling", lat: 53.3705, lng: 5.2130 },
      description:
        "Locatietheater hoog in de duinen bij zonsondergang. Neem een warme jas mee — de zeewind trekt op zodra het donker wordt.",
      attendees: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],
      ticket: true,
    },
    {
      id: "ev2",
      title: "Ochtendgloren Concert",
      artist: "Ensemble Tij",
      genre: "muziek",
      day: "2026-06-13",
      start: "09:00",
      end: "10:00",
      venue: { name: "Groene Strand", area: "West-Terschelling", lat: 53.3582, lng: 5.2050 },
      description:
        "Akoestisch ochtendconcert op het strand. Op blote voeten in het zand, koffie verkrijgbaar bij de kar.",
      attendees: ["Sanne", "Iris", "Noor"],
      ticket: false,
    },
    {
      id: "ev3",
      title: "De Vloedlijn",
      artist: "Compagnie Noorderlicht",
      genre: "theater",
      day: "2026-06-13",
      start: "16:00",
      end: "17:30",
      venue: { name: "Westerkeyn (festivalhart)", area: "West-Terschelling", lat: 53.3596, lng: 5.2168 },
      description:
        "Indrukwekkende voorstelling in de grote festivaltent. Aanrader om vroeg te zijn voor een goede plek.",
      attendees: ["Koen", "Bram", "Tom"],
      ticket: true,
    },
    {
      id: "ev4",
      title: "Straattheater Parade",
      artist: "Diverse makers",
      genre: "straat",
      day: "2026-06-14",
      start: "14:00",
      end: "17:00",
      venue: { name: "Dorpsplein Midsland", area: "Midsland", lat: 53.3905, lng: 5.2799 },
      description:
        "Doorlopend straattheater door het dorp. Loop zo binnen, gratis, gezellig met z'n allen.",
      attendees: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],
      ticket: false,
    },
    {
      id: "ev5",
      title: "Woorden in de Wind",
      artist: "Spoken word collectief",
      genre: "woord",
      day: "2026-06-15",
      start: "19:00",
      end: "20:15",
      venue: { name: "Formerumerbos", area: "Formerum", lat: 53.4035, lng: 5.3210 },
      description:
        "Spoken word tussen de bomen. Intieme setting, beperkt aantal plekken.",
      attendees: ["Iris", "Noor", "Sanne"],
      ticket: true,
    },
    {
      id: "ev6",
      title: "Lichtinstallatie 'Getij'",
      artist: "Studio Wad",
      genre: "kunst",
      day: "2026-06-16",
      start: "22:00",
      end: "23:30",
      venue: { name: "Strandpaal 8", area: "Midsland aan Zee", lat: 53.4008, lng: 5.2760 },
      description:
        "Beeldende kunst die meebeweegt met het tij. Het mooist na zonsondergang. Fiets, want het is een eind lopen vanaf de weg.",
      attendees: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],
      ticket: false,
    },
    {
      id: "ev7",
      title: "Wad-diner onder de sterren",
      artist: "Oerol x lokale koks",
      genre: "eten",
      day: "2026-06-17",
      start: "18:30",
      end: "21:00",
      venue: { name: "Polder bij Hoorn", area: "Hoorn", lat: 53.3760, lng: 5.3530 },
      description:
        "Langgerekt diner in de polder met lokale producten. Reserveren verplicht — wij hebben een tafel van 6.",
      attendees: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],
      ticket: true,
    },
    {
      id: "ev8",
      title: "Oosterend Live",
      artist: "The Dune Brothers",
      genre: "muziek",
      day: "2026-06-19",
      start: "21:00",
      end: "23:30",
      venue: { name: "Haven Oosterend", area: "Oosterend", lat: 53.4283, lng: 5.3965 },
      description:
        "Stevige avond livemuziek aan het oostelijke puntje van het eiland. Laatste bus mis je gegarandeerd — neem de fiets.",
      attendees: ["Koen", "Bram", "Tom", "Noor"],
      ticket: true,
    },
    {
      id: "ev9",
      title: "Slotvoorstelling: Eilandgloed",
      artist: "Grote ensemble",
      genre: "theater",
      day: "2026-06-21",
      start: "20:00",
      end: "22:00",
      venue: { name: "Brandaris / Haven", area: "West-Terschelling", lat: 53.3625, lng: 5.2196 },
      description:
        "Grootse afsluiter onder de vuurtoren. Het hele eiland komt samen — kom op tijd.",
      attendees: ["Koen", "Sanne", "Bram", "Iris", "Tom", "Noor"],
      ticket: true,
    },
  ],
};
