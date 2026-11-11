/**
 * ============================================================================
 * USHOQ UL QURAN ACADEMY - HARDENED FRONTEND SECURITY & ANTI-DEVTOOLS SHIELD
 * - Complete Console Suppression & Auto-Purge
 * - Right-Click & Key Shortcut Interception
 * - Anti-Debugging Infinite Pause Trap (halts DevTools execution instantly)
 * - Real-time DevTools Detection & Content Lockout Shield
 * ============================================================================
 */
(function () {
  'use strict';

  // 1. SUPPRESS ALL CONSOLE METHODS
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
  } catch (e) {}

  // 2. DISABLE RIGHT-CLICK
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, { capture: true });

  // 3. DISABLE SHORTCUT KEYS (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  window.addEventListener('keydown', function (e) {
    const code = e.keyCode || e.which;
    const isCtrl = e.ctrlKey || e.metaKey;

    // F12
    if (e.key === 'F12' || code === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl + Shift + (I, J, C)
    if (isCtrl && e.shiftKey && (code === 73 || code === 74 || code === 67 || e.key === 'I' || e.key === 'J' || e.key === 'C')) {
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

  // 4. PREVENT DRAGGING & SELECTION OF CODE
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  // 5. DEVTOOLS ACTIVE LOCKOUT SHIELD & BLUR
  let shieldElement = null;

  function createShield() {
    if (document.getElementById('devtoolsSecurityShield')) return;
    shieldElement = document.createElement('div');
    shieldElement.id = 'devtoolsSecurityShield';
    shieldElement.style.cssText = [
      'position: fixed !important',
      'inset: 0 !important',
      'width: 100vw !important',
      'height: 100vh !important',
      'background: #022c22 !important',
      'color: #ffffff !important',
      'z-index: 2147483647 !important',
      'display: flex !important',
      'flex-direction: column !important',
      'align-items: center !important',
      'justify-content: center !important',
      'text-align: center !important',
      'padding: 30px !important',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
      'user-select: none !important'
    ].join(';');

    shieldElement.innerHTML = [
      '<div style="width:72px; height:72px; border-radius:50%; background:rgba(245,158,11,0.15); display:flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:0 0 30px rgba(245,158,11,0.3);">',
      '  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      '</div>',
      '<h2 style="font-size:24px; font-weight:800; color:#ffffff; margin-bottom:10px; letter-spacing:0.5px;">Developer Tools Access Disabled</h2>',
      '<p style="max-width:440px; color:#a7f3d0; font-size:14.5px; line-height:1.6; margin-bottom:20px;">Source inspection and developer console access are strictly restricted for security and academic content protection.</p>',
      '<div style="background:rgba(255,255,255,0.08); padding:10px 20px; border-radius:8px; font-size:13px; color:#fde68a;">',
      '  <strong>Action Required:</strong> Please close Developer Tools to continue viewing the website.',
      '</div>'
    ].join('');

    if (document.body) {
      document.body.appendChild(shieldElement);
    } else {
      document.documentElement.appendChild(shieldElement);
    }
  }

  function removeShield() {
    const shield = document.getElementById('devtoolsSecurityShield');
    if (shield && shield.parentNode) {
      shield.parentNode.removeChild(shield);
    }
  }

  // 6. REAL-TIME DEVTOOLS DETECTION (Dimensions + Timing + Element Check)
  let devtoolsDetected = false;
  const threshold = 160;

  function triggerDevToolsAction(isOpen) {
    if (isOpen) {
      devtoolsDetected = true;
      createShield();
    } else if (devtoolsDetected) {
      devtoolsDetected = false;
      removeShield();
    }
  }

  function detectDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    
    // Check if docked at bottom or right
    if (widthDiff || heightDiff) {
      triggerDevToolsAction(true);
      return;
    }

    // Check with timing discrepancy
    const start = performance.now();
    // debugger invocation pauses if devtools is open
    (function () {
      return false;
    }['constructor']('debugger')());
    const end = performance.now();

    if (end - start > 100) {
      triggerDevToolsAction(true);
    } else {
      if (devtoolsDetected && !widthDiff && !heightDiff) {
        triggerDevToolsAction(false);
      }
    }
  }

  // 7. HIGH-SPEED ANTI-DEBUGGER PAUSE TRAP
  // The moment ANYONE opens DevTools via Chrome menu or shortcuts,
  // the debugger halts execution continuously so they cannot navigate code.
  setInterval(function () {
    (function () {
      return false;
    }['constructor']('debugger')());
  }, 100);

  // Periodic detector check
  setInterval(detectDevTools, 500);
  window.addEventListener('resize', detectDevTools);

})();
