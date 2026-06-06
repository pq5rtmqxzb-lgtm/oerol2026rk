/* ============================================================
   OERALL — Map module (Google Maps)
   Replaces the old approximate Leaflet/OSM pins. Every venue is
   shown by its real address/name (venue.query) so Google geocodes
   the exact spot instead of our hand-placed coordinates.
   Uses Google's keyless embed (output=embed) for the in-app map and
   the Maps URL API for "open in app" / turn-by-turn directions.
   ============================================================ */

window.OerallMap = (function () {
  // A location's most accurate text handle: the full address/name query,
  // falling back to coordinates only if no query is known.
  function locQuery(loc) {
    if (!loc) return "";
    if (loc.query) return loc.query;
    if (loc.lat != null) return loc.lat + "," + loc.lng;
    return "";
  }

  // ---- URL builders --------------------------------------------------------

  // In-app map: keyless Google Maps embed centred on a place (by address).
  function embedSearchUrl(query) {
    return "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";
  }

  // In-app map: keyless Google Maps embed showing cycling directions.
  function embedDirectionsUrl(from, to) {
    return (
      "https://www.google.com/maps?saddr=" + encodeURIComponent(locQuery(from)) +
      "&daddr=" + encodeURIComponent(locQuery(to)) +
      "&dirflg=b&output=embed"
    );
  }

  // Open the full Google Maps app/site at a place (most accurate hand-off).
  function searchUrl(loc) {
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(locQuery(loc));
  }

  // Open the full Google Maps app/site with cycling directions.
  function directionsUrl(from, to) {
    return (
      "https://www.google.com/maps/dir/?api=1" +
      "&origin=" + encodeURIComponent(locQuery(from)) +
      "&destination=" + encodeURIComponent(locQuery(to)) +
      "&travelmode=bicycling"
    );
  }

  // ---- In-app embed --------------------------------------------------------

  var currentUrl = "";   // last URL handed to the iframe (reset per navigation)
  var wired = false;     // one-time connectivity wiring

  function frame() {
    return document.getElementById("gmap");
  }
  function statusBox() {
    return document.getElementById("map-status");
  }

  // The map needs internet; show a loading spinner while it loads and a clear
  // message when we're offline instead of the browser's raw error frame.
  function showStatus(html) {
    var box = statusBox();
    if (!box) return;
    box.innerHTML = html;
    box.hidden = false;
  }
  function hideStatus() {
    var box = statusBox();
    if (box) box.hidden = true;
  }
  function showLoading() {
    showStatus(window.Oerall.icon("spinner", "ic--spin") + "<span>Kaart laden…</span>");
  }
  function showOffline() {
    showStatus(window.Oerall.icon("bulb") +
      "<span>De kaart heeft internet nodig — even geen verbinding.</span>");
  }

  function setFrame(url) {
    var el = frame();
    if (!el || currentUrl === url) return;
    currentUrl = url;
    if (navigator.onLine === false) { showOffline(); return; }
    showLoading();
    el.setAttribute("src", url);
  }

  // Keep the embed in sync with connectivity changes (registered once).
  function wireOnce() {
    if (wired) return;
    wired = true;
    window.addEventListener("offline", function () {
      if (statusBox()) showOffline();
    });
    window.addEventListener("online", function () {
      var el = frame();
      if (el && currentUrl) { showLoading(); el.setAttribute("src", currentUrl); }
    });
  }

  // Render the buttons for a selected place (open in Maps + route from home).
  function showActions(loc, isHome) {
    var box = document.getElementById("map-actions");
    if (!box) return;
    var home = window.OERALL_DATA.home;
    var html =
      '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
        searchUrl(loc) + '">' + window.Oerall.icon('pin') + ' Open in Google Maps</a>';
    if (!isHome && home) {
      html += '<a class="btn btn--ghost" target="_blank" rel="noopener" href="' +
        directionsUrl(home, loc) + '">' + window.Oerall.icon('bike') + ' Route ernaartoe</a>';
    }
    box.innerHTML = html;
  }

  // Show a single place on the embedded map + its actions.
  function focus(loc, isHome) {
    if (!loc) return;
    setFrame(embedSearchUrl(locQuery(loc)));
    showActions(loc, isHome);
    markActive(loc.name);
  }

  // Show cycling directions from home to a venue on the embedded map.
  function routeTo(venue) {
    if (!venue) return;
    var home = window.OERALL_DATA.home;
    setFrame(embedDirectionsUrl(home, venue));
    showActions(venue, false);
    markActive(venue.name);
  }

  function markActive(name) {
    document.querySelectorAll(".venue-chip").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-name") === name);
    });
  }

  // Build the venue selector chips (the house + each unique venue).
  function buildChips() {
    var box = document.getElementById("map-venues");
    if (!box) return;
    var data = window.OERALL_DATA;
    var chips = [];

    chips.push(
      '<button class="venue-chip" data-name="' + escAttr(data.home.name) + '" data-home="1">' +
        '<i class="chip-dot" style="background:#0e3a38;border:2px solid #fff;"></i>' +
        window.Oerall.icon('home') + ' ' + escHtml(data.home.name) + '</button>'
    );

    var seen = {};
    data.events.forEach(function (ev) {
      var v = ev.venue;
      if (!v || seen[v.name]) return;
      seen[v.name] = true;
      var color = window.Oerall.genre(ev.genre).color;
      chips.push(
        '<button class="venue-chip" data-name="' + escAttr(v.name) + '">' +
          '<i class="chip-dot" style="background:' + color + ';"></i>' +
          escHtml(v.name) + (v.area ? ' · ' + escHtml(v.area) : '') + '</button>'
      );
    });

    box.innerHTML = chips.join("");

    box.addEventListener("click", function (e) {
      var chip = e.target.closest(".venue-chip");
      if (!chip) return;
      var name = chip.getAttribute("data-name");
      if (chip.getAttribute("data-home")) { focus(data.home, true); return; }
      var ev = data.events.filter(function (x) { return x.venue.name === name; })[0];
      if (ev) focus(ev.venue, false);
    });
  }

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) { return escHtml(s).replace(/"/g, "&quot;"); }

  function init() {
    wireOnce();
    currentUrl = "";          // the iframe is rebuilt on every navigation
    var el = frame();
    if (el) el.addEventListener("load", hideStatus);
    buildChips();
    // Default view: an overview of the whole island.
    setFrame(embedSearchUrl(window.OERALL_DATA.festival.island + ", Nederland"));
  }

  return {
    init: init,
    focus: focus,
    routeTo: routeTo,
    searchUrl: searchUrl,
    directionsUrl: directionsUrl,
  };
})();
