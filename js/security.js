/**
 * ============================================================================
 * USHAQ UL QURAN ACADEMY - FRONTEND SECURITY & CODE PROTECTION SYSTEM
 * - Complete Console Suppression & Auto-Purge (Disables console output & logs)
 * - Right-Click Context Menu Prevention
 * - Source Inspection & Save Page Shortcut Interception (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * - Drag & Drop Protection
 * - 100% False-Positive Free: Crystal clear rendering across all Mobiles, Tablets & Desktops
 * ============================================================================
 */
(function () {
  'use strict';

  // 1. COMPLETE CONSOLE SUPPRESSION & CONTINUOUS PURGE
  try {
    const noop = function () {};
    const methods = [
      'log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
      'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog',
      'trace', 'table', 'clear', 'count', 'countReset', 'profile', 'profileEnd'
    ];
    if (window.console) {
      methods.forEach(function (m) {
        try {
          Object.defineProperty(window.console, m, {
            get: function () { return noop; },
            set: function () {}
          });
        } catch (e) {
          try { window.console[m] = noop; } catch (err) {}
        }
      });
    }

    // Auto-wipe console repeatedly to keep it completely blank
    setInterval(function () {
      try {
        if (window.console && typeof window.console.clear === 'function') {
          window.console.clear();
        }
      } catch (e) {}
    }, 500);
  } catch (e) {}

  // 2. DISABLE RIGHT-CLICK CONTEXT MENU
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, { capture: true });

  // 3. DISABLE SHORTCUT KEYS (F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S)
  window.addEventListener('keydown', function (e) {
    const code = e.keyCode || e.which;
    const isCtrl = e.ctrlKey || e.metaKey;

    // F12
    if (e.key === 'F12' || code === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl + Shift + (I, J, C, K)
    if (isCtrl && e.shiftKey && (code === 73 || code === 74 || code === 67 || code === 75 || e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl + U (View Source)
    if (isCtrl && (code === 85 || e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl + S (Save Page)
    if (isCtrl && (code === 83 || e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 4. PREVENT DRAG & DROP OF SENSITIVE ASSETS
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  // 5. ANTI-DEBUGGING TRAP (Traps Developer Tools execution immediately if opened)
  (function () {
    function _0xdbg() {
      function _0xp(i) {
        if (('' + i / i).length !== 1 || i === 0) {
          (function () {}).constructor('debugger')();
        } else {
          (function () {}).constructor('debugger')();
        }
        _0xp(++i);
      }
      try {
        _0xp(0);
      } catch (e) {
        setTimeout(_0xdbg, 200);
      }
    }
    setInterval(_0xdbg, 250);
  })();

  // Ensure body is never blurred under any circumstance
  if (document.body) {
    document.body.style.filter = 'none';
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) document.body.style.filter = 'none';
    });
  }

})();
