/**
 * script.js — Portfolio JS
 * Corrections & improvements:
 *  - Null-safety checks before every DOM access
 *  - Mobile nav properly sets aria-hidden on the drawer
 *  - Active-nav uses a single rAF-throttled scroll handler
 *  - Skill bars now reset correctly on re-observation (edge-case fix)
 *  - Form fields linked to error elements via aria-describedby
 *  - Footer year auto-populated
 *  - No global variable pollution (IIFE wrapper)
 */

(function () {
  "use strict";

  /* ── Element references ─────────────────────────────────── */
  const navbar     = document.getElementById("navbar");
  const navMobile  = document.getElementById("nav-mobile");
  const navToggle  = document.getElementById("nav-toggle");
  const scrollBtn  = document.querySelector(".scroll-top");
  const yearEl     = document.getElementById("year");

  /** @type {NodeListOf<HTMLAnchorElement>} */
  const navLinks = document.querySelectorAll(".nav-link");

  /** @type {HTMLElement[]} */
  const sections = Array.from(document.querySelectorAll("section[id]"));

  /* ── Footer year ────────────────────────────────────────── */
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ══════════════════════════════════════════════════════════
     SMOOTH SCROLL
  ══════════════════════════════════════════════════════════ */
  function getNavHeight() {
    return navbar ? navbar.offsetHeight : 0;
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - getNavHeight() - 12;
      window.scrollTo({ top, behavior: "smooth" });

      if (navMobile?.classList.contains("open")) {
        closeMobileNav();
      }
    });
  });

  /* ══════════════════════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════════════════════ */
  function openMobileNav() {
    if (!navMobile || !navToggle) return;
    navMobile.classList.add("open");
    navMobile.removeAttribute("aria-hidden");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // prevent background scroll
  }

  function closeMobileNav() {
    if (!navMobile || !navToggle) return;
    navMobile.classList.remove("open");
    navMobile.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function toggleMobileNav() {
    if (navMobile?.classList.contains("open")) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  navToggle?.addEventListener("click", toggleMobileNav);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMobile?.classList.contains("open")) {
      closeMobileNav();
      navToggle?.focus(); // return focus to toggle
    }
  });

  // Close when clicking outside the nav
  document.addEventListener("click", (e) => {
    if (!navMobile?.classList.contains("open")) return;
    const target = /** @type {Node} */ (e.target);
    if (!navMobile.contains(target) && !navbar?.contains(target)) {
      closeMobileNav();
    }
  });

  // Close on resize above breakpoint
  window.addEventListener("resize", () => {
    if (window.innerWidth > 880 && navMobile?.classList.contains("open")) {
      closeMobileNav();
    }
  });

  /* ══════════════════════════════════════════════════════════
     SCROLL BEHAVIOUR (navbar hide/show + scroll-top btn)
  ══════════════════════════════════════════════════════════ */
  let lastScrollY    = window.scrollY;
  let scrollTicking  = false;

  function onScroll() {
    const currentY    = window.scrollY;
    const scrollingDown = currentY > lastScrollY + 4;
    const scrollingUp   = currentY < lastScrollY - 4;

    if (!navbar) return;

    // Transparent mode at top
    navbar.classList.toggle("navbar--transparent", currentY <= 10);

    // Hide on scroll-down, reveal on scroll-up
    if (scrollingDown && currentY > 80) {
      navbar.classList.add("navbar--hidden");
      // Close mobile nav if user scrolls
      if (navMobile?.classList.contains("open")) closeMobileNav();
    } else if (scrollingUp || currentY <= 80) {
      navbar.classList.remove("navbar--hidden");
    }

    // Scroll-to-top button visibility
    scrollBtn?.classList.toggle("visible", currentY > 320);

    lastScrollY = currentY;
    scrollTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // Run immediately so initial state is correct
  onScroll();

  /* ── Scroll to top ──────────────────────────────────────── */
  scrollBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ══════════════════════════════════════════════════════════
     ACTIVE NAV HIGHLIGHT
  ══════════════════════════════════════════════════════════ */
  let navTicking = false;

  function updateActiveNav() {
    const offset = getNavHeight() + 80;
    let activeId = sections.length ? sections[0].id : "";

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top - offset <= 0 && rect.bottom - offset > 0) {
        activeId = section.id;
        break;
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      link.classList.toggle("active", href === `#${activeId}`);
    });

    navTicking = false;
  }

  window.addEventListener("scroll", () => {
    if (!navTicking) {
      window.requestAnimationFrame(updateActiveNav);
      navTicking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", updateActiveNav);
  updateActiveNav();

  /* ══════════════════════════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════════════════════════ */
  const revealEls = document.querySelectorAll(".reveal-up");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ══════════════════════════════════════════════════════════
     SKILL BAR ANIMATIONS
  ══════════════════════════════════════════════════════════ */
  const skillBars = document.querySelectorAll(".skill-bar");

  if ("IntersectionObserver" in window) {
    const skillObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const bar  = /** @type {HTMLElement} */ (entry.target);
          const fill = bar.querySelector(".skill-fill");
          if (!fill) return;

          const level = Math.min(parseInt(bar.dataset.level || "0", 10), 100);

          // Use rAF to ensure the initial width:0 is painted first
          requestAnimationFrame(() => {
            /** @type {HTMLElement} */ (fill).style.width = `${level}%`;
          });

          skillObserver.unobserve(bar);
        });
      },
      { threshold: 0.3 }
    );

    skillBars.forEach((bar) => skillObserver.observe(bar));
  } else {
    // Fallback: set widths immediately
    skillBars.forEach((bar) => {
      const fill = bar.querySelector(".skill-fill");
      if (!fill) return;
      const level = Math.min(parseInt(/** @type {HTMLElement} */ (bar).dataset.level || "0", 10), 100);
      /** @type {HTMLElement} */ (fill).style.width = `${level}%`;
    });
  }

  /* ══════════════════════════════════════════════════════════
     CONTACT FORM
  ══════════════════════════════════════════════════════════ */
  const contactForm  = /** @type {HTMLFormElement|null} */ (document.getElementById("contact-form"));
  const formSuccess  = document.getElementById("form-success");

  /**
   * Show or clear an error for a form field.
   * @param {HTMLElement} field
   * @param {string}      message  Empty string clears the error.
   */
  function setFieldError(field, message) {
    const wrapper = field.closest(".form-field");
    if (!wrapper) return;

    const errorEl = wrapper.querySelector(".field-error");

    wrapper.classList.toggle("invalid", Boolean(message));

    if (message) {
      // Re-trigger shake animation
      wrapper.classList.remove("shake");
      void /** @type {HTMLElement} */ (wrapper).offsetWidth; // force reflow
      wrapper.classList.add("shake");
    }

    if (errorEl) errorEl.textContent = message || "";

    // Link field to error element for screen readers
    if (errorEl) {
      if (message) {
        field.setAttribute("aria-describedby", errorEl.id || "");
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-describedby");
        field.removeAttribute("aria-invalid");
      }
    }
  }

  /**
   * Validate an email string.
   * @param {string} value
   * @returns {string} Error message or empty string.
   */
  function validateEmail(value) {
    if (!value.trim()) return "Email is required.";
    // RFC-5322 simplified
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(value.trim())) return "Please enter a valid email address.";
    return "";
  }

  if (contactForm) {
    /* ── Submit handler ─────────────────────────────────── */
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (formSuccess) formSuccess.textContent = "";

      const nameField    = /** @type {HTMLInputElement}   */ (contactForm.elements.namedItem("name"));
      const emailField   = /** @type {HTMLInputElement}   */ (contactForm.elements.namedItem("email"));
      const subjectField = /** @type {HTMLInputElement}   */ (contactForm.elements.namedItem("subject"));
      const msgField     = /** @type {HTMLTextAreaElement}*/ (contactForm.elements.namedItem("message"));

      let hasError = false;

      // Name
      if (!nameField?.value.trim()) {
        setFieldError(nameField, "Name is required.");
        hasError = true;
      } else {
        setFieldError(nameField, "");
      }

      // Email
      const emailErr = validateEmail(emailField?.value || "");
      if (emailErr) {
        setFieldError(emailField, emailErr);
        hasError = true;
      } else {
        setFieldError(emailField, "");
      }

      // Subject
      if (!subjectField?.value.trim()) {
        setFieldError(subjectField, "Subject is required.");
        hasError = true;
      } else {
        setFieldError(subjectField, "");
      }

      // Message (min 10 chars)
      if (!msgField?.value.trim() || msgField.value.trim().length < 10) {
        setFieldError(msgField, "Please share at least a few details about your project.");
        hasError = true;
      } else {
        setFieldError(msgField, "");
      }

      if (hasError) return;

      // All valid — reset form and show success
      contactForm.reset();
      if (formSuccess) {
        formSuccess.textContent = "Thank you for reaching out! I'll get back to you within one business day.";
      }
    });

    /* ── Live validation on blur ────────────────────────── */
    const liveFields = ["name", "email", "subject", "message"];

    liveFields.forEach((fieldName) => {
      const field = /** @type {HTMLInputElement|HTMLTextAreaElement|null} */ (
        contactForm.elements.namedItem(fieldName)
      );
      if (!field) return;

      field.addEventListener("blur", () => {
        if (fieldName === "email") {
          setFieldError(field, validateEmail(field.value));
        } else if (!field.value.trim()) {
          setFieldError(field, "This field is required.");
        } else if (fieldName === "message" && field.value.trim().length < 10) {
          setFieldError(field, "Please share at least a few details about your project.");
        } else {
          setFieldError(field, "");
        }
      });

      // Clear error as user types after a failed submit
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") !== "true") return;

        if (fieldName === "email") {
          const err = validateEmail(field.value);
          if (!err) setFieldError(field, "");
        } else if (field.value.trim()) {
          if (fieldName !== "message" || field.value.trim().length >= 10) {
            setFieldError(field, "");
          }
        }
      });
    });
  }

})();