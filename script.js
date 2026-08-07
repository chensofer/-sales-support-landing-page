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
        if (!targetId || targetId === "#") return;
        var target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        var headerOffset = getHeaderOffset();
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });

        // Move focus for keyboard/screen-reader users once scrolling settles
        window.setTimeout(function () {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }, 400);
      });
    });
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
