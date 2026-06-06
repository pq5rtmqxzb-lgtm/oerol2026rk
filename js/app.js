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
    var diff = date - (now || new Date());
    if (diff <= 0) return "nu bezig";
    var mins = Math.round(diff / 6e4);
    if (mins < 60) return "over " + mins + " min";
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return "over " + hrs + " uur";
    return "";
  }

  // ---- Event helpers -------------------------------------------------------
  function sortedEvents() {
    return D.events.slice().sort(function (a, b) {
      return parseDateTime(a.day, a.start) - parseDateTime(b.day, b.start);
    });
  }
  function nextEvent(now) {
    now = now || new Date();
    var list = sortedEvents();
    for (var i = 0; i < list.length; i++) {
      var end = parseDateTime(list[i].day, list[i].end || list[i].start);
      if (end >= now) return list[i];
    }
    return null;
  }
  function byId(id) {
    return D.events.filter(function (e) { return e.id === id; })[0];
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
  function eventRow(ev) {
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
          '<span class="genre-tag" style="background:' + g.color + ';margin-top:8px;">' + g.label + '</span>' +
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

  // ---- Pages ---------------------------------------------------------------
  function pageToday() {
    var now = new Date();
    var start = parseDateTime(D.festival.start, "00:00");
    var end = parseDateTime(D.festival.end, "23:59");
    var ne = nextEvent(now);

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

    // Weerkaart (open-meteo) — wordt na render asynchroon gevuld door loadWeather().
    var weatherHtml =
      '<div class="weather" id="weather" hidden>' +
        '<div class="weather__ico" data-w="ico">' + icon('w-default') + '</div>' +
        '<div class="weather__main">' +
          '<div class="weather__temp"><span data-w="temp">–</span>°<span class="weather__label" data-w="label"></span></div>' +
          '<div class="weather__wind" data-w="wind"></div>' +
        '</div>' +
        '<div class="weather__place">' + esc(D.festival.island) + '</div>' +
      '</div>';

    // Next event card
    var nextHtml;
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
              '<span class="meta-chip meta-chip--rel" data-rel="next"' + (relTime(parseDateTime(ne.day, ne.start), now) ? '' : ' hidden') + '>' + icon('hourglass') + ' <span data-rel-txt>' + esc(relTime(parseDateTime(ne.day, ne.start), now)) + '</span></span>' +
            '</div>' +
            routeButtons(ne) +
            whoChips(ne.attendees) +
          '</div>' +
        '</div>';
    } else {
      nextHtml = '<div class="card">Geen geplande voorstellingen meer. Tijd voor het strand? 🏖️</div>';
    }

    // Today's schedule (or first festival day if not started)
    var focusDay = (now >= start && now <= end)
      ? (now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"))
      : D.festival.start;
    var todays = sortedEvents().filter(function (e) { return e.day === focusDay; });
    var schedLabel = (now >= start && now <= end) ? "Vandaag" : ("Openingsdag · " + fmtDay(D.festival.start));
    var schedHtml =
      '<div class="block-label"><span class="bar"></span>' + schedLabel + '</div>' +
      (todays.length
        ? '<div class="event-list">' + todays.map(eventRow).join("") + '</div>'
        : '<div class="card muted">Niets gepland voor deze dag — kijk in het <a href="#/events">programma</a>.</div>');

    // Quick links row
    var ql =
      '<div class="block-label"><span class="bar"></span>Snel naar</div>' +
      '<div class="quicklinks">' +
        link(D.links.oerol) + link(D.links.krant) + link(D.links.program) + link(D.links.tickets) +
      '</div>';

    return hero + weatherHtml + nextHtml + schedHtml + ql + galleryHtml(3);
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

  function loadWeather() {
    var lat = (D.festival && D.festival.lat) || D.home.lat;
    var lng = (D.festival && D.festival.lng) || D.home.lng;
    if (lat == null || lng == null) return;

    // Toon meteen de laatst bekende waarde (offline-vriendelijk), anders een
    // wachtsymbool (spinner) terwijl we de verwachting ophalen.
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem("oerall.weather") || "null"); } catch (e) {}
    var hadCache = !!(cached && cached.temp != null);
    if (hadCache) {
      paintWeather(cached, true);
    } else {
      var box0 = document.getElementById("weather");
      if (box0) {
        box0.querySelector('[data-w="ico"]').innerHTML = icon("spinner", "ic--spin");
        box0.querySelector('[data-w="label"]').textContent = "weer laden…";
        box0.hidden = false;
      }
    }

    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
      "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m" +
      "&wind_speed_unit=ms&timezone=Europe%2FAmsterdam";
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var c = data && data.current;
      if (!c) return;
      var w = { temp: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m, dir: c.wind_direction_10m };
      try { localStorage.setItem("oerall.weather", JSON.stringify(w)); } catch (e) {}
      paintWeather(w, false);
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

  // ---- Live ticker voor 'Vandaag' ------------------------------------------
  function startTodayTicker() {
    if (tickTimer) clearInterval(tickTimer);
    var startMs = parseDateTime(D.festival.start, "00:00").getTime();
    var preStart = Date.now() < startMs;       // tonen we de aftel-hero?
    var ne0 = nextEvent(new Date());
    var lastNextId = ne0 ? ne0.id : null;       // welke voorstelling staat er nu?

    tickTimer = setInterval(function () {
      var now = new Date();

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

      // 3) Tijdens het festival: wisselt de volgende voorstelling, dan ververst
      //    de hele next-card; anders alleen de relatieve-tijd-chip bijwerken.
      var ne = nextEvent(now);
      var curId = ne ? ne.id : null;
      if (curId !== lastNextId) { render(); return; }
      var chip = document.querySelector('[data-rel="next"]');
      if (chip && ne) {
        var rel = relTime(parseDateTime(ne.day, ne.start), now);
        if (rel) {
          chip.querySelector("[data-rel-txt]").textContent = rel;
          chip.hidden = false;
        } else {
          chip.hidden = true;
        }
      }
    }, 1000);
  }

  function link(l, feature) {
    var ico = ICONS[l.icon] ? icon(l.icon) : l.icon; // named icon, anders ruwe (emoji) fallback
    return '<a class="ql ' + (feature ? "ql--feature" : "") + '" target="_blank" rel="noopener" href="' + esc(l.url) + '">' +
      '<span class="ql__ico">' + ico + '</span><span>' + esc(l.label) + '</span></a>';
  }

  function pageEvents(params) {
    var days = festivalDays();
    var active = (params && params.day) || "all";
    var all = sortedEvents();

    var pills = '<button class="day-pill ' + (active === "all" ? "is-active" : "") + '" data-day="all">Alles<small>' + all.length + ' items</small></button>';
    days.forEach(function (iso) {
      var cnt = all.filter(function (e) { return e.day === iso; }).length;
      if (!cnt) return; // only show days with events
      var p = iso.split("-");
      pills += '<button class="day-pill ' + (active === iso ? "is-active" : "") + '" data-day="' + iso + '">' +
        fmtDay(iso).split(" ")[0] + ' ' + p[2] + '<small>' + cnt + ' item' + (cnt > 1 ? "s" : "") + '</small></button>';
    });

    var shown = active === "all" ? all : all.filter(function (e) { return e.day === active; });
    var list = shown.length
      ? '<div class="event-list">' + shown.map(eventRow).join("") + '</div>'
      : '<div class="card muted">Geen voorstellingen op deze dag.</div>';

    return (
      banner("events", 'Ons <em>programma</em>') +
      '<div class="day-filter">' + pills + '</div>' +
      list
    );
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
      startTodayTicker();
    }
    if (r.top === "map") {
      window.OerallMap.init();
      var btn = document.getElementById("route-next");
      if (btn) btn.addEventListener("click", function () {
        var ne = nextEvent(new Date());
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
  function addToCalendar(id) {
    var ev = byId(id);
    if (!ev) return;
    var startDt = parseDateTime(ev.day, ev.start);
    var endDt = ev.end ? parseDateTime(ev.day, ev.end) : new Date(startDt.getTime() + 36e5);
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Oerall//Oerol " + D.festival.year + "//NL",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + ev.id + "@oerall",
      "DTSTAMP:" + icsUtc(new Date()),
      "DTSTART:" + icsLocal(startDt),
      "DTEND:" + icsLocal(endDt),
      "SUMMARY:" + icsEscape(ev.title + (ev.artist ? " — " + ev.artist : "")),
      "LOCATION:" + icsEscape(ev.venue.name + (ev.venue.area ? " (" + ev.venue.area + ")" : "")),
      "DESCRIPTION:" + icsEscape(ev.description || ""),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ev.id + ".ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Event delegation for clicks on event rows / back button
  app.addEventListener("click", function (e) {
    var copy = e.target.closest("[data-copy]");
    if (copy) { copyText(copy.getAttribute("data-copy"), copy); return; }
    var ics = e.target.closest("[data-ics]");
    if (ics) { addToCalendar(ics.getAttribute("data-ics")); return; }
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
