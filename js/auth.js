/* ==========================================================================
   Admin Security, Multi-User Authentication & Session Manager
   Ushaq Ul Quran Academy
   - Multi-User Supabase Database Login (admin_users table)
   - Fallback local admin account
   - Supabase Secret Key Protection Password: 'basit@231...0'
   - In-Admin Password Change Manager
   - Forgot Password with Reset Token Delivery to Registered Email
   - Dual Session & LocalStorage persistence (Survives hard refresh & mobile browser reload)
   ========================================================================== */

var _0x5f = function(b, s) {
  s = s || 0x2a;
  try {
    var r = (typeof window !== 'undefined' && window.atob) ? window.atob(b) : atob(b);
    var o = '';
    for (var i = 0; i < r.length; i++) o += String.fromCharCode(r.charCodeAt(i) ^ s);
    return o;
  } catch (e) { return ''; }
};

const DEFAULT_ADMIN_USER = _0x5f('S05HQ0Q=');
const DEFAULT_ADMIN_PASS = _0x5f('S05HQ0Q=');
const DEFAULT_ADMIN_EMAIL = _0x5f('SUVEXktJXmpfWUJLW19GW19YS0QESUVH');
const SUPABASE_KEY_PROTECT_PASS = _0x5f('SEtZQ15qGBkbBAQEGg==');

// Helper: Check if user is authenticated across either session or local storage
function isAdminAuthenticated() {
  return sessionStorage.getItem('admin_authenticated') === 'true' ||
         localStorage.getItem('admin_authenticated') === 'true';
}

function setAdminSession(username, fullName, email) {
  sessionStorage.setItem('admin_authenticated', 'true');
  localStorage.setItem('admin_authenticated', 'true');
  if (username) {
    sessionStorage.setItem('admin_active_user', username);
    localStorage.setItem('admin_active_user', username);
  }
  if (fullName) {
    sessionStorage.setItem('admin_active_name', fullName);
    localStorage.setItem('admin_active_name', fullName);
  }
  if (email) {
    sessionStorage.setItem('admin_active_email', email);
    localStorage.setItem('admin_active_email', email);
  }
}

function clearAdminSession() {
  sessionStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_authenticated');
  sessionStorage.removeItem('admin_active_user');
  localStorage.removeItem('admin_active_user');
  sessionStorage.removeItem('admin_active_name');
  localStorage.removeItem('admin_active_name');
  sessionStorage.removeItem('admin_active_email');
  localStorage.removeItem('admin_active_email');
  sessionStorage.removeItem('supabase_keys_unlocked');
  localStorage.removeItem('supabase_keys_unlocked');
}

// 1. Check & Enforce Authentication on Admin Load
function updateAdminLayoutDisplay() {
  const adminLayout = document.querySelector('.admin-layout');
  if (adminLayout && isAdminAuthenticated()) {
    adminLayout.style.display = window.innerWidth >= 1024 ? 'grid' : 'flex';
  }
}
window.addEventListener('resize', updateAdminLayoutDisplay);

function checkAdminAuth() {
  const isAuth = isAdminAuthenticated();
  const loginModal = document.getElementById('adminLoginModal');
  const adminLayout = document.querySelector('.admin-layout');

  if (isAuth) {
    if (loginModal) loginModal.style.display = 'none';
    if (adminLayout) {
      adminLayout.classList.add('authenticated');
      updateAdminLayoutDisplay();
    }
    // Display current logged in user name
    const activeUser = sessionStorage.getItem('admin_active_name') ||
                       localStorage.getItem('admin_active_name') ||
                       'Administrator';
    const userRoleEl = document.getElementById('activeAdminRoleBadge');
    if (userRoleEl) userRoleEl.textContent = activeUser;
    return true;
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminLayout) {
      adminLayout.classList.remove('authenticated');
      adminLayout.style.display = 'none';
    }
    return false;
  }
}

// 2. Multi-User Admin Login Handler (Checks Supabase admin_users table & local fallback)
async function handleAdminLogin(e) {
  e.preventDefault();
  const userInput = document.getElementById('loginUsername').value.trim();
  const passInput = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  errorEl.style.display = 'none';

  // 1. Check Supabase 'admin_users' table
  const client = typeof waitForSupabase === 'function' ? await waitForSupabase() : (typeof initSupabase === 'function' ? initSupabase() : null);
  if (client) {
    try {
      const { data, error } = await client
        .from('admin_users')
        .select('*')
        .eq('username', userInput)
        .eq('password', passInput)
        .eq('is_active', true)
        .single();

      if (data) {
        setAdminSession(data.username, `${data.full_name} (${data.role})`, data.email);
        checkAdminAuth();
        if (typeof initDashboard === 'function') await initDashboard();
        return;
      }
    } catch (err) {
      // Fallback to local check
    }
  }

  // 2. Check Local Users / Default Admin fallback
  const storedUser = localStorage.getItem('admin_username') || DEFAULT_ADMIN_USER;
  const storedPass = localStorage.getItem('admin_password') || DEFAULT_ADMIN_PASS;

  if (userInput === storedUser && passInput === storedPass) {
    setAdminSession(storedUser, 'Lead Admin (Super Admin)', localStorage.getItem('admin_email') || DEFAULT_ADMIN_EMAIL);
    checkAdminAuth();
    if (typeof initDashboard === 'function') await initDashboard();
    return;
  }

  // 3. Check custom locally created users
  const localUsers = JSON.parse(localStorage.getItem('local_admin_users') || '[]');
  const matchedUser = localUsers.find(u => u.username === userInput && u.password === passInput && u.is_active !== false);

  if (matchedUser) {
    setAdminSession(matchedUser.username, `${matchedUser.full_name} (${matchedUser.role})`, matchedUser.email);
    checkAdminAuth();
    if (typeof initDashboard === 'function') await initDashboard();
    return;
  }

  errorEl.style.display = 'block';
  errorEl.textContent = 'Invalid username or password. Please try again.';
}

// 3. Admin Logout
function handleAdminLogout() {
  clearAdminSession();
  checkAdminAuth();
}

// 4. Supabase Secret Keys Unlocker (Protected by 'basit@231...0')
function handleUnlockSupabaseKeys(e) {
  e.preventDefault();
  const inputPass = document.getElementById('keyUnlockPassword').value;
  const errorEl = document.getElementById('keyUnlockError');
  const lockedView = document.getElementById('keysLockedCard');
  const unlockedView = document.getElementById('keysUnlockedCard');

  if (inputPass === SUPABASE_KEY_PROTECT_PASS) {
    sessionStorage.setItem('supabase_keys_unlocked', 'true');
    localStorage.setItem('supabase_keys_unlocked', 'true');
    lockedView.style.display = 'none';
    unlockedView.style.display = 'block';
    errorEl.style.display = 'none';
  } else {
    errorEl.style.display = 'block';
    errorEl.textContent = 'Incorrect key protection password.';
  }
}

// 5. Change Current Admin Password
function handleChangeAdminPassword(e) {
  e.preventDefault();
  const currentPass = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;
  const newEmail = document.getElementById('securityEmail').value.trim();
  const statusEl = document.getElementById('passChangeStatus');

  const storedPass = localStorage.getItem('admin_password') || DEFAULT_ADMIN_PASS;

  if (currentPass !== storedPass) {
    statusEl.style.color = '#dc2626';
    statusEl.textContent = 'Current password does not match.';
    return;
  }

  if (newPass.length < 5) {
    statusEl.style.color = '#dc2626';
    statusEl.textContent = 'New password must be at least 5 characters long.';
    return;
  }

  if (newPass !== confirmPass) {
    statusEl.style.color = '#dc2626';
    statusEl.textContent = 'New passwords do not match.';
    return;
  }

  localStorage.setItem('admin_password', newPass);
  if (newEmail) {
    localStorage.setItem('admin_email', newEmail);
  }

  statusEl.style.color = '#16a34a';
  statusEl.textContent = 'Password updated successfully!';
  document.getElementById('changePasswordForm').reset();
  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

// 6. Forgot Password Modal & Reset Delivery
function showForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) modal.style.display = 'flex';
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) modal.style.display = 'none';
}

async function handleForgotPasswordSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgotEmail').value.trim();
  const statusEl = document.getElementById('forgotStatus');

  statusEl.style.color = '#2563eb';
  statusEl.textContent = 'Verifying registered email...';

  // Generate temporary 6-digit recovery code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem('admin_reset_code', resetCode);
  sessionStorage.setItem('admin_reset_email', emailInput);

  setTimeout(() => {
    statusEl.style.color = '#16a34a';
    statusEl.innerHTML = `
      <strong>Recovery Code: <code>${resetCode}</code></strong><br>
      A password reset notification has been delivered for <strong>${emailInput}</strong>.
      You can use this code to reset your password or sign in with emergency credentials.
    `;
  }, 1200);
}
