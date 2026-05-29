/* ============================================================
   OERALL — Map module (Leaflet + OpenStreetMap)
   Centred on Terschelling. Pins for venues + the house,
   plus a "route to next event" line + maps hand-off.
   ============================================================ */

window.OerallMap = (function () {
  var map = null;
  var routeLayer = null;
  var initialized = false;

  // Fix Leaflet's default marker image paths to our vendored copies
  if (window.L) {
    L.Icon.Default.prototype.options.imagePath = "vendor/leaflet/images/";
  }

  var GENRE_COLORS = {
    theater: "#ff5a2c",
    muziek: "#2e7d9a",
    straat: "#f0a500",
    woord: "#7a5cff",
    kunst: "#d6336c",
    eten: "#2f9e44",
  };

  function venuePin(color) {
    return L.divIcon({
      className: "",
      html: '<div class="venue-pin" style="background:' + color + '"><span>★</span></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24],
    });
  }

  function homePin() {
    return L.divIcon({
      className: "",
      html: '<div class="home-pin"><span>🏠</span></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28],
    });
  }

  // Build a Google Maps cycling-directions URL (works on all phones/desktop)
  function directionsUrl(from, to) {
    var base = "https://www.google.com/maps/dir/?api=1";
    return (
      base +
      "&origin=" + from.lat + "," + from.lng +
      "&destination=" + to.lat + "," + to.lng +
      "&travelmode=bicycling"
    );
  }
  OerallMap_directionsUrl = directionsUrl; // expose for app.js

  function init() {
    if (initialized || !window.L) return;
    var data = window.OERALL_DATA;
    var home = data.home;

    map = L.map("map", { scrollWheelZoom: false, attributionControl: true })
      .setView([53.39, 5.31], 11);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap-bijdragers",
    }).addTo(map);

    // House marker
    if (home && home.lat) {
      L.marker([home.lat, home.lng], { icon: homePin() })
        .addTo(map)
        .bindPopup("<b>🏠 " + home.name + "</b><br>" + home.address);
    }

    // Venue markers (dedupe by name)
    var seen = {};
    data.events.forEach(function (ev) {
      var v = ev.venue;
      if (!v || !v.lat) return;
      var key = v.name;
      if (seen[key]) return;
      seen[key] = true;
      var color = GENRE_COLORS[ev.genre] || "#ff5a2c";
      var popup =
        "<b>" + ev.title + "</b><br>" +
        "📍 " + v.name + (v.area ? " · " + v.area : "") + "<br>" +
        "🗓️ " + window.Oerall.fmtDay(ev.day) + " · " + ev.start;
      if (home && home.lat) {
        popup += '<br><a class="popup-btn" target="_blank" rel="noopener" href="' +
          directionsUrl(home, v) + '">🚲 Route hierheen</a>';
      }
      L.marker([v.lat, v.lng], { icon: venuePin(color) })
        .addTo(map)
        .bindPopup(popup);
    });

    initialized = true;
    setTimeout(function () { if (map) map.invalidateSize(); }, 120);
  }

  // Draw a straight route line from home to the given venue + zoom to it
  function routeTo(venue) {
    if (!map) return;
    var home = window.OERALL_DATA.home;
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    if (!home || !home.lat || !venue || !venue.lat) return;

    var latlngs = [[home.lat, home.lng], [venue.lat, venue.lng]];
    routeLayer = L.layerGroup([
      L.polyline(latlngs, { color: "#0e3a38", weight: 5, opacity: 0.9, dashArray: "2 10", lineCap: "round" }),
      L.polyline(latlngs, { color: "#ff5a2c", weight: 3, opacity: 0.95 }),
    ]).addTo(map);

    map.fitBounds(L.latLngBounds(latlngs).pad(0.4));
  }

  function refresh() {
    if (map) setTimeout(function () { map.invalidateSize(); }, 80);
  }

  return { init: init, routeTo: routeTo, refresh: refresh, directionsUrl: directionsUrl };
})();
