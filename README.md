<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-7c4dff?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-Custom-4f8cff?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/manifest-V3-00d2ff?style=for-the-badge" alt="Manifest V3">
  <img src="https://img.shields.io/badge/privacy-100%25-0f9b58?style=for-the-badge" alt="Privacy">
</p>

<h1 align="center">🛡️ ShieldBlock</h1>

<p align="center">
  <strong>Der datenschutzfreundlichste Werbe- & Tracker-Blocker der Welt.</strong><br>
  Blockiert Werbung auf YouTube, Twitter/X, Reddit und mehr.<br>
  100% lokal, 100% Open Source, 0% Datensammlung.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/🚀_Version-1.0_(Erste_Version!)-7c4dff?style=for-the-badge" alt="v1.0">
</p>

<p align="center">
  <em>Dieses Projekt wird von <strong>einem einzigen Entwickler</strong> gebaut und gepflegt.<br>
  Ich gebe mein Bestes, den datenschutzfreundlichsten Adblocker zu entwickeln, den es gibt. 💜</em>
</p>

<p align="center">
  <a href="#-installation">Installation</a> •
  <a href="#-features">Features</a> •
  <a href="#-datenschutz">Datenschutz</a> •
  <a href="#-vergleich">Vergleich</a> •
  <a href="#-lizenz">Lizenz</a>
</p>

---

## ⚡ Features

| Feature | Beschreibung |
|---|---|
| 📺 **YouTube werbefrei** | Blockiert Pre-Roll, Mid-Roll, Overlay-Ads und Companion-Ads. Überspringt unskippable Ads automatisch. **20+ spezifische YouTube-Regeln.** |
| 🐦 **Twitter/X Clean** | Entfernt Promoted Tweets, Werbe-Trends und Tracking-Pixel aus deinem Feed. |
| 🤖 **Reddit ohne Werbung** | Blockiert Sponsored Posts, App-Nag-Popups und Sidebar-Werbung. |
| 🔍 **90+ Tracker blockiert** | Google Analytics, Facebook Pixel, Hotjar, Mixpanel, Segment, Clarity und viele mehr. |
| 🍪 **Cookie-Banner entfernen** | Cookiebot, OneTrust, Didomi, Quantcast, Usercentrics – alle werden automatisch entfernt. |
| 🌐 **40+ Werbenetzwerke** | DoubleClick, Taboola, Outbrain, Criteo, Amazon Ads, AdSense und mehr. |
| ⚡ **Manifest V3** | Nutzt die moderne `declarativeNetRequest` API – blockiert Werbung auf Netzwerkebene, bevor sie geladen wird. |
| 🎨 **Premium Dark-Mode UI** | Elegantes Popup mit Live-Statistiken und Ein-Klick-Toggles. |

---

## 📦 Installation

### 🌐 Chrome / Brave / Vivaldi

1. **Lade dieses Repository herunter:** Klicke auf `Code` → `Download ZIP` und entpacke es
2. Öffne **`chrome://extensions`** in deinem Browser
3. Aktiviere den **Entwicklermodus** (Schalter rechts oben)
4. Klicke auf **"Entpackte Erweiterung laden"**
5. Wähle den Ordner **`extension/chromium/`**
6. **Fertig!** 🎉 Das Shield-Icon erscheint in deiner Toolbar

### 🦊 Firefox

1. **Lade dieses Repository herunter**
2. Öffne **`about:debugging#/runtime/this-firefox`**
3. Klicke auf **"Temporäres Add-on laden"**
4. Wähle die Datei **`extension/firefox/manifest.json`**
5. **Fertig!** 🎉

---

## 🔒 Datenschutz

ShieldBlock wurde mit einer einzigen Mission gebaut: **Deine Privatsphäre schützen, nicht sie ausnutzen.**

| Versprechen | Status |
|---|---|
| Keine Telemetrie | ✅ Garantiert |
| Keine Nutzerdaten | ✅ Garantiert |
| Keine externen Server | ✅ Garantiert |
| Keine Cookies | ✅ Garantiert |
| Kein "Acceptable Ads" | ✅ Garantiert |
| Alle Filter lokal eingebettet | ✅ Garantiert |
| 100% Open Source | ✅ Garantiert |
| DSGVO-konform | ✅ Garantiert |

> **Andere Adblocker** laden Filter-Listen von externen Servern herunter – dabei wird deine IP-Adresse übertragen. ShieldBlock hat **alle 110+ Regeln lokal eingebettet**. Dein Browser kontaktiert niemals einen fremden Server.

---

## 🧰 Wie ShieldBlock funktioniert

ShieldBlock arbeitet auf **zwei Ebenen** für maximalen Schutz:

### Ebene 1: Netzwerk-Blockierung
Über die `declarativeNetRequest` API werden Werbe- und Tracking-Anfragen **blockiert, bevor sie den Server erreichen**. Dein Browser lädt die Werbung gar nicht erst herunter.

**110+ Regeln** in drei Kategorien:
- `ads.json` – 60 Regeln gegen Werbenetzwerke
- `trackers.json` – 35 Regeln gegen Tracking-Dienste
- `annoyances.json` – 15 Regeln gegen Cookie-Banner & Push-Spam

### Ebene 2: DOM-Reinigung
Ein Content Script mit **MutationObserver** überwacht die Seite kontinuierlich und entfernt Werbe-Elemente, die trotz Netzwerk-Blockierung sichtbar werden könnten. Besonders wichtig für Single-Page-Apps wie YouTube und Twitter.

---

## 📊 Vergleich

| | ShieldBlock | uBlock Origin | AdBlock Plus |
|---|:---:|:---:|:---:|
| Open Source | ✅ | ✅ | ✅ |
| Keine Datensammlung | ✅ | ✅ | ❌ |
| Kein "Acceptable Ads" | ✅ | ✅ | ❌ |
| YouTube Ads blockieren | ✅ | ✅ | ❌ |
| Cookie-Banner integriert | ✅ | ⚠️ Extra-Liste | ❌ |
| Manifest V3 nativ | ✅ | ❌ (nur Lite) | ✅ |
| Keine externen Filter-Server | ✅ | ❌ | ❌ |
| GitHub Pages Webseite | ✅ | ❌ | ❌ |

---

## 🏗️ Projektstruktur

```
ShieldBlock/
├── 📄 index.html                      # GitHub Pages Landing Page
├── 🎨 styles.css                      # Landing Page Design
├── 📜 README.md                       # Diese Datei
├── ⚖️ LICENSE                         # Nutzungslizenz
│
└── 📁 extension/
    ├── 📁 chromium/                    # Chrome / Brave / Vivaldi
    │   ├── manifest.json
    │   ├── background.js              # Service Worker
    │   ├── 📁 popup/                  # Popup-UI mit Stats & Toggles
    │   ├── 📁 content/                # Content Scripts (DOM-Reinigung)
    │   ├── 📁 rules/                  # Ad/Tracker/Banner Regeln
    │   └── 📁 icons/
    │
    └── 📁 firefox/                     # Firefox (Gecko-Engine)
        ├── manifest.json               # Mit gecko-spezifischen Keys
        └── ...                         # Gleiche Struktur wie Chromium
```

---

## ⚖️ Lizenz

**ShieldBlock Custom License** – siehe [LICENSE](LICENSE)

- ✅ **Kostenlose Nutzung** für jeden erlaubt
- ✅ **Kostenlose Weitergabe** erlaubt (mit Lizenzdatei)
- ❌ **Verändern des Codes** ist NICHT erlaubt
- ❌ **Verkaufen oder kommerziell nutzen** ist NICHT erlaubt

> ⚠️ **Wichtig:** An diesem Code darf ohne die ausdrückliche Erlaubnis des Urhebers **nichts verändert werden**. Pull Requests, die bestehenden Code ändern, werden nur nach Rücksprache akzeptiert.

---

## 💜 Unterstützung

Dieses Projekt ist ein **Ein-Mann-Projekt** und wird komplett in der Freizeit entwickelt.

Wenn dir ShieldBlock gefällt und du die Weiterentwicklung unterstützen möchtest, würde ich mich sehr über eine kleine Spende freuen! Jeder Beitrag hilft, ShieldBlock besser zu machen.

> ☕ **Spendenmöglichkeiten kommen bald!** Schreib mir gerne auf GitHub, wenn du helfen möchtest.

---

<p align="center">
  <strong>Made with 🛡️ for your privacy.</strong><br>
  <sub>Version 1.0.0 · Entwickelt von einem Solo-Entwickler · ShieldBlock sammelt keine Daten. Niemals.</sub>
</p>
