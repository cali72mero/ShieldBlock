/**
 * PrivacyToolbox – Popup Script
 * Lädt Einstellungen, zeigt Statistiken und reagiert auf Toggle-Änderungen.
 */
(function () {
  'use strict';

  const popup = document.querySelector('.popup');
  const btnPower = document.getElementById('btn-power');
  const inputAds = document.getElementById('input-ads');
  const inputTrackers = document.getElementById('input-trackers');
  const inputAnnoyances = document.getElementById('input-annoyances');
  const statSession = document.getElementById('stat-session');
  const statTotal = document.getElementById('stat-total');

  // Zahl formatieren (1234 → 1.234)
  function formatNumber(n) {
    return (n || 0).toLocaleString('de-DE');
  }

  // Einstellungen vom Background laden
  function loadSettings() {
    chrome.runtime.sendMessage({ type: 'getSettings' }, function (settings) {
      if (!settings) return;

      inputAds.checked = settings.blockAds !== false;
      inputTrackers.checked = settings.blockTrackers !== false;
      inputAnnoyances.checked = settings.blockAnnoyances !== false;

      if (settings.enabled === false) {
        popup.classList.add('is-disabled');
        btnPower.classList.add('is-off');
      } else {
        popup.classList.remove('is-disabled');
        btnPower.classList.remove('is-off');
      }

      statSession.textContent = formatNumber(settings.sessionBlocked);
      statTotal.textContent = formatNumber(settings.totalBlocked);
    });
  }

  // Einstellung speichern
  function saveSettings(key, value) {
    const patch = {};
    patch[key] = value;
    chrome.runtime.sendMessage({ type: 'updateSettings', settings: patch });
  }

  // Power-Button
  btnPower.addEventListener('click', function () {
    const isOff = btnPower.classList.toggle('is-off');
    popup.classList.toggle('is-disabled', isOff);
    saveSettings('enabled', !isOff);
  });

  // Toggles
  inputAds.addEventListener('change', function () {
    saveSettings('blockAds', this.checked);
  });

  inputTrackers.addEventListener('change', function () {
    saveSettings('blockTrackers', this.checked);
  });

  inputAnnoyances.addEventListener('change', function () {
    saveSettings('blockAnnoyances', this.checked);
  });

  // Stats periodisch aktualisieren
  function refreshStats() {
    chrome.runtime.sendMessage({ type: 'getStats' }, function (data) {
      if (!data) return;
      statSession.textContent = formatNumber(data.sessionBlocked);
      statTotal.textContent = formatNumber(data.totalBlocked);
    });
  }

  // Init
  loadSettings();
  setInterval(refreshStats, 2000);

})();
