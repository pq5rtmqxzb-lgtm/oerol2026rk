/* ============================================================
   OERALL — app logic + hash router (no build step)
   ============================================================ */

(function () {
  var D = window.OERALL_DATA;
  var app = document.getElementById("app");

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
    theater: { label: "Theater", color: "#ff5a2c" },
    muziek: { label: "Muziek", color: "#2e7d9a" },
    straat: { label: "Straat", color: "#f0a500" },
    woord: { label: "Woord", color: "#7a5cff" },
    kunst: { label: "Kunst", color: "#d6336c" },
    eten: { label: "Eten", color: "#2f9e44" },
  };
  function genre(g) { return GENRE[g] || { label: g || "Oerol", color: "#ff5a2c" }; }

  // expose helpers for map.js
  window.Oerall = { fmtDay: fmtDay };

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
          '<div class="event-row__venue">📍 ' + esc(ev.venue.name) + (ev.venue.area ? ' · ' + esc(ev.venue.area) : '') + '</div>' +
          '<span class="genre-tag" style="background:' + g.color + ';margin-top:8px;">' + g.label + '</span>' +
        '</div>' +
        '<div class="event-row__tail">' +
          (ev.ticket ? '<span title="Ticket nodig">🎟️</span>' : '<span title="Vrij toegankelijk">🆓</span>') +
          '<span style="font-size:18px;color:#bbb;">›</span>' +
        '</div>' +
      '</button>'
    );
  }

  function whoChips(list) {
    if (!list || !list.length) return "";
    var chips = list.map(function (n) { return '<span class="who__chip">' + esc(n) + '</span>'; }).join("");
    return '<div class="who"><span class="who__label">Wie gaan er:</span>' + chips + '</div>';
  }

  function routeButtons(venue) {
    if (!venue || !venue.lat) return "";
    var url = window.OerallMap.directionsUrl(D.home, venue);
    return (
      '<div class="btn-row">' +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' + url + '">🚲 Route ernaartoe</a>' +
        '<a class="btn btn--ghost" href="#/map?focus=' + encodeURIComponent(venue.name) + '">🗺️ Op de kaart</a>' +
      '</div>'
    );
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
      heroExtra =
        '<div class="countdown">' +
          '<div class="cd-box"><div class="num">' + days + '</div><div class="lbl">dagen</div></div>' +
          '<div class="cd-box"><div class="num">' + hrs + '</div><div class="lbl">uur</div></div>' +
          '<div class="cd-box"><div class="num">' + mins + '</div><div class="lbl">min</div></div>' +
        '</div>';
    } else if (now <= end) {
      var dayNo = Math.floor((now - start) / 864e5) + 1;
      heroExtra = '<div class="hero__live"><span class="live-dot"></span>Dag ' + dayNo + ' van Oerol — geniet!</div>';
    } else {
      heroExtra = '<div class="hero__live">Tot Oerol ' + (D.festival.year + 1) + ' 👋</div>';
    }

    var hero =
      '<section class="hero">' +
        '<span class="hero__edition">' + D.festival.edition + 'e editie · ' + D.festival.year + '</span>' +
        '<h1 class="hero__title">ONZE<br><span class="yellow">OEROL</span></h1>' +
        '<div class="hero__dates">12 – 21 juni · ' + esc(D.festival.island) + '</div>' +
        heroExtra +
      '</section>';

    // Next event card
    var nextHtml;
    if (ne) {
      var g = genre(ne.genre);
      nextHtml =
        '<div class="block-label"><span class="bar"></span>Volgende voorstelling</div>' +
        '<div class="next-card">' +
          '<div class="next-card__strip"><span>Hierna op de planning</span><span>' + (ne.ticket ? '🎟️ ticket' : '🆓 vrij') + '</span></div>' +
          '<div class="next-card__body">' +
            '<span class="genre-tag" style="background:' + g.color + '">' + g.label + '</span>' +
            '<div class="next-card__title" style="margin-top:8px;">' + esc(ne.title) + '</div>' +
            '<div class="next-card__artist">' + esc(ne.artist || "") + '</div>' +
            '<div class="next-card__meta">' +
              '<span class="meta-chip">🗓️ ' + fmtDay(ne.day) + '</span>' +
              '<span class="meta-chip">🕒 ' + esc(ne.start) + (ne.end ? '–' + esc(ne.end) : '') + '</span>' +
              '<span class="meta-chip">📍 ' + esc(ne.venue.name) + '</span>' +
            '</div>' +
            routeButtons(ne.venue) +
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

    return hero + nextHtml + schedHtml + ql;
  }

  function link(l, feature) {
    return '<a class="ql ' + (feature ? "ql--feature" : "") + '" target="_blank" rel="noopener" href="' + esc(l.url) + '">' +
      '<span class="ql__ico">' + l.icon + '</span><span>' + esc(l.label) + '</span></a>';
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
      '<div class="eyebrow">Oerol ' + D.festival.year + '</div>' +
      '<h1 class="section-title">Ons <span class="accent">programma</span></h1>' +
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
        '<div class="kv"><span class="k">Toegang</span><span class="v">' + (ev.ticket ? '🎟️ Ticket nodig' : '🆓 Vrij toegankelijk') + '</span></div>' +
      '</div>' +
      '<p class="detail-desc">' + esc(ev.description || "") + '</p>' +
      routeButtons(ev.venue) +
      whoChips(ev.attendees)
    );
  }

  function pageMap(params) {
    var html =
      '<div class="eyebrow">Terschelling</div>' +
      '<h1 class="section-title">De <span class="accent">kaart</span></h1>' +
      '<div class="map-wrap"><div id="map"></div></div>' +
      '<div class="map-route-bar"><button class="btn btn--dark btn--block" id="route-next">🚲 Route naar volgende voorstelling</button></div>' +
      '<div class="map-legend">' +
        '<span><i class="legend-pin" style="background:#0e3a38;border:2px solid #fff;"></i> Ons huis</span>' +
        '<span><i class="legend-pin" style="background:#ff5a2c;"></i> Theater</span>' +
        '<span><i class="legend-pin" style="background:#2e7d9a;"></i> Muziek</span>' +
        '<span><i class="legend-pin" style="background:#f0a500;"></i> Straat</span>' +
        '<span><i class="legend-pin" style="background:#7a5cff;"></i> Woord</span>' +
        '<span><i class="legend-pin" style="background:#2f9e44;"></i> Eten</span>' +
      '</div>' +
      '<div class="callout">💡 De kaart heeft internet nodig om te laden. Tip: open hem één keer thuis met wifi, dan zit hij in het geheugen.</div>';
    return html;
  }

  function pageHome() {
    var h = D.home;
    var rules = h.houseRules.map(function (r) { return '<li><span class="ic">✅</span><span>' + esc(r) + '</span></li>'; }).join("");
    var notes = h.notes.map(function (r) { return '<li><span class="ic">📌</span><span>' + esc(r) + '</span></li>'; }).join("");
    var nearby = h.nearby.map(function (n) {
      return '<li><span class="ic">📍</span><span><b>' + esc(n.label) + '</b><br><span class="muted">' + esc(n.note) + '</span></span></li>';
    }).join("");
    var emerg = h.emergency.map(function (e) {
      var tel = String(e.value).replace(/\s/g, "");
      return '<div class="kv"><span class="k">' + esc(e.label) + '</span><span class="v"><a href="tel:' + esc(tel) + '">' + esc(e.value) + '</a></span></div>';
    }).join("");
    var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + h.lat + "," + h.lng;

    return (
      '<div class="eyebrow">Ons onderkomen</div>' +
      '<h1 class="section-title">' + esc(h.name) + '</h1>' +
      '<div class="card">' +
        '<div class="kv"><span class="k">Adres</span><span class="v">' + esc(h.address) + '</span></div>' +
        '<div class="kv"><span class="k">Aankomst</span><span class="v">' + fmtDayLong(h.arrival) + '</span></div>' +
        '<div class="kv"><span class="k">Vertrek</span><span class="v">' + fmtDayLong(h.departure) + '</span></div>' +
      '</div>' +
      '<div class="btn-row">' +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' + mapsUrl + '">📍 Open in Maps</a>' +
        '<a class="btn btn--ghost" href="#/map">🗺️ Op onze kaart</a>' +
      '</div>' +

      '<div class="block-label"><span class="bar"></span>Wifi</div>' +
      '<div class="wifi-box"><div class="net">Netwerk: ' + esc(h.wifi.network) + '</div><div class="pw">' + esc(h.wifi.password) + '</div></div>' +

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
      '<div class="eyebrow">Handig</div>' +
      '<h1 class="section-title">Meer <span class="accent">Oerol</span></h1>' +
      '<div class="quicklinks">' +
        link(L.oerol, true) +
        link(L.krant) + link(L.program) +
        link(L.tickets) + link(L.map) +
        link(L.ferry) + link(L.weather) +
        link(L.instagram) +
      '</div>' +
      '<div class="block-label"><span class="bar"></span>Onze crew</div>' +
      '<div class="card">' + whoChips(D.crew).replace('<span class="who__label">Wie gaan er:</span>', '<span class="who__label">Met z\'n allen:</span>') + '</div>' +
      '<div class="callout">📲 Tip: voeg Oerall toe aan je beginscherm (deel-knop → "Zet op beginscherm") zodat hij als app opent.</div>' +
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
      t.classList.toggle("is-active", t.getAttribute("data-route") === tabbarTop);
    });
  }

  function render() {
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
    if (r.top === "map") {
      window.OerallMap.init();
      window.OerallMap.refresh();
      var btn = document.getElementById("route-next");
      if (btn) btn.addEventListener("click", function () {
        var ne = nextEvent(new Date());
        if (ne) { window.OerallMap.routeTo(ne.venue); btn.textContent = "🚲 Route naar: " + ne.title; }
      });
      // focus a specific venue if requested
      if (r.query.focus) {
        var ev = D.events.filter(function (e) { return e.venue.name === r.query.focus; })[0];
        if (ev) window.OerallMap.routeTo(ev.venue);
      }
    }
  }

  // Event delegation for clicks on event rows / back button
  app.addEventListener("click", function (e) {
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

  // Set top-bar krant link
  var krantLink = document.getElementById("topbar-krant");
  if (krantLink && D.links.krant) krantLink.href = D.links.krant.url;
  var sub = document.getElementById("topbar-sub");
  if (sub) sub.textContent = "Onze Oerol · " + D.festival.island;

  window.addEventListener("hashchange", render);
  render();
})();
