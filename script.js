/* =========================================================================
   ליווי מכירות — Landing Page Script
   -------------------------------------------------------------------------
   JavaScript רגיל (Vanilla) בלבד, ללא ספריות חיצוניות.
   הקובץ מטפל אך ורק באינטראקציות של דף הנחיתה הזה (מתפריט מובייל ועד
   הטופס), ואינו נוגע/משפיע על שום קוד גלובלי אחר באתר שאליו ישולב בעתיד.
   ========================================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initSmoothScroll();
    initAccordion();
    initTendersMap();
    initLeadForm();
  });

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var burger = document.getElementById("sales-burger");
    var mobileNav = document.getElementById("sales-mobile-nav");
    if (!burger || !mobileNav) return;

    burger.addEventListener("click", function () {
      var isOpen = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!isOpen));
      mobileNav.hidden = isOpen;
    });

    // Close the menu automatically after a nav link is tapped
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  /* ---------- Smooth scroll for in-page CTAs ---------- */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var targetId = link.getAttribute("href");
        if (!targetId || targetId === "#" || !document.querySelector(targetId)) return;
        event.preventDefault();
        scrollToTarget(targetId);
      });
    });
  }

  function scrollToTarget(targetId) {
    var target = document.querySelector(targetId);
    if (!target) return;

    var headerOffset = getHeaderOffset();
    var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: targetPosition, behavior: "smooth" });

    // Move focus for keyboard/screen-reader users once scrolling settles
    window.setTimeout(function () {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 400);
  }

  function getHeaderOffset() {
    var header = document.getElementById("sales-header");
    return header ? header.offsetHeight + 12 : 0;
  }

  /* ---------- FAQ Accordion ---------- */
  function initAccordion() {
    var triggers = document.querySelectorAll(".sales-accordion__trigger");
    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var panelId = trigger.getAttribute("aria-controls");
        var panel = document.getElementById(panelId);
        var isOpen = trigger.getAttribute("aria-expanded") === "true";

        // Accordion behavior: opening one closes the others
        triggers.forEach(function (otherTrigger) {
          if (otherTrigger === trigger) return;
          otherTrigger.setAttribute("aria-expanded", "false");
          var otherPanel = document.getElementById(otherTrigger.getAttribute("aria-controls"));
          if (otherPanel) otherPanel.hidden = true;
        });

        trigger.setAttribute("aria-expanded", String(!isOpen));
        if (panel) panel.hidden = isOpen;
      });
    });
  }

  /* ---------- Tenders map (Leaflet / OpenStreetMap, pins, popups, region filters) ---------- */
  function initTendersMap() {
    var mapEl = document.getElementById("sales-tenders-map");
    var popup = document.getElementById("sales-tenders-popup");
    if (!mapEl || !popup || typeof L === "undefined") return;

    // Move the popup out of the map-wrap and directly onto <body> — see the
    // CSS comment on .sales-tenders__popup for why (Leaflet's transformed
    // map pane was painting over it despite z-index).
    document.body.appendChild(popup);

    // Real coordinates of the tender locations — update here when new tenders/cities are added.
    var LOCATIONS = [
      { city: "שלומי", region: "north", lat: 33.0778, lng: 35.1858 },
      { city: "בית ג'אן", region: "north", lat: 32.9585, lng: 35.3618 },
      { city: "ירוחם", region: "south", lat: 30.9908, lng: 34.9317 },
      { city: "מצפה רמון", region: "south", lat: 30.6097, lng: 34.8014 },
      { city: "להבים", region: "south", lat: 31.3667, lng: 34.8 }
    ];

    // Israel's full outline — used both to mask everything outside the
    // country and as the map's fixed bounds. [lat, lng] pairs, simplified.
    // The eastern border here runs along the Jordan Valley/Dead Sea rather
    // than the Green Line, so Judea and Samaria are included with the rest
    // of the country rather than cut out as a separate area.
    var ISRAEL_OUTLINE = [
      [32.709192, 35.719918], [32.393992, 35.545665],
      [32.2, 35.55], [31.9, 35.55], [31.7, 35.5],
      [31.489086, 35.397561], [31.100066, 35.420918],
      [29.501326, 34.922603], [31.219361, 34.265433], [31.548824, 34.556372],
      [31.605539, 34.488107], [32.072926, 34.752587], [32.827376, 34.955417],
      [33.080539, 35.098457], [33.0909, 35.126053], [33.08904, 35.460709],
      [33.264275, 35.552797], [33.277426, 35.821101], [32.868123, 35.836397],
      [32.716014, 35.700798]
    ];

    var ISRAEL_FIT_BOUNDS = L.latLngBounds([29.3, 34.15], [33.45, 35.95]);
    var ISRAEL_MAX_BOUNDS = L.latLngBounds([28.9, 33.9], [33.9, 37.2]);

    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      minZoom: 7,
      maxBounds: ISRAEL_MAX_BOUNDS,
      maxBoundsViscosity: 1.0
    });

    // Label-free basemap — the standard OSM tiles bake in place-name labels
    // (Arabic among them) that we can't control per-language, and this map
    // already surfaces every place name itself via markers/popups, so a
    // clean unlabeled base avoids the issue entirely.
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
    }).addTo(map);

    // Cover the whole world in a light, semi-transparent overlay with Israel's
    // outline cut out as a hole (evenodd fill-rule, forced in CSS) — this fades
    // out everything outside the country instead of hiding it completely, so
    // Israel still reads as the highlighted focus of the map.
    var WORLD_RING = [[-85, -200], [-85, 200], [85, 200], [85, -200]];
    L.polygon([WORLD_RING, ISRAEL_OUTLINE], {
      className: "sales-tenders__map-mask",
      stroke: false,
      fillColor: "#ffffff",
      fillOpacity: 0.55,
      interactive: false
    }).addTo(map);

    // Plain dots only — no permanent name labels. Clicking a dot opens our own
    // popup panel (below), which we position ourselves in pixel space instead
    // of relying on Leaflet's built-in Popup — that always opens upward from
    // the marker with no fallback, which kept clipping at the map's edges.
    var markers = LOCATIONS.map(function (loc) {
      var marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: "#1c7a5e",
        fillOpacity: 1
      });
      marker.on("click", function () {
        openPopup(loc, marker);
      });
      marker.addTo(map);

      return { marker: marker, region: loc.region };
    });

    // A handful of major-city reference labels, in English — the tile layer
    // itself is label-free (see above), so these are the only place names
    // drawn on the map, and only over Israel's own area.
    var CITY_LABELS = [
      { name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
      { name: "Jerusalem", lat: 31.7683, lng: 35.2137 },
      { name: "Haifa", lat: 32.794, lng: 34.9896 },
      { name: "Beer Sheva", lat: 31.2518, lng: 34.7913 },
      { name: "Eilat", lat: 29.5581, lng: 34.9482 }
    ];
    CITY_LABELS.forEach(function (city) {
      L.circleMarker([city.lat, city.lng], { radius: 0, opacity: 0, fillOpacity: 0, interactive: false })
        .bindTooltip(city.name, { permanent: true, direction: "top", offset: [0, -2], className: "sales-tenders__map-city-label" })
        .addTo(map);
    });

    map.fitBounds(ISRAEL_FIT_BOUNDS, { padding: [16, 16] });

    var popupCity = popup.querySelector(".sales-tenders__popup-city");
    var popupBody = popup.querySelector(".sales-tenders__popup-body");
    var popupCloseBtn = popup.querySelector(".sales-tenders__popup-close");

    function buildPopupBody(city) {
      var items = document.querySelectorAll('.sales-tenders__item[data-city="' + city + '"]');
      popupBody.innerHTML = "";
      items.forEach(function (item) {
        var place = item.querySelector(".sales-tenders__item-place");
        var date = item.querySelector(".sales-tenders__item-date");
        var row = document.createElement("p");
        row.className = "sales-tenders__popup-row";
        row.textContent = (place ? place.textContent : "") + " — " + (date ? date.textContent : "");
        popupBody.appendChild(row);
      });

      var link = document.createElement("a");
      link.href = "#sales-lead-form";
      link.className = "sales-btn sales-btn--primary sales-btn--sm sales-tenders__popup-cta";
      link.textContent = "בדקו איתנו את המכרז";
      link.addEventListener("click", function (event) {
        event.preventDefault();
        closePopup();
        scrollToTarget("#sales-lead-form");
      });
      popupBody.appendChild(link);
    }

    // Positions the popup in fixed (viewport) pixel space around the
    // marker's on-screen point. The map is narrow, so the popup is always
    // kept horizontally clamped within the map's own width (never spills
    // out to the side into the page) and opens above the marker, or below
    // it if there isn't room.
    function positionPopup(marker) {
      var point = map.latLngToContainerPoint(marker.getLatLng());
      var mapRect = mapEl.getBoundingClientRect();
      var popupRect = popup.getBoundingClientRect();
      var gap = 14;
      var margin = 8;

      var markerX = mapRect.left + point.x;
      var markerY = mapRect.top + point.y;

      var halfWidth = popupRect.width / 2;
      var minX = mapRect.left + halfWidth + margin;
      var maxX = mapRect.right - halfWidth - margin;
      var clampedX = minX <= maxX
        ? Math.max(minX, Math.min(maxX, markerX))
        : (mapRect.left + mapRect.right) / 2;

      var openAbove = point.y >= popupRect.height + gap;
      popup.style.left = clampedX + "px";
      if (openAbove) {
        popup.style.top = (markerY - gap) + "px";
        popup.style.transform = "translate(-50%, -100%)";
      } else {
        popup.style.top = (markerY + gap) + "px";
        popup.style.transform = "translateX(-50%)";
      }
    }

    function openPopup(loc, marker) {
      popupCity.textContent = "📍 " + loc.city;
      buildPopupBody(loc.city);
      popup.hidden = false;
      // Measure the now-visible popup, then place it relative to the marker
      positionPopup(marker);
      map.once("movestart zoomstart", closePopup);
    }

    function closePopup() {
      popup.hidden = true;
    }

    if (popupCloseBtn) {
      popupCloseBtn.addEventListener("click", closePopup);
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePopup();
    });
    // The popup is fixed-position (viewport-relative), so a page scroll
    // would otherwise leave it visually detached from its marker.
    window.addEventListener("scroll", function () {
      if (!popup.hidden) closePopup();
    }, { passive: true });
    mapEl.parentElement.addEventListener("click", function (event) {
      if (popup.hidden) return;
      if (popup.contains(event.target)) return;
      if (event.target.closest(".leaflet-interactive")) return;
      closePopup();
    });

    /* ---------- Region filters ---------- */
    var filterButtons = document.querySelectorAll(".sales-tenders__filter");
    var groups = document.querySelectorAll(".sales-tenders__group");

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveFilter(button.getAttribute("data-region"));
      });
    });

    function setActiveFilter(region) {
      closePopup();
      filterButtons.forEach(function (button) {
        var isActive = button.getAttribute("data-region") === region;
        button.classList.toggle("sales-tenders__filter--active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      groups.forEach(function (group) {
        var isEmpty = !!group.querySelector(".sales-tenders__empty");
        if (region === "all") {
          group.hidden = isEmpty;
        } else {
          group.hidden = group.getAttribute("data-region") !== region;
        }
      });

      markers.forEach(function (item) {
        var matches = region === "all" || item.region === region;
        if (matches) {
          if (!map.hasLayer(item.marker)) item.marker.addTo(map);
        } else if (map.hasLayer(item.marker)) {
          map.removeLayer(item.marker);
        }
      });
    }
  }

  /* ---------- Lead form validation (client-side only) ---------- */
  function initLeadForm() {
    var form = document.getElementById("sales-lead-form-el");
    if (!form) return;

    var nameInput = document.getElementById("sales-name");
    var phoneInput = document.getElementById("sales-phone");
    var emailInput = document.getElementById("sales-email");
    var successMessage = document.getElementById("sales-lead-form-success");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var isValid = true;
      isValid = validateRequired(nameInput, "sales-name-error", "נא להזין שם מלא") && isValid;
      isValid = validatePhone(phoneInput, "sales-phone-error") && isValid;
      isValid = validateEmail(emailInput, "sales-email-error") && isValid;

      if (!isValid) return;

      /*
       * TODO (מפתח): Connect lead form to production backend / CRM
       * כרגע הטופס אינו שולח מידע לשום שרת. יש לחבר כאן קריאת רשת
       * אמיתית (fetch) ל-API / CRM המתאים, לדוגמה:
       *
       * fetch("https://YOUR-API-ENDPOINT", {
       *   method: "POST",
       *   headers: { "Content-Type": "application/json" },
       *   body: JSON.stringify({
       *     name: nameInput.value,
       *     phone: phoneInput.value,
       *     email: emailInput.value
       *   })
       * });
       */

      if (successMessage) {
        successMessage.hidden = false;
      }
      form.reset();
    });

    // Clear a field's error as soon as the user starts fixing it
    [nameInput, phoneInput, emailInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        input.removeAttribute("aria-invalid");
        var errorEl = document.getElementById(input.id + "-error");
        if (errorEl) errorEl.textContent = "";
      });
    });
  }

  function validateRequired(input, errorId, message) {
    var errorEl = document.getElementById(errorId);
    var value = input ? input.value.trim() : "";
    if (!value) {
      setFieldError(input, errorEl, message);
      return false;
    }
    setFieldError(input, errorEl, "");
    return true;
  }

  function validatePhone(input, errorId) {
    var errorEl = document.getElementById(errorId);
    var value = input ? input.value.trim() : "";
    // Accepts Israeli-style phone numbers: digits, spaces, dashes, optional leading +
    var phonePattern = /^\+?[\d\s-]{9,15}$/;

    if (!value) {
      setFieldError(input, errorEl, "נא להזין מספר טלפון");
      return false;
    }
    if (!phonePattern.test(value)) {
      setFieldError(input, errorEl, "מספר הטלפון אינו תקין");
      return false;
    }
    setFieldError(input, errorEl, "");
    return true;
  }

  function validateEmail(input, errorId) {
    var errorEl = document.getElementById(errorId);
    var value = input ? input.value.trim() : "";

    // Email is optional — only validate the format if something was entered
    if (!value) {
      setFieldError(input, errorEl, "");
      return true;
    }
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      setFieldError(input, errorEl, "כתובת אימייל אינה תקינה");
      return false;
    }
    setFieldError(input, errorEl, "");
    return true;
  }

  function setFieldError(input, errorEl, message) {
    if (errorEl) errorEl.textContent = message;
    if (input) {
      if (message) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    }
  }
})();
