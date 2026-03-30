/**
 * ShieldBlock – Background Service Worker
 * Verwaltet den Zustand der Erweiterung und zählt blockierte Requests.
 */

// Default-Einstellungen
const DEFAULT_SETTINGS = {
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  blockAnnoyances: true,
  totalBlocked: 0,
  sessionBlocked: 0
};

// Beim Installieren: Standardeinstellungen setzen
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(null);
  const settings = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.local.set(settings);
  await updateRulesets(settings);
  console.log('[ShieldBlock] Installiert – Alle Schutzschilde aktiv!');
});

// Beim Starten: Session-Counter zurücksetzen
chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.local.set({ sessionBlocked: 0 });
});

// Regelsets aktivieren/deaktivieren basierend auf Einstellungen
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
    await chrome.declarativeNetRequest.updateEnabledRulesets({
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
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settingsChanged',
          enabled: settings.enabled !== false
        }).catch(() => {});
      } catch (e) { /* Tab hat kein Content Script */ }
    }
  } catch (e) { /* tabs API nicht verfügbar */ }
}

// Erlaubte Message-Typen (Whitelist)
const ALLOWED_MSG_TYPES = ['getSettings', 'updateSettings', 'getStats', 'incrementBlocked'];

// Nachrichten vom Popup oder Content-Script empfangen
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Sicherheit: Nur bekannte Nachrichtentypen akzeptieren
  if (!msg || typeof msg.type !== 'string' || !ALLOWED_MSG_TYPES.includes(msg.type)) {
    return false;
  }

  if (msg.type === 'getSettings') {
    chrome.storage.local.get(null).then(sendResponse);
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

    chrome.storage.local.get(null).then(async (current) => {
      const updated = { ...current, ...sanitized };
      await chrome.storage.local.set(updated);
      await updateRulesets(updated);
      await broadcastSettingsToTabs(updated);
      sendResponse(updated);
    });
    return true;
  }

  if (msg.type === 'getStats') {
    chrome.storage.local.get(['totalBlocked', 'sessionBlocked']).then(sendResponse);
    return true;
  }

  if (msg.type === 'incrementBlocked') {
    // Sicherheit: count muss eine positive Ganzzahl sein, max 1000 pro Aufruf
    let count = parseInt(msg.count, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 1000) count = 1000;

    chrome.storage.local.get(['totalBlocked', 'sessionBlocked']).then(async (data) => {
      await chrome.storage.local.set({
        totalBlocked: (data.totalBlocked || 0) + count,
        sessionBlocked: (data.sessionBlocked || 0) + count
      });
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Badge-Text und -Farbe aktualisieren bei blockierten Requests
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
    const data = await chrome.storage.local.get(['totalBlocked', 'sessionBlocked']);
    const total = (data.totalBlocked || 0) + 1;
    const session = (data.sessionBlocked || 0) + 1;
    await chrome.storage.local.set({ totalBlocked: total, sessionBlocked: session });

    // Badge auf dem Tab aktualisieren
    if (info.request && info.request.tabId > 0) {
      const text = session > 999 ? '999+' : String(session);
      chrome.action.setBadgeText({ text, tabId: info.request.tabId }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ color: '#7c4dff', tabId: info.request.tabId }).catch(() => {});
    }
  });
}

// Fallback: Badge periodisch aktualisieren
setInterval(async () => {
  const data = await chrome.storage.local.get(['sessionBlocked', 'enabled']);
  if (data.enabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4757' });
  } else {
    const count = data.sessionBlocked || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#0f9b58' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}, 5000);
