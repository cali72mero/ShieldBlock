/**
 * ShieldBlock – Background Script (Firefox)
 * Verwaltet den Zustand der Erweiterung und zählt blockierte Requests.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  blockAnnoyances: true,
  totalBlocked: 0,
  sessionBlocked: 0
};

browser.runtime.onInstalled.addListener(async () => {
  const existing = await browser.storage.local.get(null);
  const settings = { ...DEFAULT_SETTINGS, ...existing };
  await browser.storage.local.set(settings);
  await updateRulesets(settings);
  console.log('[ShieldBlock] Installiert – Alle Schutzschilde aktiv!');
});

browser.runtime.onStartup.addListener(async () => {
  await browser.storage.local.set({ sessionBlocked: 0 });
});

async function updateRulesets(settings) {
  const enable = [];
  const disable = [];

  // Wenn die Erweiterung komplett AUS ist, ALLES deaktivieren
  if (settings.enabled === false) {
    disable.push('ads', 'trackers', 'annoyances');
  } else {
    if (settings.blockAds) { enable.push('ads'); } else { disable.push('ads'); }
    if (settings.blockTrackers) { enable.push('trackers'); } else { disable.push('trackers'); }
    if (settings.blockAnnoyances) { enable.push('annoyances'); } else { disable.push('annoyances'); }
  }

  try {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enable,
      disableRulesetIds: disable
    });
  } catch (e) {
    console.warn('[ShieldBlock] Ruleset-Update fehlgeschlagen:', e);
  }
}

// Einstellungsänderung an alle offenen Tabs senden
async function broadcastSettingsToTabs(settings) {
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      try {
        browser.tabs.sendMessage(tab.id, {
          type: 'settingsChanged',
          enabled: settings.enabled !== false
        }).catch(() => {});
      } catch (e) { /* Tab hat kein Content Script */ }
    }
  } catch (e) { /* tabs API nicht verfügbar */ }
}

// Erlaubte Message-Typen (Whitelist)
const ALLOWED_MSG_TYPES = ['getSettings', 'updateSettings', 'getStats', 'incrementBlocked'];

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Sicherheit: Nur bekannte Nachrichtentypen akzeptieren
  if (!msg || typeof msg.type !== 'string' || !ALLOWED_MSG_TYPES.includes(msg.type)) {
    return false;
  }

  if (msg.type === 'getSettings') {
    browser.storage.local.get(null).then(sendResponse);
    return true;
  }

  if (msg.type === 'updateSettings') {
    // Sicherheit: Nur erlaubte Einstellungs-Keys akzeptieren
    const ALLOWED_KEYS = ['enabled', 'blockAds', 'blockTrackers', 'blockAnnoyances'];
    const sanitized = {};
    if (msg.settings && typeof msg.settings === 'object') {
      for (const key of ALLOWED_KEYS) {
        if (key in msg.settings && typeof msg.settings[key] === 'boolean') {
          sanitized[key] = msg.settings[key];
        }
      }
    }

    browser.storage.local.get(null).then(async (current) => {
      const updated = { ...current, ...sanitized };
      await browser.storage.local.set(updated);
      await updateRulesets(updated);
      await broadcastSettingsToTabs(updated);
      sendResponse(updated);
    });
    return true;
  }

  if (msg.type === 'getStats') {
    browser.storage.local.get(['totalBlocked', 'sessionBlocked']).then(sendResponse);
    return true;
  }

  if (msg.type === 'incrementBlocked') {
    // Sicherheit: count muss eine positive Ganzzahl sein, max 1000 pro Aufruf
    let count = parseInt(msg.count, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 1000) count = 1000;

    browser.storage.local.get(['totalBlocked', 'sessionBlocked']).then(async (data) => {
      await browser.storage.local.set({
        totalBlocked: (data.totalBlocked || 0) + count,
        sessionBlocked: (data.sessionBlocked || 0) + count
      });
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Badge periodisch aktualisieren
setInterval(async () => {
  const data = await browser.storage.local.get(['sessionBlocked', 'enabled']);
  if (data.enabled === false) {
    browser.action.setBadgeText({ text: 'OFF' });
    browser.action.setBadgeBackgroundColor({ color: '#ff4757' });
  } else {
    const count = data.sessionBlocked || 0;
    if (count > 0) {
      browser.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
      browser.action.setBadgeBackgroundColor({ color: '#0f9b58' });
    } else {
      browser.action.setBadgeText({ text: '' });
    }
  }
}, 5000);
