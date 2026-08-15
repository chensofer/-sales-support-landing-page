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
    setCurrentYear();
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
    if (!mapEl || typeof L === "undefined") return;

    // Real coordinates of the tender locations — update here when new tenders/cities are added.
    // labelDirection alternates within each nearby pair so their name labels don't overlap.
    var LOCATIONS = [
      { city: "שלומי", region: "north", lat: 33.0778, lng: 35.1858, labelDirection: "top" },
      { city: "בית ג'אן", region: "north", lat: 32.9585, lng: 35.3618, labelDirection: "bottom" },
      { city: "ירוחם", region: "south", lat: 30.9908, lng: 34.9317, labelDirection: "top" },
      { city: "מצפה רמון", region: "south", lat: 30.6097, lng: 34.8014, labelDirection: "bottom" },
      { city: "להבים", region: "south", lat: 31.3667, lng: 34.8, labelDirection: "top" }
    ];

    // Israel's real border outline — used both to mask everything outside the
    // country and as the map's fixed bounds. [lat, lng] pairs, simplified.
    var ISRAEL_OUTLINE = [
      [32.709192, 35.719918], [32.393992, 35.545665], [32.532511, 35.18393],
      [31.866582, 34.974641], [31.754341, 35.225892], [31.616778, 34.970507],
      [31.353435, 34.927408], [31.489086, 35.397561], [31.100066, 35.420918],
      [29.501326, 34.922603], [31.219361, 34.265433], [31.548824, 34.556372],
      [31.605539, 34.488107], [32.072926, 34.752587], [32.827376, 34.955417],
      [33.080539, 35.098457], [33.0909, 35.126053], [33.08904, 35.460709],
      [33.264275, 35.552797], [33.277426, 35.821101], [32.868123, 35.836397],
      [32.716014, 35.700798]
    ];

    // Tight fit for the initial view, vs. a looser limit for panning — the gap
    // between the two gives popups near edge markers (e.g. שלומי, בית ג'אן) room
    // to auto-pan into view instead of being clipped by the map container.
    var ISRAEL_FIT_BOUNDS = L.latLngBounds([29.3, 34.15], [33.45, 35.95]);
    var ISRAEL_MAX_BOUNDS = L.latLngBounds([28.6, 33.6], [34.2, 37.5]);

    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      minZoom: 6,
      maxBounds: ISRAEL_MAX_BOUNDS,
      maxBoundsViscosity: 1.0
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
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

    var markers = LOCATIONS.map(function (loc) {
      var marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: "#1c7a5e",
        fillOpacity: 1
      });

      marker.bindTooltip(loc.city, {
        permanent: true,
        interactive: true,
        direction: loc.labelDirection,
        offset: loc.labelDirection === "bottom" ? [0, 8] : [0, -8],
        className: "sales-tenders__map-label"
      });

      // Clicking the name label opens the popup too, not just the dot
      marker.on("tooltipopen", function (event) {
        var tooltipEl = event.tooltip.getElement();
        if (!tooltipEl) return;
        tooltipEl.addEventListener("click", function () {
          marker.openPopup();
        });
      });

      marker.bindPopup(buildPopupHtml(loc.city), { autoPanPadding: [24, 24] });
      marker.on("popupopen", bindPopupCta);
      marker.on("popupopen", clampPopupIntoView);
      marker.addTo(map);

      return { marker: marker, region: loc.region };
    });

    // Belt-and-suspenders fix for popups clipped at the map's edge: measure
    // the popup's actual rendered position against the container and, if it
    // still overflows the top, pan the map by the exact missing amount.
    // This works regardless of zoom level or fitBounds padding math, since
    // it reacts to the real measured pixels instead of a guessed offset.
    function clampPopupIntoView(event) {
      var popupEl = event.popup.getElement();
      if (!popupEl) return;
      requestAnimationFrame(function () {
        var mapRect = mapEl.getBoundingClientRect();
        var popupRect = popupEl.getBoundingClientRect();
        var overflowTop = mapRect.top - popupRect.top;
        if (overflowTop > 0) {
          map.panBy([0, -(overflowTop + 16)], { animate: true });
        }
      });
    }

    // Extra top padding leaves real empty space above שלומי (the northernmost
    // point) so its popup — which Leaflet always opens upward from the marker —
    // has room to render without being clipped by the map container.
    map.fitBounds(ISRAEL_FIT_BOUNDS, {
      paddingTopLeft: [20, 190],
      paddingBottomRight: [20, 30]
    });

    function buildPopupHtml(city) {
      var items = document.querySelectorAll('.sales-tenders__item[data-city="' + city + '"]');
      var rows = "";
      items.forEach(function (item) {
        var place = item.querySelector(".sales-tenders__item-place");
        var date = item.querySelector(".sales-tenders__item-date");
        rows += '<p class="sales-tenders__popup-row">' + (place ? place.textContent : "") + " — " + (date ? date.textContent : "") + "</p>";
      });
      return (
        '<p class="sales-tenders__popup-city">📍 ' + city + "</p>" +
        rows +
        '<a href="#sales-lead-form" class="sales-btn sales-btn--primary sales-btn--sm sales-tenders__popup-cta">בדקו איתנו את המכרז</a>'
      );
    }

    // Dynamically-created popup links aren't picked up by initSmoothScroll, so wire them here
    function bindPopupCta(event) {
      var popupEl = event.popup.getElement();
      var link = popupEl ? popupEl.querySelector('a[href="#sales-lead-form"]') : null;
      if (!link) return;
      link.addEventListener("click", function (clickEvent) {
        clickEvent.preventDefault();
        map.closePopup();
        scrollToTarget("#sales-lead-form");
      });
    }

    /* ---------- Region filters ---------- */
    var filterButtons = document.querySelectorAll(".sales-tenders__filter");
    var groups = document.querySelectorAll(".sales-tenders__group");

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveFilter(button.getAttribute("data-region"));
      });
    });

    function setActiveFilter(region) {
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

  /* ---------- Footer year ---------- */
  function setCurrentYear() {
    var el = document.getElementById("sales-current-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
