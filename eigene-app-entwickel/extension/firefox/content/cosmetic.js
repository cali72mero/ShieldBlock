/**
 * PrivacyToolbox – Cosmetic Content Script
 * Entfernt sichtbare Werbe-Elemente und Störer aus dem DOM.
 * Läuft automatisch auf allen Webseiten.
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

    /* ── Generisch (alle Seiten) ── */
    '*': [
      'ins.adsbygoogle',
      'amp-ad',
      '[id*="google_ads"]',
      '[data-google-query-id]',
      '[class*="ad-slot"]',
      '[class*="dfp-ad"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'img[width="1"][height="1"]',
      'img[src*="pixel"]',
      'img[src*="beacon"]',
      // Cookie Banner (kosmitisch)
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
    ]
  };

  /* ════════════════════════════════════════════
     CORE: Element-Entferner
     ════════════════════════════════════════════ */

  function getSelectorsForCurrentSite() {
    const host = window.location.hostname;
    let selectors = [...(COSMETIC_RULES['*'] || [])];

    Object.keys(COSMETIC_RULES).forEach(function (domain) {
      if (domain !== '*' && host.includes(domain)) {
        selectors = selectors.concat(COSMETIC_RULES[domain]);
      }
    });

    return selectors;
  }

  function removeElements() {
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
     Initialisierung + MutationObserver
     ════════════════════════════════════════════ */

  // Sofort ausführen
  removeElements();

  // Beobachter für dynamisch geladene Inhalte (SPA wie YouTube, Twitter, Reddit)
  let debounceTimer = null;
  const observer = new MutationObserver(function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(removeElements, 300);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // Periodisch prüfen (als Fallback für besonders aggressive Werbung)
  setInterval(removeElements, 3000);

})();
