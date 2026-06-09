/* ============================================================
   OERALL — app logic + hash router (no build step)
   ============================================================ */

(function () {
  var D = window.OERALL_DATA;
  var app = document.getElementById("app");
  var tickTimer = null; // live countdown ticker (Vandaag)

  // ---- Dutch date helpers --------------------------------------------------
  var DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  var MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  function parseDateTime(day, time) {
    // day "2026-06-13", time "20:30" -> local Date
    var p = day.split("-").map(Number);
    var t = (time || "00:00").split(":").map(Number);
    return new Date(p[0], p[1] - 1, p[2], t[0], t[1], 0, 0);
  }
  // ISO van open-meteo ("2026-06-18T14:00") -> local Date, zonder op de
  // browser-parser van new Date(string) te vertrouwen.
  function parseIsoLocal(s) {
    var parts = String(s).split("T");
    return parseDateTime(parts[0], parts[1] || "00:00");
  }
  // Centrale klok. Voor het testen van festival-modus kun je de tijd verzetten
  // met localStorage.setItem("oerall.debugNow", "2026-06-18T14:30") + reload.
  // Offset i.p.v. bevroren tijd, zodat countdowns gewoon doortikken.
  var timeOffsetMs = 0;
  try {
    var dbgNow = localStorage.getItem("oerall.debugNow");
    if (dbgNow) timeOffsetMs = parseIsoLocal(dbgNow).getTime() - Date.now();
  } catch (e) {}
  function appNow() { return new Date(Date.now() + timeOffsetMs); }
  function todayIso(now) {
    now = now || appNow();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }
  function fmtClock(d) {
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  // Duur in minuten -> "45 min" / "1 u 40" / "2 u".
  function fmtDur(mins) {
    mins = Math.round(mins);
    if (mins < 60) return mins + " min";
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + " u" + (m ? " " + String(m).padStart(2, "0") : "");
  }
  function fmtDay(day) {
    var p = day.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return DAYS[d.getDay()] + " " + p[2] + " " + MONTHS[p[1] - 1];
  }
  function fmtDayLong(day) {
    var p = day.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    var names = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    return names[d.getDay()] + " " + p[2] + " " + MONTHS[p[1] - 1];
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Relatieve tijd t.o.v. nu: "nu bezig", "over 2 uur", "over 35 min".
  // Lege string als het te ver weg (> 1 dag) of al voorbij is.
  function relTime(date, now) {
    var diff = date - (now || appNow());
    if (diff <= 0) return "nu bezig";
    var mins = Math.round(diff / 6e4);
    if (mins < 60) return "over " + mins + " min";
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return "over " + hrs + " uur";
    return "";
  }
  // Resterende tijd van een lopende voorstelling: "nog 35 min" / "nog 1 uur".
  function relTimeLeft(endDate, now) {
    var mins = Math.max(1, Math.round((endDate - now) / 6e4));
    return mins < 60 ? "nog " + mins + " min" : "nog " + Math.round(mins / 60) + " uur";
  }

  // ---- Event helpers -------------------------------------------------------
  function sortedEvents() {
    return D.events.slice().sort(function (a, b) {
      return parseDateTime(a.day, a.start) - parseDateTime(b.day, b.start);
    });
  }
  // Eindtijd van een voorstelling; zonder `end` rekenen we 1 uur speelduur.
  // Eén plek voor deze aanname (ticker, tijdlijn, conflicten, .ics-export).
  function eventEnd(ev) {
    var s = parseDateTime(ev.day, ev.start);
    return ev.end ? parseDateTime(ev.day, ev.end) : new Date(s.getTime() + 36e5);
  }
  function nextEvent(now) {
    now = now || appNow();
    var list = sortedEvents();
    for (var i = 0; i < list.length; i++) {
      if (eventEnd(list[i]) >= now) return list[i];
    }
    return null;
  }
  // Voorstellingen die nu bezig zijn (start <= nu < eind).
  function currentEvents(now) {
    return sortedEvents().filter(function (e) {
      return parseDateTime(e.day, e.start) <= now && now < eventEnd(e);
    });
  }
  // Eerstvolgende voorstelling die nog moet beginnen (strikt na nu;
  // nextEvent telt lopende voorstellingen mee).
  function upcomingEvent(now) {
    var list = sortedEvents();
    for (var i = 0; i < list.length; i++) {
      if (parseDateTime(list[i].day, list[i].start) > now) return list[i];
    }
    return null;
  }
  // Ids van voorstellingen die op dezelfde dag in tijd overlappen.
  function conflictIds() {
    var out = {};
    var list = sortedEvents();
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        if (list[j].day !== list[i].day) break;
        if (parseDateTime(list[j].day, list[j].start) < eventEnd(list[i])) {
          out[list[i].id] = true;
          out[list[j].id] = true;
        }
      }
    }
    return out;
  }
  function byId(id) {
    return D.events.filter(function (e) { return e.id === id; })[0];
  }

  // ---- Afstand & fietstijd -------------------------------------------------
  function haversineKm(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad;
    var dLng = (b.lng - a.lng) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  // Geschatte fietstijd tussen twee plekken: hemelsbreed × 1.3 (wegen-factor)
  // bij 15 km/u, afgerond op 5 minuten. null als coördinaten ontbreken.
  function cycleMinutes(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    var km = haversineKm(a, b) * 1.3;
    return Math.max(5, Math.round((km / 15) * 60 / 5) * 5);
  }
  function festivalDays() {
    var s = parseDateTime(D.festival.start, "00:00");
    var e = parseDateTime(D.festival.end, "00:00");
    var out = [];
    for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      out.push(iso);
    }
    return out;
  }

  var GENRE = {
    theater: { label: "Theater", color: "#cf6b43" },
    muziek: { label: "Muziek", color: "#3c6a78" },
    straat: { label: "Straat", color: "#b07a2b" },
    woord: { label: "Woord", color: "#5d6c8a" },
    kunst: { label: "Kunst", color: "#9c5a78" },
    eten: { label: "Eten", color: "#6f8048" },
    dans: { label: "Dans", color: "#7a4a62" },
  };
  function genre(g) { return GENRE[g] || { label: g || "Oerol", color: "#cf6b43" }; }

  // ---- Icoonset (handgetekend, in dezelfde stijl als de natuurkunst) --------
  // Lijn-iconen op currentColor, zodat ze meekleuren met tekst en dark mode.
  var ICONS = {
    "today": "<circle cx=\"12\" cy=\"12\" r=\"4.3\"/><path d=\"M12 2.6v2.4M12 19v2.4M21.4 12H19M5 12H2.6M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3\"/>",
    "events": "<path d=\"M4 5h6.5v6c0 3-1.6 5-3.25 5S4 14 4 11Z\"/><path d=\"M13.5 5H20v6c0 3-1.6 5-3.25 5S13.5 14 13.5 11Z\"/><path d=\"M6 9.2h2.5M15.5 9.2H18\"/><path d=\"M5.6 12.6c.6.9 2.2.9 2.8 0M15.6 12.6c.6.9 2.2.9 2.8 0\"/>",
    "map": "<path d=\"M9 4 3 6.2v13.8l6-2.2 6 2.2 6-2.2V6l-6 2.2Z\"/><path d=\"M9 4v13.8M15 8.2V22\"/><circle cx=\"6\" cy=\"10\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>",
    "home": "<path d=\"M3.5 11.5 12 4l8.5 7.5\"/><path d=\"M5.5 10v9.5h13V10\"/><path d=\"M10 19.5v-5h4v5\"/>",
    "more": "<circle cx=\"12\" cy=\"12\" r=\"8.4\"/><path d=\"m14.8 9.2-1.9 5-5 1.9 1.9-5Z\" fill=\"currentColor\" fill-opacity=\".16\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>",
    "ticket": "<path d=\"M4 6.5h16a1 1 0 0 1 1 1V10a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4V7.5a1 1 0 0 1 1-1Z\" fill=\"currentColor\" fill-opacity=\".16\"/><path d=\"M14 7v2.2M14 14.8V17\"/>",
    "free": "<path d=\"M4 6.5h16a1 1 0 0 1 1 1V10a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4V7.5a1 1 0 0 1 1-1Z\"/><path d=\"m8.2 12 2.1 2.2 4-4.4\"/>",
    "hourglass": "<path d=\"M7 3.5h10M7 20.5h10\"/><path d=\"M7.5 3.5c0 4 4 5.5 4.5 8.5-.5 3-4.5 4.5-4.5 8.5\"/><path d=\"M16.5 3.5c0 4-4 5.5-4.5 8.5.5 3 4.5 4.5 4.5 8.5\"/><path d=\"M9.3 18.5c.7-1.6 2-2.5 2.7-2.5s2 .9 2.7 2.5Z\" fill=\"currentColor\" stroke=\"none\"/>",
    "spinner": "<path d=\"M12 3a9 9 0 1 0 9 9\" stroke-linecap=\"round\"/>",
    "clock": "<circle cx=\"12\" cy=\"12\" r=\"8.4\"/><path d=\"M12 7.4V12l3.2 2\"/>",
    "calendar": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"2.2\"/><path d=\"M3.5 9.3h17M8 3v3.6M16 3v3.6\"/><circle cx=\"8.4\" cy=\"13\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"13\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.6\" cy=\"13\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>",
    "pin": "<path d=\"M12 21.5c0 0-7-6.4-7-11.5a7 7 0 0 1 14 0c0 5.1-7 11.5-7 11.5Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.6\"/>",
    "bike": "<circle cx=\"6\" cy=\"16.5\" r=\"3.4\"/><circle cx=\"18\" cy=\"16.5\" r=\"3.4\"/><path d=\"M6 16.5 10 9h5l2.6 7.5M9 9h-1.6M14.5 9l-3.4 7.5M14.8 9.2 16 7h2\"/>",
    "share": "<path d=\"M12 3.4v11.2M8.4 7 12 3.4 15.6 7\"/><path d=\"M6 11.5v8.1h12v-8.1\"/>",
    "wind": "<path d=\"M3 9h11a2.4 2.4 0 1 0-2.4-2.6\"/><path d=\"M3 13.5h15a2.4 2.4 0 1 1-2.4 2.6\"/><path d=\"M3 18h8.5\"/>",
    "news": "<path d=\"M4 5.5h13v13a1.5 1.5 0 0 1-1.5 1.5H5a1 1 0 0 1-1-1Z\"/><path d=\"M17 9h3v9.5a1.5 1.5 0 0 1-1.5 1.5\"/><path d=\"M7 9h7M7 12.3h7M7 15.6h4.5\"/>",
    "check": "<path d=\"M5 12.5 10 17.5 19 6.5\"/>",
    "copy": "<rect x=\"8.5\" y=\"8.5\" width=\"11\" height=\"11\" rx=\"2.4\"/><path d=\"M5.5 15.5H5A1.5 1.5 0 0 1 3.5 14V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5\"/>",
    "note": "<path d=\"M9.5 3.5 14.5 3.5 13.8 9 16.5 12 7.5 12 10.2 9Z\" fill=\"currentColor\" fill-opacity=\".16\"/><path d=\"M12 12v8\"/>",
    "bulb": "<path d=\"M9 17h6M10 20h4\"/><path d=\"M8 13.2A5 5 0 1 1 16 13.2c-.9 1-1.5 1.8-1.5 3.1h-5C9.5 15 8.9 14.2 8 13.2Z\"/>",
    "camera": "<rect x=\"3\" y=\"6.5\" width=\"18\" height=\"13\" rx=\"2.4\"/><path d=\"M8.5 6.5 10 4h4l1.5 2.5\"/><circle cx=\"12\" cy=\"13\" r=\"3.4\"/>",
    "ferry": "<path d=\"M4 16 5.5 11h13L20 16\"/><path d=\"M3 16.5c1.6 1.4 2.7 1.4 4.3 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.7 1.4 4.3 0\"/><path d=\"M8 11V8h8v3M12 4.5v3\"/>",
    "link": "<path d=\"M9.5 14.5 14.5 9.5\"/><path d=\"M8 11 6 13a3.2 3.2 0 0 0 4.5 4.5l2-2\"/><path d=\"M16 13l2-2A3.2 3.2 0 0 0 13.5 6.5l-2 2\"/>",
    "w-clear": "<circle cx=\"12\" cy=\"12\" r=\"4.2\"/><path d=\"M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6\"/>",
    "w-partly": "<circle cx=\"8.5\" cy=\"8\" r=\"3\"/><path d=\"M8.5 2.8v1.6M3.3 8H4.9M12.1 4.4l-1.1 1.1M5.1 5.5 4 4.4\"/><path d=\"M9 19.5h8.2a3.4 3.4 0 0 0 .2-6.8 4.6 4.6 0 0 0-8.7-1A3.6 3.6 0 0 0 9 19.5Z\"/>",
    "w-cloudy": "<path d=\"M7.5 18.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 18.5Z\"/>",
    "w-fog": "<path d=\"M7.5 14.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 14.5Z\"/><path d=\"M5 18h14M7 21h11\"/>",
    "w-drizzle": "<path d=\"M7.5 14.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 14.5Z\"/><path d=\"M9 17.5v2M13 17.5v2.5M17 17.5v2\"/>",
    "w-rain": "<path d=\"M7.5 13.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 13.5Z\"/><path d=\"M8.5 16.5 7.5 20M12.2 16.5 11.2 20M15.9 16.5 14.9 20\"/>",
    "w-showers": "<path d=\"M7.5 12.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 12.5Z\"/><path d=\"M9 15.5 7 20M13 15.5 11 20M17 15.5 15 20\"/>",
    "w-snow": "<path d=\"M7.5 13h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 13Z\"/><path d=\"M9 17.5v2M12 16.5v3M15 17.5v2\" /><circle cx=\"9\" cy=\"18.5\" r=\".4\" fill=\"currentColor\"/>",
    "w-thunder": "<path d=\"M7.5 12.5h9.2a3.7 3.7 0 0 0 .2-7.4 5 5 0 0 0-9.5-1.1A3.8 3.8 0 0 0 7.5 12.5Z\"/><path d=\"m12.5 14-2.5 3.6h2.4L10.6 21\" /><path d=\"m12.5 14-2.5 3.6h2.4L10.6 21\" fill=\"currentColor\" fill-opacity=\".15\"/>",
    "w-default": "<path d=\"M12 13.5V6.5a2 2 0 0 1 4 0v7a3.6 3.6 0 1 1-4 0Z\"/><circle cx=\"14\" cy=\"16.6\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/>",
    "search": "<circle cx=\"10.5\" cy=\"10.5\" r=\"5.6\"/><path d=\"m14.8 14.8 5.7 5.7\"/>",
    "refresh": "<path d=\"M19.3 12a7.3 7.3 0 1 1-2.1-5.1\"/><path d=\"M19.6 3.6v3.5h-3.5\"/>",
    "warn": "<path d=\"M12 4.2 21 19.6H3Z\"/><path d=\"M12 9.8v4.3\"/><circle cx=\"12\" cy=\"16.7\" r=\".5\" fill=\"currentColor\" stroke=\"none\"/>",
    "sunrise": "<path d=\"M3.5 17.5h17\"/><path d=\"M7.8 17.5a4.2 4.2 0 0 1 8.4 0\"/><path d=\"M12 8.2V3.8\"/><path d=\"m9.9 5.6 2.1-2.1 2.1 2.1\"/><path d=\"m5 10.4 1.7 1.7M19 10.4l-1.7 1.7\"/>",
    "sunset": "<path d=\"M3.5 17.5h17\"/><path d=\"M7.8 17.5a4.2 4.2 0 0 1 8.4 0\"/><path d=\"M12 3.8v4.4\"/><path d=\"m9.9 6.4 2.1 2.1 2.1-2.1\"/><path d=\"m5 10.4 1.7 1.7M19 10.4l-1.7 1.7\"/>",
    "wave": "<path d=\"M3 9.5c1.6 1.4 2.7 1.4 4.3 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.7 1.4 4.3 0\"/><path d=\"M3 15.5c1.6 1.4 2.7 1.4 4.3 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.8 1.4 4.4 0 1.6 1.4 2.7 1.4 4.3 0\"/>",
    "drop": "<path d=\"M12 4.5c2.6 3.4 4.4 5.7 4.4 8.1a4.4 4.4 0 1 1-8.8 0c0-2.4 1.8-4.7 4.4-8.1Z\"/>",
  };
  function icon(name, cls) {
    var inner = ICONS[name];
    if (!inner) return "";
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + inner + '</svg>';
  }

  // ---- Natuurkunst per pagina (expositie-banners) --------------------------
  var ART = {
    events: { img: "img/duinen.svg", eyebrow: "Oerol " + D.festival.year, title: "Programma" },
    map: { img: "img/wad.svg", eyebrow: "Terschelling", title: "De kaart" },
    home: { img: "img/kwelder.svg", eyebrow: "Ons onderkomen", title: D.home.name },
    more: { img: "img/strand.svg", eyebrow: "Handig", title: "Meer Oerol" },
  };
  function banner(key, titleHtml) {
    var a = ART[key];
    return (
      '<header class="banner">' +
        '<img class="banner__img" src="' + a.img + '" alt="" aria-hidden="true">' +
        '<div class="banner__scrim"></div>' +
        '<div class="banner__text">' +
          '<span class="banner__eyebrow">' + esc(a.eyebrow) + '</span>' +
          '<h1 class="banner__title">' + (titleHtml || esc(a.title)) + '</h1>' +
        '</div>' +
      '</header>'
    );
  }

  // ---- Galerij: "Terschelling in beeld" ------------------------------------
  function galleryHtml(limit) {
    var items = (D.gallery || []);
    if (!items.length) return "";
    if (limit) items = items.slice(0, limit);
    var plates = items.map(function (g, i) {
      var no = String(i + 1).padStart(2, "0");
      return (
        '<figure class="plate">' +
          '<img class="plate__img" src="' + esc(g.img) + '" alt="' + esc(g.title) + ' — Terschelling" loading="lazy">' +
          '<figcaption class="plate__cap">' +
            '<span class="plate__no">No. ' + no + '</span>' +
            '<div class="plate__title">' + esc(g.title) + '</div>' +
            '<p class="plate__text">' + esc(g.caption) + '</p>' +
          '</figcaption>' +
        '</figure>'
      );
    }).join("");
    return (
      '<div class="block-label"><span class="bar"></span>Terschelling in beeld</div>' +
      '<p class="gallery-hint">Een kleine collectie van het eiland — veeg opzij. →</p>' +
      '<div class="gallery">' + plates + '</div>'
    );
  }

  // ---- Weer (open-meteo, geen API-key) -------------------------------------
  // WMO weather_code -> { emoji, label }. Compacte map, dekt de gangbare codes.
  function weatherCode(c) {
    if (c === 0) return { icon: "w-clear", label: "Helder" };
    if (c === 1 || c === 2) return { icon: "w-partly", label: "Half bewolkt" };
    if (c === 3) return { icon: "w-cloudy", label: "Bewolkt" };
    if (c === 45 || c === 48) return { icon: "w-fog", label: "Mist" };
    if (c >= 51 && c <= 57) return { icon: "w-drizzle", label: "Motregen" };
    if (c >= 61 && c <= 67) return { icon: "w-rain", label: "Regen" };
    if (c >= 71 && c <= 77) return { icon: "w-snow", label: "Sneeuw" };
    if (c >= 80 && c <= 82) return { icon: "w-showers", label: "Buien" };
    if (c >= 95) return { icon: "w-thunder", label: "Onweer" };
    return { icon: "w-default", label: "Weer" };
  }
  function compass(deg) {
    var dirs = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
    return dirs[Math.round((deg % 360) / 45) % 8];
  }
  // Windsnelheid in m/s -> Beaufort (0–12).
  function beaufort(ms) {
    var bins = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
    for (var i = 0; i < bins.length; i++) { if (ms < bins[i]) return i; }
    return 12;
  }

  // expose helpers for map.js (single source of truth for genre colours + icons)
  window.Oerall = { fmtDay: fmtDay, genre: genre, icon: icon };

  // ---- Reusable bits -------------------------------------------------------
  function eventRow(ev, opts) {
    var g = genre(ev.genre);
    return (
      '<button class="event-row" data-event="' + ev.id + '">' +
        '<div class="event-row__time">' +
          '<span class="hh">' + esc(ev.start) + '</span>' +
          '<span class="day">' + fmtDay(ev.day).split(" ").slice(1).join(" ") + '</span>' +
        '</div>' +
        '<div class="event-row__main">' +
          '<div class="event-row__title">' + esc(ev.title) + '</div>' +
          '<div class="event-row__venue">' + icon('pin') + '<span>' + esc(ev.venue.name) + (ev.venue.area ? ' · ' + esc(ev.venue.area) : '') + '</span></div>' +
          '<span class="genre-tag" style="background:' + g.color + ';margin-top:12px;">' + g.label + '</span>' +
          (opts && opts.conflict
            ? '<span class="conflict-badge" title="Overlapt met een andere voorstelling">' + icon('warn') + 'overlapt</span>'
            : '') +
        '</div>' +
        '<div class="event-row__tail">' +
          (ev.ticket ? '<span class="tix tix--has" title="Kaartje in bezit">' + icon('ticket') + '</span>' : '<span class="tix" title="Vrij toegankelijk">' + icon('free') + '</span>') +
          '<span class="chev">›</span>' +
        '</div>' +
      '</button>'
    );
  }

  function whoChips(list) {
    if (!list || !list.length) return "";
    var chips = list.map(function (n) { return '<span class="who__chip">' + esc(n) + '</span>'; }).join("");
    return '<div class="who"><span class="who__label">Wie gaan er:</span>' + chips + '</div>';
  }

  function shareButton(ev) {
    return '<button class="btn btn--ghost" data-share="' + esc(ev.id) + '">' + icon('share') + ' Deel</button>';
  }

  function routeButtons(ev) {
    var venue = ev.venue;
    var buttons = "";
    if (venue && venue.lat) {
      var url = window.OerallMap.directionsUrl(D.home, venue);
      buttons +=
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' + url + '">' + icon('bike') + ' Route ernaartoe</a>' +
        '<a class="btn btn--ghost" href="#/map?focus=' + encodeURIComponent(venue.name) + '">' + icon('map') + ' Op de kaart</a>';
    }
    buttons += shareButton(ev);
    return '<div class="btn-row">' + buttons + '</div>';
  }

  // ---- "Nu & straks" (live kaart tijdens het festival) ----------------------
  // Chip met levende tijd: "nog 35 min" (lopend) of "over 2 uur" (straks).
  // De ticker werkt deze in-place bij via data-live / data-live-id.
  function liveChip(ev, mode, now) {
    var txt = mode === "now"
      ? relTimeLeft(eventEnd(ev), now)
      : relTime(parseDateTime(ev.day, ev.start), now);
    return '<span class="meta-chip meta-chip--rel" data-live="' + mode + '" data-live-id="' + esc(ev.id) + '"' + (txt ? '' : ' hidden') + '>' +
      icon('hourglass') + ' <span data-rel-txt>' + esc(txt) + '</span></span>';
  }
  function nowNextSection(ev, mode, now, primary) {
    var g = genre(ev.genre);
    return (
      '<div class="nc-sec">' +
        '<div class="nc-sec__label">' + (mode === "now" ? '<span class="live-dot"></span>Nu bezig' : 'Straks') + '</div>' +
        '<span class="genre-tag" style="background:' + g.color + '">' + g.label + '</span>' +
        '<div class="next-card__title" style="margin-top:8px;">' + esc(ev.title) + '</div>' +
        '<div class="next-card__artist">' + esc(ev.artist || "") + '</div>' +
        '<div class="next-card__meta">' +
          (ev.day !== todayIso(now) ? '<span class="meta-chip">' + icon('calendar') + ' ' + fmtDay(ev.day) + '</span>' : '') +
          '<span class="meta-chip">' + icon('clock') + ' ' + esc(ev.start) + (ev.end ? '–' + esc(ev.end) : '') + '</span>' +
          '<span class="meta-chip">' + icon('pin') + ' ' + esc(ev.venue.name) + '</span>' +
          liveChip(ev, mode, now) +
        '</div>' +
        (primary ? routeButtons(ev) + whoChips(ev.attendees) : '') +
      '</div>'
    );
  }
  function nowNextCard(now) {
    var label = '<div class="block-label"><span class="bar"></span>Nu &amp; straks</div>';
    var nowEvs = currentEvents(now);
    var up = upcomingEvent(now);
    if (!nowEvs.length && !up) {
      return label + '<div class="card">Alles gespeeld — tijd voor het strand! 🏖️</div>';
    }
    // route/wie-knoppen alleen bij de "belangrijkste" sectie, anders wordt
    // de kaart een muur van knoppen
    var primaryId = nowEvs.length ? nowEvs[0].id : up.id;
    var sections = nowEvs.map(function (ev) {
      return nowNextSection(ev, "now", now, ev.id === primaryId);
    }).join("");
    if (up) sections += nowNextSection(up, "next", now, up.id === primaryId);
    var dayNo = Math.floor((now - parseDateTime(D.festival.start, "00:00")) / 864e5) + 1;
    return (
      label +
      '<div class="next-card">' +
        '<div class="next-card__strip"><span>Live op het eiland</span><span>Dag ' + dayNo + '</span></div>' +
        '<div class="next-card__body">' + sections + '</div>' +
      '</div>'
    );
  }

  // ---- "Het eiland vandaag": getijden + boten -------------------------------
  function ferryDayType(d) {
    var g = d.getDay();
    return g === 0 ? "zo" : g === 6 ? "za" : "ma-vr";
  }
  // Eerstvolgende afvaarten in een richting; vult aan met morgenochtend.
  function nextFerries(dirKey, now, count) {
    var F = D.ferry;
    if (!F || !F.schedule || !F.schedule[dirKey]) return [];
    var out = [];
    [0, 1].forEach(function (dayOffset) {
      if (out.length >= count && dayOffset > 0) return;
      var d = new Date(now.getTime() + dayOffset * 864e5);
      (F.schedule[dirKey][ferryDayType(d)] || []).forEach(function (s) {
        if (parseDateTime(todayIso(d), s.time) > now) {
          out.push({ time: s.time, type: s.type, tomorrow: dayOffset > 0 });
        }
      });
    });
    return out.slice(0, count);
  }
  function ferryCardHtml(now) {
    var F = D.ferry;
    if (!F || !F.schedule) return "";
    var dirs = [
      { key: "terschelling-harlingen", label: "West → Harlingen" },
      { key: "harlingen-terschelling", label: "Harlingen → West" },
    ];
    // verberg het kaartje zolang de dienstregeling nog niet is ingevuld
    var filled = dirs.some(function (dir) {
      var sched = F.schedule[dir.key] || {};
      return Object.keys(sched).some(function (k) { return (sched[k] || []).length; });
    });
    if (!filled) return "";
    var rows = dirs.map(function (dir) {
      var deps = nextFerries(dir.key, now, 2);
      var v = deps.length
        ? deps.map(function (dp) {
            return (dp.tomorrow ? 'morgen ' : '') + esc(dp.time) +
              ' <small class="ferry-type">' + esc(dp.type) + '</small>';
          }).join(' · ')
        : "–";
      return '<div class="kv"><span class="k">' + dir.label + '</span><span class="v">' + v + '</span></div>';
    }).join("");
    return (
      '<div class="card island-card">' +
        '<div class="island-card__head">' + icon('ferry') + 'Volgende boten</div>' +
        rows +
        '<p class="island-card__note">' + esc(F.note || "") +
          (D.links.ferry ? ' <a target="_blank" rel="noopener" href="' + esc(D.links.ferry.url) + '">Dienstregeling →</a>' : '') +
        '</p>' +
      '</div>'
    );
  }
  function islandBlockHtml(now) {
    var ferry = ferryCardHtml(now);
    var tides =
      '<div class="card island-card" id="tides" hidden>' +
        '<div class="island-card__head">' + icon('wave') + 'Getijden <span class="island-card__sub">West-Terschelling</span></div>' +
        '<div class="kv"><span class="k">Hoogwater</span><span class="v" data-tide="high">–</span></div>' +
        '<div class="kv"><span class="k">Laagwater</span><span class="v" data-tide="low">–</span></div>' +
        '<p class="island-card__note" data-tide="note" hidden></p>' +
      '</div>';
    // zonder boot-data én zonder getijden blijft het hele blok verborgen;
    // paintTides() maakt het zichtbaar zodra er getijden zijn
    return (
      '<div id="island-block"' + (ferry ? '' : ' hidden') + '>' +
        '<div class="block-label"><span class="bar"></span>Het eiland vandaag</div>' +
        tides + ferry +
      '</div>'
    );
  }

  // ---- Pages ---------------------------------------------------------------
  function pageToday() {
    var now = appNow();
    var start = parseDateTime(D.festival.start, "00:00");
    var end = parseDateTime(D.festival.end, "23:59");
    var live = now >= start && now <= end;

    // Hero: countdown or "live"
    var heroExtra;
    if (now < start) {
      var ms = start - now;
      var days = Math.floor(ms / 864e5);
      var hrs = Math.floor((ms % 864e5) / 36e5);
      var mins = Math.floor((ms % 36e5) / 6e4);
      var secs = Math.floor((ms % 6e4) / 1e3);
      heroExtra =
        '<div class="countdown">' +
          '<div class="cd-box"><div class="num" data-cd="days">' + days + '</div><div class="lbl">dagen</div></div>' +
          '<div class="cd-box"><div class="num" data-cd="hrs">' + hrs + '</div><div class="lbl">uur</div></div>' +
          '<div class="cd-box"><div class="num" data-cd="mins">' + mins + '</div><div class="lbl">min</div></div>' +
          '<div class="cd-box"><div class="num" data-cd="secs">' + secs + '</div><div class="lbl">sec</div></div>' +
        '</div>';
    } else if (now <= end) {
      var dayNo = Math.floor((now - start) / 864e5) + 1;
      heroExtra = '<div class="hero__live"><span class="live-dot"></span>Dag ' + dayNo + ' van Oerol — geniet!</div>';
    } else {
      heroExtra = '<div class="hero__live">Tot Oerol ' + (D.festival.year + 1) + ' 👋</div>';
    }

    var hero =
      '<section class="art-hero">' +
        '<img class="art-hero__img" src="img/brandaris.svg" alt="" aria-hidden="true">' +
        '<div class="art-hero__scrim"></div>' +
        '<div class="art-hero__content">' +
          '<span class="art-hero__edition">' + D.festival.edition + 'e editie · ' + D.festival.year + '</span>' +
          '<h1 class="art-hero__title">Onze<br><em>Oerol</em></h1>' +
          '<div class="art-hero__dates">12 – 21 juni · ' + esc(D.festival.island) + '</div>' +
          heroExtra +
        '</div>' +
      '</section>';

    // Weerkaart (open-meteo) — wordt na render asynchroon gevuld door
    // loadWeather(): huidig weer, zonsopgang/-ondergang en de urenstrip.
    var weatherHtml =
      '<div class="weather" id="weather" hidden>' +
        '<div class="weather__ico" data-w="ico">' + icon('w-default') + '</div>' +
        '<div class="weather__main">' +
          '<div class="weather__temp"><span data-w="temp">–</span>°<span class="weather__label" data-w="label"></span></div>' +
          '<div class="weather__wind" data-w="wind"></div>' +
          '<div class="weather__sun" data-w="sun" hidden></div>' +
        '</div>' +
        '<div class="weather__side">' +
          '<div class="weather__place">' + esc(D.festival.island) + '</div>' +
          '<button class="weather__refresh" type="button" data-w-refresh aria-label="Weer en getijden verversen">' + icon('refresh') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="hours" id="hours" hidden></div>';

    // Tijdens het festival: "Nu & straks". Ervoor: de vertrouwde
    // "Volgende voorstelling". Erna: strandmodus.
    var nextHtml;
    if (live) {
      nextHtml = nowNextCard(now);
    } else {
      var ne = nextEvent(now);
      if (ne) {
        var g = genre(ne.genre);
        nextHtml =
          '<div class="block-label"><span class="bar"></span>Volgende voorstelling</div>' +
          '<div class="next-card">' +
            '<div class="next-card__strip"><span>Hierna op de planning</span><span class="strip-tix">' + (ne.ticket ? icon('ticket') + ' kaartje in bezit' : icon('free') + ' vrij') + '</span></div>' +
            '<div class="next-card__body">' +
              '<span class="genre-tag" style="background:' + g.color + '">' + g.label + '</span>' +
              '<div class="next-card__title" style="margin-top:8px;">' + esc(ne.title) + '</div>' +
              '<div class="next-card__artist">' + esc(ne.artist || "") + '</div>' +
              '<div class="next-card__meta">' +
                '<span class="meta-chip">' + icon('calendar') + ' ' + fmtDay(ne.day) + '</span>' +
                '<span class="meta-chip">' + icon('clock') + ' ' + esc(ne.start) + (ne.end ? '–' + esc(ne.end) : '') + '</span>' +
                '<span class="meta-chip">' + icon('pin') + ' ' + esc(ne.venue.name) + '</span>' +
                liveChip(ne, "next", now) +
              '</div>' +
              routeButtons(ne) +
              whoChips(ne.attendees) +
            '</div>' +
          '</div>';
      } else {
        nextHtml = '<div class="card">Geen geplande voorstellingen meer. Tijd voor het strand? 🏖️</div>';
      }
    }

    // Today's schedule (or first festival day if not started)
    var focusDay = live ? todayIso(now) : D.festival.start;
    var conflicts = conflictIds();
    var todays = sortedEvents().filter(function (e) { return e.day === focusDay; });
    var schedLabel = live ? "Vandaag" : ("Openingsdag · " + fmtDay(D.festival.start));
    var schedHtml =
      '<div class="block-label"><span class="bar"></span>' + schedLabel + '</div>' +
      (todays.length
        ? '<div class="event-list">' + todays.map(function (e) { return eventRow(e, { conflict: conflicts[e.id] }); }).join("") + '</div>'
        : '<div class="card muted">Niets gepland voor deze dag — kijk in het <a href="#/events">programma</a>.</div>');

    // Quick links row
    var ql =
      '<div class="block-label"><span class="bar"></span>Snel naar</div>' +
      '<div class="quicklinks">' +
        link(D.links.oerol) + link(D.links.krant) + link(D.links.program) + link(D.links.tickets) +
      '</div>';

    return hero + weatherHtml + nextHtml + islandBlockHtml(now) + schedHtml + ql + galleryHtml(3);
  }

  // ---- Weer ophalen + tonen ------------------------------------------------
  function paintWeather(w, stale) {
    var box = document.getElementById("weather");
    if (!box) return;
    var wc = weatherCode(w.code);
    var ms = w.wind;
    var bft = beaufort(ms);
    var kmh = Math.round(ms * 3.6);
    box.querySelector('[data-w="ico"]').innerHTML = icon(wc.icon);
    box.querySelector('[data-w="temp"]').textContent = Math.round(w.temp);
    box.querySelector('[data-w="label"]').textContent = wc.label + (stale ? " · laatst bekend" : "");
    box.querySelector('[data-w="wind"]').innerHTML =
      icon('wind') + ' ' + bft + " Bft " + compass(w.dir) + " · " + kmh + " km/u";
    box.hidden = false;
  }

  // Zonsopgang/-ondergang + gouden uur (zonsondergang − 1 uur) in de weerkaart.
  function paintSun(daily) {
    var el = document.querySelector('[data-w="sun"]');
    if (!el || !daily || !daily.sunrise || !daily.sunrise.length) return;
    var iso = todayIso();
    var idx = 0;
    for (var i = 0; i < daily.sunrise.length; i++) {
      if (String(daily.sunrise[i]).indexOf(iso) === 0) { idx = i; break; }
    }
    var rise = parseIsoLocal(daily.sunrise[idx]);
    var set = parseIsoLocal(daily.sunset[idx]);
    el.innerHTML =
      icon('sunrise') + ' ' + fmtClock(rise) + ' &nbsp; ' + icon('sunset') + ' ' + fmtClock(set) +
      ' &nbsp; <span class="weather__golden">gouden uur v.a. ' + fmtClock(new Date(set.getTime() - 36e5)) + '</span>';
    el.hidden = false;
  }

  // Urenstrip: de komende 18 uur (tijd, icoon, temperatuur, regenkans).
  function paintHours(hourly) {
    var box = document.getElementById("hours");
    if (!box || !hourly || !hourly.time || !hourly.time.length) return;
    var now = appNow();
    var lastDay = todayIso(now);
    var cells = "", count = 0;
    for (var i = 0; i < hourly.time.length && count < 18; i++) {
      var t = parseIsoLocal(hourly.time[i]);
      if (t.getTime() + 36e5 <= now.getTime()) continue; // uur is al voorbij
      var dayIso = String(hourly.time[i]).split("T")[0];
      var label = fmtClock(t);
      if (dayIso !== lastDay) { label = fmtDay(dayIso).split(" ")[0] + " " + label; lastDay = dayIso; }
      var wc = weatherCode(hourly.code[i]);
      var pop = hourly.pop ? hourly.pop[i] : null;
      cells +=
        '<div class="hour-cell">' +
          '<div class="t">' + label + '</div>' +
          icon(wc.icon) +
          '<div class="tmp">' + Math.round(hourly.temp[i]) + '°</div>' +
          '<div class="pop' + (pop > 0 ? '' : ' is-dry') + '">' + icon('drop') + ' ' + (pop == null ? '–' : pop + '%') + '</div>' +
        '</div>';
      count++;
    }
    box.innerHTML = cells;
    box.hidden = !cells;
  }

  function paintWeatherAll(w, stale) {
    if (w.current) paintWeather(w.current, stale);
    if (w.hourly) paintHours(w.hourly);
    if (w.daily) paintSun(w.daily);
  }

  function loadWeather() {
    var lat = (D.festival && D.festival.lat) || D.home.lat;
    var lng = (D.festival && D.festival.lng) || D.home.lng;
    if (lat == null || lng == null) return;

    // Toon meteen de laatst bekende waarde (offline-vriendelijk), anders een
    // wachtsymbool (spinner) terwijl we de verwachting ophalen.
    var cached = null;
    try {
      localStorage.removeItem("oerall.weather"); // oude cache-vorm (alleen 'current')
      cached = JSON.parse(localStorage.getItem("oerall.weather2") || "null");
    } catch (e) {}
    var hadCache = !!(cached && cached.current);
    if (hadCache) {
      paintWeatherAll(cached, true);
    } else {
      var box0 = document.getElementById("weather");
      if (box0) {
        box0.querySelector('[data-w="ico"]').innerHTML = icon("spinner", "ic--spin");
        box0.querySelector('[data-w="label"]').textContent = "weer laden…";
        box0.hidden = false;
      }
    }

    // Eén gecombineerde call: huidig weer + uren + zonsopgang/-ondergang.
    // forecast_days=2 zodat de urenstrip over middernacht heen kan kijken.
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
      "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m" +
      "&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m" +
      "&daily=sunrise,sunset&forecast_days=2" +
      "&wind_speed_unit=ms&timezone=Europe%2FAmsterdam";
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var c = data && data.current;
      if (!c) return;
      var w = {
        current: { temp: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m, dir: c.wind_direction_10m },
        hourly: data.hourly ? {
          time: data.hourly.time,
          temp: data.hourly.temperature_2m,
          code: data.hourly.weather_code,
          pop: data.hourly.precipitation_probability,
        } : null,
        daily: data.daily ? { sunrise: data.daily.sunrise, sunset: data.daily.sunset } : null,
        fetchedAt: Date.now(),
      };
      try { localStorage.setItem("oerall.weather2", JSON.stringify(w)); } catch (e) {}
      paintWeatherAll(w, false);
    }).catch(function () {
      // offline: gecachte waarde blijft staan; zonder cache tonen we een rustige
      // 'offline'-staat i.p.v. de kaart te laten verdwijnen.
      if (hadCache) return;
      var b = document.getElementById("weather");
      if (!b) return;
      b.querySelector('[data-w="ico"]').innerHTML = icon("w-default");
      b.querySelector('[data-w="temp"]').textContent = "–";
      b.querySelector('[data-w="label"]').textContent = "weer offline";
      b.querySelector('[data-w="wind"]').textContent = "geen verbinding";
      b.hidden = false;
    });
  }

  // ---- Getijden (open-meteo marine API, met statische terugvaltabel) -------
  var TIDE_KEY = "oerall.tides";
  var TIDE_TTL = 6 * 36e5; // getijden zijn deterministisch — 6 uur cache volstaat

  // Lokale extrema van de uurlijkse zeestand -> hoog-/laagwatermomenten.
  // Parabolische verfijning rond elk extremum maakt het ± 10–15 min nauwkeurig.
  function tideExtremes(times, heights) {
    var out = [];
    for (var i = 1; i < heights.length - 1; i++) {
      var p = heights[i - 1], h = heights[i], n = heights[i + 1];
      if (p == null || h == null || n == null) continue;
      var isHigh = h > p && h >= n;
      var isLow = h < p && h <= n;
      if (!isHigh && !isLow) continue;
      var denom = p - 2 * h + n;
      var dt = denom ? 0.5 * (p - n) / denom : 0;
      if (dt > 1) dt = 1;
      if (dt < -1) dt = -1;
      out.push({ t: parseIsoLocal(times[i]).getTime() + dt * 36e5, type: isHigh ? "high" : "low" });
    }
    return out;
  }
  function staticTideExtremes() {
    var out = [];
    (D.tides || []).forEach(function (row) {
      (row.high || []).forEach(function (t) { out.push({ t: parseDateTime(row.day, t).getTime(), type: "high" }); });
      (row.low || []).forEach(function (t) { out.push({ t: parseDateTime(row.day, t).getTime(), type: "low" }); });
    });
    out.sort(function (a, b) { return a.t - b.t; });
    return out;
  }
  function paintTides(extremes, suffix) {
    var card = document.getElementById("tides");
    if (!card || !extremes || !extremes.length) return false;
    var nowMs = appNow().getTime();
    var painted = false;
    ["high", "low"].forEach(function (type) {
      var el = card.querySelector('[data-tide="' + type + '"]');
      if (!el) return;
      var x = null;
      for (var i = 0; i < extremes.length; i++) {
        if (extremes[i].type === type && extremes[i].t > nowMs) { x = extremes[i]; break; }
      }
      if (!x) { el.textContent = "–"; return; }
      painted = true;
      var d = new Date(x.t);
      var dayPrefix = todayIso(d) !== todayIso(new Date(nowMs)) ? fmtDay(todayIso(d)).split(" ")[0] + " " : "";
      var rel = relTime(d, new Date(nowMs));
      el.innerHTML = "rond " + dayPrefix + fmtClock(d) + (rel ? ' <span class="muted">' + esc(rel) + "</span>" : "");
    });
    if (!painted) return false;
    var note = card.querySelector('[data-tide="note"]');
    if (note) { note.textContent = suffix || ""; note.hidden = !suffix; }
    card.hidden = false;
    var block = document.getElementById("island-block");
    if (block) block.hidden = false;
    return true;
  }
  function loadTides(force) {
    if (!document.getElementById("tides")) return;
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(TIDE_KEY) || "null"); } catch (e) {}
    var hasCache = !!(cached && cached.extremes && cached.extremes.length);
    if (hasCache && !force && Date.now() - (cached.fetchedAt || 0) < TIDE_TTL) {
      paintTides(cached.extremes);
      return;
    }
    // terugvalketen: verse API → cache ("laatst bekend") → tabel uit data.js;
    // zonder dit alles blijft het kaartje gewoon verborgen
    if (hasCache) paintTides(cached.extremes, "laatst bekend");
    else paintTides(staticTideExtremes(), "uit de getijdentabel");

    var lat = D.festival.marineLat != null ? D.festival.marineLat : D.festival.lat;
    var lng = D.festival.marineLng != null ? D.festival.marineLng : D.festival.lng;
    if (lat == null || lng == null) return;
    var url = "https://marine-api.open-meteo.com/v1/marine?latitude=" + lat + "&longitude=" + lng +
      "&hourly=sea_level_height_msl&forecast_days=3&cell_selection=sea&timezone=Europe%2FAmsterdam";
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var h = data && data.hourly;
      if (!h || !h.time || !h.sea_level_height_msl) return;
      var ex = tideExtremes(h.time, h.sea_level_height_msl);
      if (!ex.length) return;
      try { localStorage.setItem(TIDE_KEY, JSON.stringify({ extremes: ex, fetchedAt: Date.now() })); } catch (e) {}
      paintTides(ex);
    }).catch(function () { /* offline: cache of tabel staat al */ });
  }

  // Handmatig verversen (knopje in de weerkaart): weer + getijden opnieuw.
  function refreshIslandData(btn) {
    if (btn) {
      btn.innerHTML = icon("spinner", "ic--spin");
      setTimeout(function () { btn.innerHTML = icon("refresh"); }, 1500);
    }
    loadWeather();
    loadTides(true);
  }

  // ---- Live ticker voor 'Vandaag' ------------------------------------------
  // Handtekening van de live-toestand: welke voorstellingen zijn nu bezig en
  // welke komt hierna. Verandert die, dan moet de kaart opnieuw opgebouwd.
  function liveSignature(now) {
    var ids = currentEvents(now).map(function (e) { return e.id; }).join(",");
    var up = upcomingEvent(now);
    return ids + "|" + (up ? up.id : "");
  }
  // Werk alle levende tijd-chips ("nog 35 min" / "over 2 uur") in-place bij.
  function tickLiveChips(now) {
    document.querySelectorAll("[data-live]").forEach(function (chip) {
      var ev = byId(chip.getAttribute("data-live-id"));
      if (!ev) return;
      var txt = chip.getAttribute("data-live") === "now"
        ? relTimeLeft(eventEnd(ev), now)
        : relTime(parseDateTime(ev.day, ev.start), now);
      var t = chip.querySelector("[data-rel-txt]");
      if (t) t.textContent = txt;
      chip.hidden = !txt;
    });
  }
  function startTodayTicker() {
    if (tickTimer) clearInterval(tickTimer);
    var startMs = parseDateTime(D.festival.start, "00:00").getTime();
    var endMs = parseDateTime(D.festival.end, "23:59").getTime();
    var preStart = appNow().getTime() < startMs; // tonen we de aftel-hero?
    var lastSig = liveSignature(appNow());

    tickTimer = setInterval(function () {
      var now = appNow();

      // 1) Countdown loopt af -> hero omklappen naar 'live'. Eenmalig.
      if (preStart && now.getTime() >= startMs) { render(); return; }

      // 2) Aftellen: getallen in-place bijwerken (geen re-render).
      if (preStart) {
        var ms = startMs - now.getTime();
        var set = function (key, val) {
          var el = document.querySelector('[data-cd="' + key + '"]');
          if (el) el.textContent = val;
        };
        set("days", Math.floor(ms / 864e5));
        set("hrs", Math.floor((ms % 864e5) / 36e5));
        set("mins", Math.floor((ms % 36e5) / 6e4));
        set("secs", Math.floor((ms % 6e4) / 1e3));
        return;
      }

      // 3) Na het festival valt er niets meer te tikken.
      if (now.getTime() > endMs) return;

      // 4) Tijdens het festival: start of eindigt er een voorstelling, dan
      //    de hele "Nu & straks"-kaart verversen; anders alleen de chips.
      var sig = liveSignature(now);
      if (sig !== lastSig) { render(); return; }
      tickLiveChips(now);
    }, 1000);
  }

  function link(l, feature) {
    var ico = ICONS[l.icon] ? icon(l.icon) : l.icon; // named icon, anders ruwe (emoji) fallback
    return '<a class="ql ' + (feature ? "ql--feature" : "") + '" target="_blank" rel="noopener" href="' + esc(l.url) + '">' +
      '<span class="ql__ico">' + ico + '</span><span>' + esc(l.label) + '</span></a>';
  }

  // Verbindingsstuk in de dagtijdlijn: fietstijd + vrije tijd tussen twee
  // opeenvolgende voorstellingen, of een waarschuwing als ze overlappen.
  function timelineGap(a, b) {
    var gapMin = Math.round((parseDateTime(b.day, b.start) - eventEnd(a)) / 6e4);
    if (gapMin < 0) {
      return '<div class="tl-gap tl-gap--warn">' + icon('warn') + ' overlapt ' + fmtDur(-gapMin) + '</div>';
    }
    var sameVenue = a.venue && b.venue && a.venue.name === b.venue.name;
    var bikeMin = sameVenue ? null : cycleMinutes(a.venue, b.venue);
    var parts = [];
    if (bikeMin != null) parts.push(icon('bike') + ' ± ' + bikeMin + ' min fietsen');
    parts.push(gapMin === 0 ? 'direct aansluitend' : fmtDur(gapMin) + ' vrij');
    var krap = bikeMin != null && bikeMin > gapMin;
    return '<div class="tl-gap' + (krap ? ' tl-gap--warn' : '') + '">' +
      parts.join(' <span class="tl-gap__sep">·</span> ') +
      (krap ? ' <span class="tl-gap__sep">·</span> ' + icon('warn') + ' krap!' : '') +
      '</div>';
  }

  // Lijst voor de Programma-pagina. Bij één actieve dag wordt het een
  // tijdlijn met vrije gaten en fietstijden; "Alles" en zoeken blijven vlak.
  function eventsListHtml(shown, active, conflicts) {
    if (!shown.length) return '<div class="card muted">Geen voorstellingen op deze dag.</div>';
    var rows;
    if (active !== "all") {
      rows = "";
      // aanlooptijd vanaf het huis naar de eerste voorstelling van de dag
      var firstBike = cycleMinutes(D.home, shown[0].venue);
      if (firstBike != null) {
        rows += '<div class="tl-gap">' + icon('bike') + ' ± ' + firstBike + ' min fietsen vanaf ' + esc(D.home.name) + '</div>';
      }
      shown.forEach(function (ev, i) {
        if (i > 0) rows += timelineGap(shown[i - 1], ev);
        rows += eventRow(ev, { conflict: conflicts[ev.id] });
      });
    } else {
      rows = shown.map(function (ev) { return eventRow(ev, { conflict: conflicts[ev.id] }); }).join("");
    }
    var html = '<div class="event-list">' + rows + '</div>';
    if (active !== "all") {
      html += '<div class="btn-row"><button class="btn btn--ghost btn--block" data-ics-day="' + esc(active) + '">' +
        icon('calendar') + ' Hele dag naar agenda</button></div>';
    }
    return html;
  }

  function pageEvents(params) {
    var days = festivalDays();
    var active = (params && params.day) || "all";
    var all = sortedEvents();
    var conflicts = conflictIds();

    var pills = '<button class="day-pill ' + (active === "all" ? "is-active" : "") + '" data-day="all">Alles<small>' + all.length + ' items</small></button>';
    days.forEach(function (iso) {
      var cnt = all.filter(function (e) { return e.day === iso; }).length;
      if (!cnt) return; // only show days with events
      var p = iso.split("-");
      pills += '<button class="day-pill ' + (active === iso ? "is-active" : "") + '" data-day="' + iso + '">' +
        fmtDay(iso).split(" ")[0] + ' ' + p[2] + '<small>' + cnt + ' item' + (cnt > 1 ? "s" : "") + '</small></button>';
    });

    var search =
      '<div class="search-box">' + icon('search') +
        '<input id="event-search" type="search" placeholder="Zoek op titel, artiest of locatie…" autocomplete="off" aria-label="Zoek in het programma">' +
      '</div>';

    var shown = active === "all" ? all : all.filter(function (e) { return e.day === active; });

    return (
      banner("events", 'Ons <em>programma</em>') +
      search +
      '<div class="day-filter">' + pills + '</div>' +
      '<div id="events-list">' + eventsListHtml(shown, active, conflicts) + '</div>'
    );
  }

  // Zoekveld op Programma: filtert client-side op titel/artiest/locatie.
  // De zoekterm leeft alleen in het veld zelf (geen hash-state nodig).
  function wireEventSearch(active) {
    var input = document.getElementById("event-search");
    var listBox = document.getElementById("events-list");
    if (!input || !listBox) return;
    var all = sortedEvents();
    var conflicts = conflictIds();
    var base = active === "all" ? all : all.filter(function (e) { return e.day === active; });
    input.addEventListener("input", function () {
      var q = input.value.toLowerCase().trim();
      if (!q) {
        listBox.innerHTML = eventsListHtml(base, active, conflicts);
        return;
      }
      var hits = base.filter(function (e) {
        return (e.title + " " + (e.artist || "") + " " + e.venue.name + " " + (e.venue.area || ""))
          .toLowerCase().indexOf(q) !== -1;
      });
      // tijdens het zoeken een vlakke lijst — tijdlijn-gaten zouden misleiden
      listBox.innerHTML = hits.length
        ? '<div class="event-list">' + hits.map(function (ev) { return eventRow(ev, { conflict: conflicts[ev.id] }); }).join("") + '</div>'
        : '<div class="card muted">Niets gevonden voor "' + esc(q) + '".</div>';
    });
  }

  function pageEventDetail(id) {
    var ev = byId(id);
    if (!ev) return '<div class="card">Voorstelling niet gevonden. <a href="#/events">Terug naar programma</a></div>';
    var g = genre(ev.genre);
    return (
      '<div class="detail-head">' +
        '<button class="back-btn" data-back="1">←</button>' +
        '<span class="genre-tag" style="background:' + g.color + '">' + g.label + '</span>' +
      '</div>' +
      '<h1 class="detail-title">' + esc(ev.title) + '</h1>' +
      '<div class="next-card__artist" style="margin-bottom:14px;">' + esc(ev.artist || "") + '</div>' +
      '<div class="card">' +
        '<div class="kv"><span class="k">Dag</span><span class="v">' + fmtDayLong(ev.day) + '</span></div>' +
        '<div class="kv"><span class="k">Tijd</span><span class="v">' + esc(ev.start) + (ev.end ? ' – ' + esc(ev.end) : '') + '</span></div>' +
        '<div class="kv"><span class="k">Locatie</span><span class="v">' + esc(ev.venue.name) + '</span></div>' +
        (ev.venue.area ? '<div class="kv"><span class="k">Plaats</span><span class="v">' + esc(ev.venue.area) + '</span></div>' : '') +
        '<div class="kv"><span class="k">Toegang</span><span class="v">' + (ev.ticket ? icon('ticket') + ' Kaartje in bezit' : icon('free') + ' Vrij toegankelijk') + '</span></div>' +
      '</div>' +
      '<p class="detail-desc">' + esc(ev.description || "") + '</p>' +
      routeButtons(ev) +
      '<div class="btn-row"><button class="btn btn--ghost btn--block" data-ics="' + esc(ev.id) + '">' + icon('calendar') + ' Zet in agenda</button></div>' +
      whoChips(ev.attendees)
    );
  }

  function pageMap(params) {
    var html =
      banner("map", 'De <em>kaart</em>') +
      '<div class="map-wrap">' +
        '<iframe id="gmap" title="Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
        '<div class="map-status" id="map-status" role="status" aria-live="polite" hidden></div>' +
      '</div>' +
      '<div class="map-route-bar"><button class="btn btn--dark btn--block" id="route-next">' + icon('bike') + ' Route naar volgende voorstelling</button></div>' +
      '<div class="map-actions" id="map-actions"></div>' +
      '<div class="block-label"><span class="bar"></span>Kies een locatie</div>' +
      '<div class="map-venues" id="map-venues"></div>' +
      '<div class="callout">' + icon('pin') + '<span>De kaart gebruikt <b>Google Maps</b> en zoekt op het echte adres, dus elke locatie staat op de juiste plek. Tik op een locatie of "Open in Google Maps" voor de exacte plek en navigatie.</span></div>' +
      '<div class="callout">' + icon('bulb') + '<span>De kaart heeft internet nodig om te laden.</span></div>';
    return html;
  }

  function pageHome() {
    var h = D.home;
    var rules = h.houseRules.map(function (r) { return '<li>' + icon('check') + '<span>' + esc(r) + '</span></li>'; }).join("");
    var notes = h.notes.map(function (r) { return '<li>' + icon('note') + '<span>' + esc(r) + '</span></li>'; }).join("");
    var nearby = h.nearby.map(function (n) {
      return '<li>' + icon('pin') + '<span><b>' + esc(n.label) + '</b><br><span class="muted">' + esc(n.note) + '</span></span></li>';
    }).join("");
    var emerg = h.emergency.map(function (e) {
      var tel = String(e.value).replace(/\s/g, "");
      return '<div class="kv"><span class="k">' + esc(e.label) + '</span><span class="v"><a href="tel:' + esc(tel) + '">' + esc(e.value) + '</a></span></div>';
    }).join("");
    var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" +
      (h.query ? encodeURIComponent(h.query) : (h.lat + "," + h.lng));

    var occ = (D.occupancy || []).map(function (n) {
      var chips = n.who.map(function (name) { return '<span class="who__chip">' + esc(name) + '</span>'; }).join("");
      return (
        '<div class="occ-row">' +
          '<div class="occ-row__day">' + fmtDay(n.date) + '<small>' + n.who.length + '/7</small></div>' +
          '<div class="occ-row__who">' + chips + '</div>' +
        '</div>'
      );
    }).join("");

    return (
      banner("home") +
      '<div class="card">' +
        '<div class="kv"><span class="k">Adres</span><span class="v">' + esc(h.address) + '</span></div>' +
        '<div class="kv"><span class="k">Aankomst</span><span class="v">' + fmtDayLong(h.arrival) + '</span></div>' +
        '<div class="kv"><span class="k">Vertrek</span><span class="v">' + fmtDayLong(h.departure) + '</span></div>' +
      '</div>' +
      '<div class="btn-row">' +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' + mapsUrl + '">' + icon('pin') + ' Open in Maps</a>' +
        '<a class="btn btn--ghost" href="#/map">' + icon('map') + ' Op onze kaart</a>' +
      '</div>' +

      (occ ? '<div class="block-label"><span class="bar"></span>Wie slaapt wanneer</div>' +
        '<div class="card"><div class="occ">' + occ + '</div></div>' : '') +

      '<div class="block-label"><span class="bar"></span>Wifi</div>' +
      '<button type="button" class="wifi-box" data-copy="' + esc(h.wifi.password) + '" aria-label="Wifi-wachtwoord kopiëren">' +
        '<div class="wifi-box__info">' +
          '<div class="net">Netwerk: ' + esc(h.wifi.network) + '</div>' +
          '<div class="pw">' + esc(h.wifi.password) + '</div>' +
        '</div>' +
        '<span class="wifi-box__copy" data-copy-label>' + icon('copy') + ' Kopieer</span>' +
      '</button>' +

      '<div class="block-label"><span class="bar"></span>Goed om te weten</div>' +
      '<div class="card"><ul class="info-list">' + notes + '</ul></div>' +

      '<div class="block-label"><span class="bar"></span>Huisregels</div>' +
      '<div class="card"><ul class="info-list">' + rules + '</ul></div>' +

      '<div class="block-label"><span class="bar"></span>In de buurt</div>' +
      '<div class="card"><ul class="info-list">' + nearby + '</ul></div>' +

      '<div class="block-label"><span class="bar"></span>Belangrijke nummers</div>' +
      '<div class="card">' + emerg + '</div>'
    );
  }

  function pageMore() {
    var L = D.links;
    return (
      banner("more", 'Meer <em>Oerol</em>') +
      '<div class="quicklinks">' +
        link(L.oerol, true) +
        link(L.krant) + link(L.program) +
        link(L.tickets) + link(L.map) +
        link(L.ferry) + link(L.weather) +
        link(L.instagram) +
      '</div>' +
      galleryHtml() +
      '<div class="block-label"><span class="bar"></span>Onze crew</div>' +
      '<div class="card">' + whoChips(D.crew).replace('<span class="who__label">Wie gaan er:</span>', '<span class="who__label">Met z\'n allen:</span>') + '</div>' +
      '<div class="callout">' + icon('bulb') + '<span>Tip: voeg Oerall toe aan je beginscherm (deel-knop → "Zet op beginscherm") zodat hij als app opent.</span></div>' +
      '<p class="muted" style="text-align:center;margin-top:22px;">Gemaakt met 🧡 voor onze Oerol ' + D.festival.year + '.<br>Bewerk <code>js/data.js</code> om de inhoud aan te passen.</p>'
    );
  }

  // ---- Router --------------------------------------------------------------
  function parseHash() {
    var raw = (location.hash || "#/today").replace(/^#\/?/, "");
    var qIdx = raw.indexOf("?");
    var path = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
    var query = {};
    if (qIdx >= 0) {
      raw.slice(qIdx + 1).split("&").forEach(function (kv) {
        var pair = kv.split("=");
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
      });
    }
    var parts = path.split("/").filter(Boolean);
    return { top: parts[0] || "today", sub: parts[1], query: query };
  }

  function setActiveTab(top) {
    var tabbarTop = (top === "event") ? "events" : top;
    document.querySelectorAll(".tab").forEach(function (t) {
      var isActive = t.getAttribute("data-route") === tabbarTop;
      t.classList.toggle("is-active", isActive);
      if (isActive) { t.setAttribute("aria-current", "page"); }
      else { t.removeAttribute("aria-current"); }
    });
  }

  function render() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    var r = parseHash();
    var html = "";
    switch (r.top) {
      case "today": html = pageToday(); break;
      case "events": html = pageEvents({ day: r.query.day }); break;
      case "event": html = pageEventDetail(r.sub); break;
      case "map": html = pageMap(r.query); break;
      case "home": html = pageHome(); break;
      case "more": html = pageMore(); break;
      default: html = pageToday();
    }
    app.innerHTML = html;
    setActiveTab(r.top);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });

    // Page-specific wiring
    if (r.top === "today") {
      loadWeather();
      loadTides();
      startTodayTicker();
    }
    if (r.top === "events") {
      wireEventSearch(r.query.day || "all");
    }
    if (r.top === "map") {
      window.OerallMap.init();
      var btn = document.getElementById("route-next");
      if (btn) btn.addEventListener("click", function () {
        var ne = nextEvent(appNow());
        if (ne) { window.OerallMap.routeTo(ne.venue); btn.innerHTML = icon('bike') + " Route naar: " + esc(ne.title); }
      });
      // focus a specific venue if requested
      if (r.query.focus) {
        var ev = D.events.filter(function (e) { return e.venue.name === r.query.focus; })[0];
        if (ev) window.OerallMap.focus(ev.venue, false);
      }
    }
  }

  // Deel een voorstelling via de Web Share API, met klembord-fallback.
  function shareEvent(id) {
    var ev = byId(id);
    if (!ev) return;
    var url = location.origin + location.pathname + location.search + "#/event/" + ev.id;
    var text = ev.title + (ev.artist ? " — " + ev.artist : "") +
      " · " + fmtDay(ev.day) + " " + ev.start + " · " + ev.venue.name;
    if (navigator.share) {
      navigator.share({ title: "Oerall · " + ev.title, text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        alert("Link gekopieerd naar het klembord:\n" + url);
      }).catch(function () { alert(url); });
    } else {
      alert(url);
    }
  }

  // Kopieer tekst (bv. wifi-wachtwoord) met dezelfde fallback als delen.
  function copyText(text, btn) {
    var label = btn && btn.querySelector("[data-copy-label]");
    var flash = function () {
      if (!label) return;
      var prev = label.innerHTML;
      label.innerHTML = icon("check") + " Gekopieerd";
      setTimeout(function () { label.innerHTML = prev; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash).catch(function () { alert(text); });
    } else {
      alert(text);
    }
  }

  // ---- .ics-export: zet een voorstelling in je agenda (volledig offline) ----
  function pad2(n) { return String(n).padStart(2, "0"); }
  // Lokale "floating" tijd (geen Z) — de groep zit in NL, dus de wandkloktijd klopt.
  function icsLocal(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "T" +
      pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
  }
  function icsUtc(d) {
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + "T" +
      pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + "Z";
  }
  function icsEscape(s) {
    return String(s == null ? "" : s)
      .replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&").replace(/\r?\n/g, "\\n");
  }
  // Eén VEVENT-blok per voorstelling; meerdere blokken in één VCALENDAR is
  // geldig, dus dezelfde bouwsteen dient ook de hele-dag-export.
  function veventLines(ev) {
    return [
      "BEGIN:VEVENT",
      "UID:" + ev.id + "@oerall",
      "DTSTAMP:" + icsUtc(new Date()),
      "DTSTART:" + icsLocal(parseDateTime(ev.day, ev.start)),
      "DTEND:" + icsLocal(eventEnd(ev)),
      "SUMMARY:" + icsEscape(ev.title + (ev.artist ? " — " + ev.artist : "")),
      "LOCATION:" + icsEscape(ev.venue.name + (ev.venue.area ? " (" + ev.venue.area + ")" : "")),
      "DESCRIPTION:" + icsEscape(ev.description || ""),
      "END:VEVENT",
    ];
  }
  function downloadIcs(veventArrays, filename) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0",
      "PRODID:-//Oerall//Oerol " + D.festival.year + "//NL", "CALSCALE:GREGORIAN"];
    veventArrays.forEach(function (v) { lines = lines.concat(v); });
    lines.push("END:VCALENDAR");
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function addToCalendar(id) {
    var ev = byId(id);
    if (ev) downloadIcs([veventLines(ev)], ev.id + ".ics");
  }
  function addDayToCalendar(day) {
    var evs = sortedEvents().filter(function (e) { return e.day === day; });
    if (evs.length) downloadIcs(evs.map(veventLines), "oerol-" + day + ".ics");
  }

  // Event delegation for clicks on event rows / back button
  app.addEventListener("click", function (e) {
    var copy = e.target.closest("[data-copy]");
    if (copy) { copyText(copy.getAttribute("data-copy"), copy); return; }
    var ics = e.target.closest("[data-ics]");
    if (ics) { addToCalendar(ics.getAttribute("data-ics")); return; }
    var icsDay = e.target.closest("[data-ics-day]");
    if (icsDay) { addDayToCalendar(icsDay.getAttribute("data-ics-day")); return; }
    var wRefresh = e.target.closest("[data-w-refresh]");
    if (wRefresh) { refreshIslandData(wRefresh); return; }
    var share = e.target.closest("[data-share]");
    if (share) { shareEvent(share.getAttribute("data-share")); return; }
    var row = e.target.closest("[data-event]");
    if (row) { location.hash = "#/event/" + row.getAttribute("data-event"); return; }
    var back = e.target.closest("[data-back]");
    if (back) { history.length > 1 ? history.back() : (location.hash = "#/events"); return; }
    var pill = e.target.closest("[data-day]");
    if (pill) {
      var day = pill.getAttribute("data-day");
      location.hash = day === "all" ? "#/events" : "#/events?day=" + day;
      return;
    }
  });

  // Set top-bar krant link; verberg de knop als er geen krant-link is.
  var krantLink = document.getElementById("topbar-krant");
  if (krantLink) {
    if (D.links.krant) krantLink.href = D.links.krant.url;
    else krantLink.hidden = true;
  }
  var sub = document.getElementById("topbar-sub");
  if (sub) sub.textContent = D.festival.island + " in beeld · Oerol " + D.festival.year;

  window.addEventListener("hashchange", render);
  render();
})();
