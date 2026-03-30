/**
 * ShieldBlock – Cosmetic Content Script
 * Entfernt sichtbare Werbe-Elemente und Störer aus dem DOM.
 * WICHTIG: Selektoren dürfen keine normalen Video-/Content-Links blockieren!
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════
     KONFIGURATION: Selektoren pro Plattform
     ════════════════════════════════════════════ */

  const COSMETIC_RULES = {

    /* ── YouTube ── */
    'youtube.com': [
      'ytd-ad-slot-renderer',
      'ytd-banner-promo-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-display-ad-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-primetime-promo-renderer',
      'ytd-compact-promoted-item-renderer',
      'ytd-statement-banner-renderer',
      'ytd-merch-shelf-renderer',
      '#masthead-ad',
      '#player-ads',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.video-ads',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
      'tp-yt-paper-dialog:has(#sponsor-button)',
      '#related ytd-ad-slot-renderer'
    ],

    /* ── Twitter / X ── */
    'twitter.com': [
      '[data-testid="placementTracking"]',
      'div[data-testid="cellInnerDiv"]:has(svg path[d*="M19.498"])',
      '[class*="promoted"]'
    ],

    'x.com': [
      '[data-testid="placementTracking"]',
      'div[data-testid="cellInnerDiv"]:has(svg path[d*="M19.498"])',
      '[class*="promoted"]'
    ],

    /* ── Reddit ── */
    'reddit.com': [
      'shreddit-ad-post',
      '[data-ad-id]',
      '[id*="promoted"]',
      '[data-testid="promoted-link"]',
      '.promoted',
      '.sponsorshipbox',
      '.premium-banner-outer',
      '.premium-banner',
      '.ad-container',
      '[data-testid="frontpage-sidebar-ad-tag"]',
      '[data-testid="xpromo-nsfw-modal"]',
      '.XPromoPopupRpl',
      '.XPromoNativeAppLink',
      '#xpromo-app-selector',
      '[class*="XPromo"]',
      '[class*="xpromo"]',
      '.TopNav__promoButton',
      '.mweb-xpromo-modal'
    ],

    /* ── Generisch (alle Seiten, AUSSER YouTube) ── */
    '*': [
      'ins.adsbygoogle',
      'amp-ad',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'img[width="1"][height="1"]',
      'img[src*="/pixel?"]',
      'img[src*="beacon"]',
      // Cookie Banner
      '#CybotCookiebotDialog',
      '#CybotCookiebotDialogBodyUnderlay',
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '.onetrust-pc-dark-filter',
      '#qc-cmp2-container',
      '#didomi-popup',
      '#didomi-host',
      '#truste-consent-track',
      '.truste_overlay',
      '#usercentrics-root',
      '[id^="sp_message_container"]',
      '#cookie-notice',
      '#cookie-law-info-bar',
      '[class*="cookie-banner"]',
      '[class*="cookie-consent"]',
      '[class*="cookie-popup"]',
      '[class*="cookie-modal"]',
      '[class*="consent-banner"]',
      '[class*="consent-modal"]',
      '[class*="consent-overlay"]',
      '[class*="gdpr-banner"]',
      '[id*="cookie-banner"]',
      '[id*="cookie-consent"]',
      '[id*="consent-banner"]'
    ],

    /* ── Nur auf NICHT-YouTube-Seiten (zu breit für YouTube) ── */
    '_generic_no_youtube': [
      '[id*="google_ads"]',
      '[data-google-query-id]',
      '[class*="ad-slot"]',
      '[class*="dfp-ad"]'
    ]
  };

  /* ════════════════════════════════════════════
     CORE: Element-Entferner
     ════════════════════════════════════════════ */

  function getSelectorsForCurrentSite() {
    const host = window.location.hostname;
    let selectors = [...(COSMETIC_RULES['*'] || [])];

    // Breite generische Selektoren NUR auf Nicht-YouTube-Seiten anwenden
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
      selectors = selectors.concat(COSMETIC_RULES['_generic_no_youtube'] || []);
    }

    Object.keys(COSMETIC_RULES).forEach(function (domain) {
      if (domain !== '*' && domain !== '_generic_no_youtube' && host.includes(domain)) {
        selectors = selectors.concat(COSMETIC_RULES[domain]);
      }
    });

    return selectors;
  }

  /* ════════════════════════════════════════════
     STATUS: Ist die Erweiterung aktiv?
     ════════════════════════════════════════════ */

  let isEnabled = true;
  let observer = null;
  let intervalId = null;

  // Einstellungen vom Background laden
  function loadEnabledState(callback) {
    try {
      chrome.runtime.sendMessage({ type: 'getSettings' }, function (settings) {
        if (chrome.runtime.lastError || !settings) {
          isEnabled = true; // Fallback: aktiv
        } else {
          isEnabled = settings.enabled !== false;
        }
        if (callback) callback();
      });
    } catch (e) {
      isEnabled = true; // Fallback wenn Extension-Context ungültig
      if (callback) callback();
    }
  }

  // Auf Einstellungsänderungen vom Popup reagieren
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg.type === 'settingsChanged') {
        isEnabled = msg.enabled !== false;
        if (isEnabled) {
          startBlocking();
        } else {
          stopBlocking();
        }
      }
    });
  } catch (e) { /* Extension-Context ungültig */ }

  /* ════════════════════════════════════════════
     CORE: Element-Entferner
     ════════════════════════════════════════════ */

  function removeElements() {
    // WICHTIG: Wenn ausgeschaltet, nichts tun!
    if (!isEnabled) return 0;

    const selectors = getSelectorsForCurrentSite();
    let removed = 0;

    selectors.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          el.remove();
          removed++;
        });
      } catch (e) {
        // Ungültiger Selektor – ignorieren
      }
    });

    // YouTube: Skip-Ad-Button automatisch klicken
    if (window.location.hostname.includes('youtube.com')) {
      const skipBtn = document.querySelector(
        '.ytp-ad-skip-button, .ytp-skip-ad-button, button.ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button'
      );
      if (skipBtn) {
        skipBtn.click();
        removed++;
      }

      // Video-Ads: "ad-showing" Klasse erkennen und Skip erzwingen
      const player = document.querySelector('.html5-video-player');
      if (player && player.classList.contains('ad-showing')) {
        const video = player.querySelector('video');
        if (video) {
          video.currentTime = video.duration || 999;
          removed++;
        }
      }
    }

    // Twitter/X: Promoted Tweets über Text erkennen
    if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
      document.querySelectorAll('article').forEach(function (tweet) {
        const spans = tweet.querySelectorAll('span');
        for (let i = 0; i < spans.length; i++) {
          const text = (spans[i].textContent || '').toLowerCase().trim();
          if (text === 'ad' || text === 'promoted' || text === 'gesponsert' || text === 'anzeige' || text === 'werbung') {
            tweet.closest('[data-testid="cellInnerDiv"]')?.remove() || tweet.remove();
            removed++;
            break;
          }
        }
      });
    }

    // Scroll-Blockade aufheben (Cookie-Banner)
    if (removed > 0) {
      document.documentElement.style.setProperty('overflow', 'auto', 'important');
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.body.style.position = '';
      ['cookie-consent-active', 'modal-open', 'no-scroll', 'overflow-hidden', 'has-overlay', 'noscroll'].forEach(function (cls) {
        document.documentElement.classList.remove(cls);
        document.body.classList.remove(cls);
      });
    }

    // Statistik ans Background-Script melden
    if (removed > 0) {
      try {
        chrome.runtime.sendMessage({ type: 'incrementBlocked', count: removed });
      } catch (e) { /* Erweiterung evtl. nicht verfügbar */ }
    }

    return removed;
  }

  /* ════════════════════════════════════════════
     Blocking starten / stoppen
     ════════════════════════════════════════════ */

  function startBlocking() {
    // Sofort ausführen
    removeElements();

    // MutationObserver starten (falls nicht schon aktiv)
    if (!observer) {
      let debounceTimer = null;
      observer = new MutationObserver(function () {
        if (!isEnabled) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(removeElements, 300);
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    // Periodischen Check starten
    if (!intervalId) {
      intervalId = setInterval(function () {
        if (isEnabled) removeElements();
      }, 3000);
    }
  }

  function stopBlocking() {
    // MutationObserver stoppen
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // Periodischen Check stoppen
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /* ════════════════════════════════════════════
     Initialisierung
     ════════════════════════════════════════════ */

  loadEnabledState(function () {
    if (isEnabled) {
      startBlocking();
    }
  });

})();
