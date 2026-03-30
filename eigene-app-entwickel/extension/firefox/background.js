/**
 * PrivacyToolbox – Background Script (Firefox)
 * Identisch zum Chromium-Script, aber als background.scripts statt service_worker.
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
  console.log('[PrivacyToolbox] Installiert – Alle Schutzschilde aktiv!');
});

browser.runtime.onStartup.addListener(async () => {
  await browser.storage.local.set({ sessionBlocked: 0 });
});

async function updateRulesets(settings) {
  const enable = [];
  const disable = [];

  if (settings.blockAds) { enable.push('ads'); } else { disable.push('ads'); }
  if (settings.blockTrackers) { enable.push('trackers'); } else { disable.push('trackers'); }
  if (settings.blockAnnoyances) { enable.push('annoyances'); } else { disable.push('annoyances'); }

  try {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enable,
      disableRulesetIds: disable
    });
  } catch (e) {
    console.warn('[PrivacyToolbox] Ruleset-Update fehlgeschlagen:', e);
  }
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getSettings') {
    browser.storage.local.get(null).then(sendResponse);
    return true;
  }

  if (msg.type === 'updateSettings') {
    browser.storage.local.get(null).then(async (current) => {
      const updated = { ...current, ...msg.settings };
      await browser.storage.local.set(updated);
      await updateRulesets(updated);
      sendResponse(updated);
    });
    return true;
  }

  if (msg.type === 'getStats') {
    browser.storage.local.get(['totalBlocked', 'sessionBlocked']).then(sendResponse);
    return true;
  }

  if (msg.type === 'incrementBlocked') {
    browser.storage.local.get(['totalBlocked', 'sessionBlocked']).then(async (data) => {
      const count = msg.count || 1;
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
  if (!data.enabled) {
    browser.action.setBadgeText({ text: 'OFF' });
    browser.action.setBadgeBackgroundColor({ color: '#ff4757' });
  } else {
    const count = data.sessionBlocked || 0;
    if (count > 0) {
      browser.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
      browser.action.setBadgeBackgroundColor({ color: '#0f9b58' });
    }
  }
}, 5000);
