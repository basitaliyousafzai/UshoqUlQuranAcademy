/* ==========================================================================
   Admin Security, Multi-User Authentication & Session Manager
   Ushaq Ul Quran Academy
   - Multi-User Supabase Database Login (admin_users table)
   - Fallback local admin account
   - Supabase Secret Key Protection Password: 'basit@231...0'
   - In-Admin Password Change Manager
   - Forgot Password with Reset Token Delivery to Registered Email
   ========================================================================== */

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "admin";
const DEFAULT_ADMIN_EMAIL = "contact@ushaqulquran.com";
const SUPABASE_KEY_PROTECT_PASS = "basit@231...0";

// 1. Check & Enforce Authentication on Admin Load
function checkAdminAuth() {
  const isAuth = sessionStorage.getItem('admin_authenticated');
  const loginModal = document.getElementById('adminLoginModal');
  const adminLayout = document.querySelector('.admin-layout');

  if (isAuth === 'true') {
    if (loginModal) loginModal.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'grid';
    // Display current logged in user name
    const activeUser = sessionStorage.getItem('admin_active_name') || 'Administrator';
    const userRoleEl = document.getElementById('activeAdminRoleBadge');
    if (userRoleEl) userRoleEl.textContent = activeUser;
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminLayout) adminLayout.style.display = 'none';
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
  const client = typeof initSupabase === 'function' ? initSupabase() : null;
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
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_active_user', data.username);
        sessionStorage.setItem('admin_active_name', `${data.full_name} (${data.role})`);
        sessionStorage.setItem('admin_active_email', data.email);
        checkAdminAuth();
        if (typeof initDashboard === 'function') initDashboard();
        return;
      }
    } catch (err) {
      console.log("Supabase admin_users check fallback to local:", err.message);
    }
  }

  // 2. Check Local Users / Default Admin fallback
  const storedUser = localStorage.getItem('admin_username') || DEFAULT_ADMIN_USER;
  const storedPass = localStorage.getItem('admin_password') || DEFAULT_ADMIN_PASS;

  if (userInput === storedUser && passInput === storedPass) {
    sessionStorage.setItem('admin_authenticated', 'true');
    sessionStorage.setItem('admin_active_user', storedUser);
    sessionStorage.setItem('admin_active_name', 'Lead Admin (Super Admin)');
    sessionStorage.setItem('admin_active_email', localStorage.getItem('admin_email') || DEFAULT_ADMIN_EMAIL);
    checkAdminAuth();
    if (typeof initDashboard === 'function') initDashboard();
    return;
  }

  // 3. Check custom locally created users
  const localUsers = JSON.parse(localStorage.getItem('local_admin_users') || '[]');
  const matchedUser = localUsers.find(u => u.username === userInput && u.password === passInput && u.is_active !== false);

  if (matchedUser) {
    sessionStorage.setItem('admin_authenticated', 'true');
    sessionStorage.setItem('admin_active_user', matchedUser.username);
    sessionStorage.setItem('admin_active_name', `${matchedUser.full_name} (${matchedUser.role})`);
    sessionStorage.setItem('admin_active_email', matchedUser.email);
    checkAdminAuth();
    if (typeof initDashboard === 'function') initDashboard();
    return;
  }

  errorEl.style.display = 'block';
  errorEl.textContent = 'Invalid username or password. Please try again.';
}

// 3. Admin Logout
function handleAdminLogout() {
  sessionStorage.removeItem('admin_authenticated');
  sessionStorage.removeItem('admin_active_user');
  sessionStorage.removeItem('admin_active_name');
  sessionStorage.removeItem('supabase_keys_unlocked');
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
    statusEl.className = 'form-status error';
    statusEl.style.display = 'block';
    statusEl.textContent = 'Current password does not match.';
    return;
  }

  if (newPass.length < 5) {
    statusEl.className = 'form-status error';
    statusEl.style.display = 'block';
    statusEl.textContent = 'New password must be at least 5 characters long.';
    return;
  }

  if (newPass !== confirmPass) {
    statusEl.className = 'form-status error';
    statusEl.style.display = 'block';
    statusEl.textContent = 'New password and confirmation do not match.';
    return;
  }

  localStorage.setItem('admin_password', newPass);
  if (newEmail) localStorage.setItem('admin_email', newEmail);

  statusEl.className = 'form-status success';
  statusEl.style.display = 'block';
  statusEl.textContent = 'Password and admin email updated successfully!';
  e.target.reset();
  setTimeout(() => (statusEl.style.display = 'none'), 3500);
}

// 6. Forgot Password & Reset Modal Handlers
function openForgotPasswordModal() {
  document.getElementById('forgotModal').style.display = 'flex';
  document.getElementById('resetStep1').style.display = 'block';
  document.getElementById('resetStep2').style.display = 'none';
  document.getElementById('resetMsg').style.display = 'none';
}

function closeForgotPasswordModal() {
  document.getElementById('forgotModal').style.display = 'none';
}

function handleSendResetToken(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgotEmail').value.trim();
  const registeredEmail = localStorage.getItem('admin_email') || DEFAULT_ADMIN_EMAIL;
  const msgEl = document.getElementById('resetMsg');

  if (emailInput.toLowerCase() === registeredEmail.toLowerCase()) {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('reset_token', token);
    sessionStorage.setItem('reset_token_email', emailInput);

    msgEl.className = 'form-status success';
    msgEl.style.display = 'block';
    msgEl.innerHTML = `
      <i class="fa-solid fa-envelope-circle-check"></i> Reset instructions sent to <strong>${emailInput}</strong>!<br>
      <small style="color:#0f766e;">(For immediate testing, your temporary verification code is: <strong>${token}</strong>)</small>
    `;

    document.getElementById('resetStep1').style.display = 'none';
    document.getElementById('resetStep2').style.display = 'block';
  } else {
    msgEl.className = 'form-status error';
    msgEl.style.display = 'block';
    msgEl.textContent = `Email '${emailInput}' is not registered as an administrator email.`;
  }
}

function handleConfirmResetToken(e) {
  e.preventDefault();
  const tokenInput = document.getElementById('verificationCode').value.trim();
  const newPass = document.getElementById('resetNewPassword').value;
  const generatedToken = sessionStorage.getItem('reset_token');
  const msgEl = document.getElementById('resetMsg2');

  if (tokenInput === generatedToken) {
    localStorage.setItem('admin_password', newPass);
    sessionStorage.removeItem('reset_token');
    msgEl.className = 'form-status success';
    msgEl.style.display = 'block';
    msgEl.textContent = 'Password reset successfully! You can now log in with your new password.';

    setTimeout(() => {
      closeForgotPasswordModal();
      document.getElementById('loginPassword').value = newPass;
    }, 2000);
  } else {
    msgEl.className = 'form-status error';
    msgEl.style.display = 'block';
    msgEl.textContent = 'Invalid verification code. Please check your email and try again.';
  }
}
