/**
 * PrivacyToolbox – Background Service Worker
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
  console.log('[PrivacyToolbox] Installiert – Alle Schutzschilde aktiv!');
});

// Beim Starten: Session-Counter zurücksetzen
chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.local.set({ sessionBlocked: 0 });
});

// Regelsets aktivieren/deaktivieren basierend auf Einstellungen
async function updateRulesets(settings) {
  const enable = [];
  const disable = [];

  if (settings.blockAds) { enable.push('ads'); } else { disable.push('ads'); }
  if (settings.blockTrackers) { enable.push('trackers'); } else { disable.push('trackers'); }
  if (settings.blockAnnoyances) { enable.push('annoyances'); } else { disable.push('annoyances'); }

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enable,
      disableRulesetIds: disable
    });
  } catch (e) {
    console.warn('[PrivacyToolbox] Ruleset-Update fehlgeschlagen:', e);
  }
}

// Nachrichten vom Popup oder Content-Script empfangen
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getSettings') {
    chrome.storage.local.get(null).then(sendResponse);
    return true;
  }

  if (msg.type === 'updateSettings') {
    chrome.storage.local.get(null).then(async (current) => {
      const updated = { ...current, ...msg.settings };
      await chrome.storage.local.set(updated);
      await updateRulesets(updated);
      sendResponse(updated);
    });
    return true;
  }

  if (msg.type === 'getStats') {
    chrome.storage.local.get(['totalBlocked', 'sessionBlocked']).then(sendResponse);
    return true;
  }

  if (msg.type === 'incrementBlocked') {
    chrome.storage.local.get(['totalBlocked', 'sessionBlocked']).then(async (data) => {
      const count = msg.count || 1;
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
  if (!data.enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4757' });
  } else {
    const count = data.sessionBlocked || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#0f9b58' });
    }
  }
}, 5000);
