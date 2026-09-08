/* CalculatePilot privacy-first analytics consent.
 * Google Analytics, Ahrefs, and Microsoft Clarity load only after the visitor accepts analytics cookies.
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'calculatepilot_analytics_consent_v1';
  var GA_ID = 'G-YFZBQ0VRQS';
  var AHREFS_KEY = 'HAKNwRlvdHsSgoa1o6fIfA';
  var CLARITY_ID = 'yf5cj7b49w';

  function getConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function loadAnalytics() {
    if (window.__cpAnalyticsLoaded) return;
    window.__cpAnalyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(ga);

    var ahrefs = document.createElement('script');
    ahrefs.async = true;
    ahrefs.src = 'https://analytics.ahrefs.com/analytics.js';
    ahrefs.setAttribute('data-key', AHREFS_KEY);
    document.head.appendChild(ahrefs);

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function applyChoice(value) {
    setConsent(value);
    if (value === 'granted') loadAnalytics();
    var banner = document.getElementById('cp-consent-banner');
    if (banner) banner.remove();
    showManageButton();
  }

  function showManageButton() {
    if (document.getElementById('cp-consent-manage')) return;
    var button = document.createElement('button');
    button.id = 'cp-consent-manage';
    button.type = 'button';
    button.textContent = 'Privacy settings';
    button.setAttribute('aria-label', 'Open privacy settings');
    button.onclick = function () {
      var existing = document.getElementById('cp-consent-banner');
      if (existing) existing.remove();
      showBanner(true);
    };
    document.body.appendChild(button);
  }

  function showBanner(manageMode) {
    var old = document.getElementById('cp-consent-banner');
    if (old) old.remove();

    var banner = document.createElement('div');
    banner.id = 'cp-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Privacy and cookie preferences');
    banner.innerHTML =
      '<div class="cp-consent-inner">' +
        '<div class="cp-consent-copy">' +
          '<strong>Privacy & cookies</strong>' +
          '<p>We use optional analytics to understand how CalculatePilot is used and improve the site. Analytics are off until you choose to allow them. You can change your choice at any time.</p>' +
          '<a href="/privacy.html">Read our Privacy Policy</a>' +
        '</div>' +
        '<div class="cp-consent-actions">' +
          '<button type="button" class="cp-btn cp-btn-secondary" id="cp-reject">Reject analytics</button>' +
          '<button type="button" class="cp-btn cp-btn-primary" id="cp-accept">Allow analytics</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    document.getElementById('cp-reject').onclick = function () { applyChoice('denied'); };
    document.getElementById('cp-accept').onclick = function () { applyChoice('granted'); };

    if (!manageMode) {
      var manage = document.getElementById('cp-consent-manage');
      if (manage) manage.remove();
    }
  }

  function addStyles() {
    if (document.getElementById('cp-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'cp-consent-styles';
    style.textContent =
      '#cp-consent-banner{position:fixed;z-index:2147483647;left:0;right:0;bottom:0;background:#101827;color:#fff;box-shadow:0 -8px 30px rgba(0,0,0,.22);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
      '#cp-consent-banner *{box-sizing:border-box}' +
      '.cp-consent-inner{max-width:1180px;margin:0 auto;padding:18px 22px;display:flex;align-items:center;gap:28px}' +
      '.cp-consent-copy{flex:1;min-width:0}.cp-consent-copy strong{display:block;font-size:16px;margin-bottom:5px}.cp-consent-copy p{margin:0 0 6px;color:#d7deea;font-size:13px;line-height:1.5}.cp-consent-copy a{color:#fff;font-size:12px;text-decoration:underline}' +
      '.cp-consent-actions{display:flex;gap:10px;flex-shrink:0}.cp-btn{border:0;border-radius:8px;padding:11px 15px;font-weight:700;font-size:13px;cursor:pointer}.cp-btn-primary{background:#fff;color:#101827}.cp-btn-secondary{background:transparent;color:#fff;border:1px solid #718096}' +
      '#cp-consent-manage{position:fixed;z-index:2147483646;left:14px;bottom:14px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#101827;padding:8px 12px;font:600 12px Inter,system-ui,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.16);cursor:pointer}' +
      '@media(max-width:700px){.cp-consent-inner{display:block;padding:16px}.cp-consent-actions{margin-top:12px}.cp-btn{flex:1}.cp-consent-copy p{font-size:12px}}';
    document.head.appendChild(style);
  }

  function init() {
    addStyles();
    var consent = getConsent();
    if (consent === 'granted') {
      loadAnalytics();
      showManageButton();
    } else if (consent === 'denied') {
      showManageButton();
    } else {
      showBanner(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
