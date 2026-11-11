/* ==========================================================================
   Ushoq Ul Quran Academy - Admin Management Script
   Handles Supabase CRUD for:
   - Trial Requests & Admissions
   - Dynamic Courses & Images Management (NEW!)
   - Multi-User Admin Management (NEW!)
   - Tutor profiles & photos
   - Student & Child showcase achievements
   - Website dynamic text & Social Media Links
   - Supabase file upload to storage bucket
   ========================================================================== */

// Preloader dismissal for Admin Portal
function hideAdminPreloader() {
  const preloader = document.getElementById('pagePreloader');
  if (preloader && !preloader.classList.contains('fade-out')) {
    preloader.classList.add('fade-out');
    setTimeout(() => {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 600);
  }
}
if (document.readyState === 'complete') {
  hideAdminPreloader();
} else {
  window.addEventListener('load', hideAdminPreloader);
  setTimeout(hideAdminPreloader, 1000);
}

let activeTab = 'trialsTab';

document.addEventListener('DOMContentLoaded', async () => {
  loadConfigInputs();
  checkConnectionBanner();
  await initDashboard();
});

function loadConfigInputs() {
  const config = getSupabaseConfig();
  if (config.url) {
    document.getElementById('configUrl').value = config.url;
    document.getElementById('configKey').value = config.anonKey;
  }
}

function checkConnectionBanner() {
  const config = getSupabaseConfig();
  const banner = document.getElementById('connectionBanner');
  const bannerText = document.getElementById('connectionBannerText');
  if (config.url) {
    banner.style.background = '#f0fdf4';
    banner.style.borderLeftColor = '#22c55e';
    banner.style.color = '#15803d';
    bannerText.innerHTML = `<strong>Connected:</strong> Live link active with Supabase project (<code>${config.url.split('//')[1]?.split('.')[0] || 'active'}</code>)`;
  }
}

async function initDashboard() {
  await fetchTrialRequests();
  await fetchCourses();
  await fetchAdminUsers();
  await fetchTutors();
  await fetchStudents();
  await fetchSiteSettings();
}

function switchTab(tabId, el) {
  activeTab = tabId;
  document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
  if (el) el.classList.add('active');
}

/* ==========================================================================
   1. TRIAL REQUESTS MANAGEMENT
   ========================================================================== */
async function fetchTrialRequests() {
  const tbody = document.getElementById('trialsTableBody');
  const client = initSupabase();

  if (!client) {
    renderLocalTrials();
    return;
  }

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>`;

  try {
    const { data, error } = await client
      .from('trial_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No trial requests submitted yet.</td></tr>`;
      document.getElementById('trialsCountBadge').textContent = '0';
      return;
    }

    document.getElementById('trialsCountBadge').textContent = data.length;
    tbody.innerHTML = data.map(req => `
      <tr>
        <td style="white-space:nowrap; font-size:12px; color:#64748b;">
          ${new Date(req.created_at).toLocaleDateString()} ${new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </td>
        <td>
          <strong>${escapeHtml(req.student_name)}</strong>
          ${req.student_age ? `<span style="font-size:11px; color:#64748b;"> (${req.student_age} yrs, ${req.gender || 'N/A'})</span>` : ''}
          ${req.guardian_name ? `<br><small style="color:#64748b;">Guardian: ${escapeHtml(req.guardian_name)}</small>` : ''}
        </td>
        <td>
          <a href="https://wa.me/${cleanPhone(req.phone_whatsapp)}" target="_blank" style="color:#16a34a; font-weight:600;">
            <i class="fa-brands fa-whatsapp"></i> ${escapeHtml(req.phone_whatsapp)}
          </a>
          <br><small style="color:#64748b;"><i class="fa-regular fa-envelope"></i> ${escapeHtml(req.email)}</small>
        </td>
        <td>
          <span style="font-weight:600; color:var(--primary);">${escapeHtml(req.course)}</span>
          <br><small style="color:#64748b;">${escapeHtml(req.plan || 'Standard')}</small>
        </td>
        <td>
          <small><i class="fa-solid fa-clock"></i> ${escapeHtml(req.preferred_time || 'Evening')}</small>
          <br><small><i class="fa-solid fa-user-check"></i> ${escapeHtml(req.tutor_preference || 'Any')}</small>
        </td>
        <td>
          <select onchange="updateTrialStatus('${req.id}', this.value)" style="padding:4px 8px; font-size:12px; border-radius:4px; font-weight:600;">
            <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="contacted" ${req.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="trial_scheduled" ${req.status === 'trial_scheduled' ? 'selected' : ''}>Trial Scheduled</option>
            <option value="enrolled" ${req.status === 'enrolled' ? 'selected' : ''}>Enrolled</option>
            <option value="cancelled" ${req.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <a href="https://wa.me/${cleanPhone(req.phone_whatsapp)}?text=${encodeURIComponent(`Assalam-o-Alaikum ${req.student_name}, this is Ushoq Ul Quran Academy regarding your trial request for ${req.course}.`)}" target="_blank" class="btn btn-whatsapp btn-sm" title="Message on WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button onclick="deleteTrialRequest('${req.id}')", class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5;" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Error fetching trials:", err);
    renderLocalTrials();
  }
}

function renderLocalTrials() {
  const local = JSON.parse(localStorage.getItem('local_trials') || '[]');
  const tbody = document.getElementById('trialsTableBody');
  document.getElementById('trialsCountBadge').textContent = local.length;
  if (local.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No trial requests yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = local.map((req, i) => `
    <tr>
      <td>${new Date(req.created_at || Date.now()).toLocaleDateString()}</td>
      <td><strong>${escapeHtml(req.student_name)}</strong></td>
      <td><a href="https://wa.me/${cleanPhone(req.phone_whatsapp)}" target="_blank" style="color:#16a34a;"><i class="fa-brands fa-whatsapp"></i> ${escapeHtml(req.phone_whatsapp)}</a></td>
      <td><strong>${escapeHtml(req.course)}</strong></td>
      <td>${escapeHtml(req.tutor_preference || 'Any')}</td>
      <td><span class="status-badge status-pending">${req.status || 'pending'}</span></td>
      <td>
        <button onclick="deleteLocalTrial(${i})" class="btn btn-outline btn-sm" style="color:#dc2626;"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function updateTrialStatus(id, newStatus) {
  const client = initSupabase();
  if (!client) return;
  try {
    const { error } = await client.from('trial_requests').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error updating status: " + error.message);
  } catch (e) {
    console.error(e);
  }
}

async function deleteTrialRequest(id) {
  if (!confirm("Are you sure you want to delete this trial request?")) return;
  const client = initSupabase();
  if (client) {
    await client.from('trial_requests').delete().eq('id', id);
    fetchTrialRequests();
  }
}

function deleteLocalTrial(index) {
  const local = JSON.parse(localStorage.getItem('local_trials') || '[]');
  local.splice(index, 1);
  localStorage.setItem('local_trials', JSON.stringify(local));
  renderLocalTrials();
}

/* ==========================================================================
   2. DYNAMIC COURSES MANAGEMENT (NEW!)
   ========================================================================== */
async function fetchCourses() {
  const container = document.getElementById('coursesContainer');
  const client = initSupabase();

  if (!client) {
    renderFallbackCourses();
    return;
  }

  try {
    const { data, error } = await client.from('courses').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      renderFallbackCourses();
      return;
    }
    renderCoursesList(data);
    localStorage.setItem('local_courses', JSON.stringify(data));
  } catch (err) {
    console.warn("Using fallback courses:", err.message);
    renderFallbackCourses();
  }
}

function renderCoursesList(courses) {
  const container = document.getElementById('coursesContainer');
  container.innerHTML = courses.map(c => `
    <div class="manage-item-card">
      <img src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.title)}" onerror="this.src='https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300';" />
      <div class="manage-item-body">
        <h4>${escapeHtml(c.title)} <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:#fef3c7; color:#b45309;">${escapeHtml(c.badge || 'Course')}</span></h4>
        <p style="font-weight:600; color:var(--accent);">${escapeHtml(c.duration || '30 Min')} • ${escapeHtml(c.target_audience || 'All Ages')}</p>
        <p style="margin:4px 0 6px;">${escapeHtml(c.description).substring(0, 80)}...</p>
        <div class="action-btn-group">
          <button class="btn btn-outline btn-sm" onclick="editCourse(${JSON.stringify(c).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5;" onclick="deleteCourse('${c.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFallbackCourses() {
  const local = JSON.parse(localStorage.getItem('local_courses') || 'null');
  if (local && local.length > 0) {
    renderCoursesList(local);
    return;
  }
  const defaultCourses = [
    { id: 'c1', title: 'Noorani Qaida for Beginners', badge: 'Foundational', duration: '30 Min / Class', target_audience: 'All Ages', description: 'Master Arabic phonetics, correct Makharij articulation points, and letter joining rules.', highlights: ['Letter shapes & phonics', 'Harakat & Tanween'], image_url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=500' },
    { id: 'c2', title: 'Tajweed & Tarteel Mastery', badge: 'Popular', duration: '30 Min / Class', target_audience: 'Intermediate', description: 'Learn theoretical and applied rules of Tajweed including Ghunnah, Ikhfa, and Madd.', highlights: ['Tajweed regulations', 'Melodious Tarteel'], image_url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=500' },
    { id: 'c3', title: 'Quran Recitation (Nazra)', badge: 'Core', duration: '30 Min / Class', target_audience: 'All Levels', description: 'Guided fluent recitation through the entire 30 Paras of the Quran with direct supervision.', highlights: ['Continuous fluency', 'Instant corrections'], image_url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=500' }
  ];
  renderCoursesList(defaultCourses);
}

function openAddCourseModal() {
  document.getElementById('courseEditId').value = '';
  document.getElementById('courseTitle').value = '';
  document.getElementById('courseBadge').value = 'Popular';
  document.getElementById('courseDuration').value = '30 Min / Class';
  document.getElementById('courseAudience').value = 'All Ages';
  document.getElementById('courseDesc').value = '';
  document.getElementById('courseHighlights').value = '';
  document.getElementById('courseImageUrl').value = '';
  document.getElementById('courseFormTitle').textContent = 'Add New Course';
  document.getElementById('courseFormCard').style.display = 'block';
  document.getElementById('courseFormCard').scrollIntoView({ behavior: 'smooth' });
}

function editCourse(c) {
  document.getElementById('courseEditId').value = c.id;
  document.getElementById('courseTitle').value = c.title;
  document.getElementById('courseBadge').value = c.badge || 'Popular';
  document.getElementById('courseDuration').value = c.duration || '30 Min / Class';
  document.getElementById('courseAudience').value = c.target_audience || 'All Ages';
  document.getElementById('courseDesc').value = c.description;
  document.getElementById('courseHighlights').value = (c.highlights || []).join(', ');
  document.getElementById('courseImageUrl').value = c.image_url;
  document.getElementById('coursePreview').src = c.image_url;
  document.getElementById('courseFormTitle').textContent = 'Edit Course: ' + c.title;
  document.getElementById('courseFormCard').style.display = 'block';
  document.getElementById('courseFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeCourseForm() {
  document.getElementById('courseFormCard').style.display = 'none';
}

async function handleSaveCourse(e) {
  e.preventDefault();
  const id = document.getElementById('courseEditId').value;
  const title = document.getElementById('courseTitle').value.trim();
  const badge = document.getElementById('courseBadge').value.trim();
  const duration = document.getElementById('courseDuration').value.trim();
  const target_audience = document.getElementById('courseAudience').value.trim();
  const description = document.getElementById('courseDesc').value.trim();
  const highlightsStr = document.getElementById('courseHighlights').value;
  const highlights = highlightsStr.split(',').map(s => s.trim()).filter(Boolean);
  const image_url = document.getElementById('courseImageUrl').value.trim() || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600';

  const payload = { title, badge, duration, target_audience, description, highlights, image_url, is_active: true };

  const client = initSupabase();
  if (client) {
    if (id && !id.startsWith('c')) {
      const { error } = await client.from('courses').update(payload).eq('id', id);
      if (error) alert("Error updating course: " + error.message);
    } else {
      const { error } = await client.from('courses').insert([payload]);
      if (error) alert("Error adding course: " + error.message);
    }
  } else {
    // Local fallback
    const local = JSON.parse(localStorage.getItem('local_courses') || '[]');
    if (id) {
      const idx = local.findIndex(c => c.id === id);
      if (idx !== -1) local[idx] = { ...payload, id };
    } else {
      local.push({ ...payload, id: 'c_' + Date.now() });
    }
    localStorage.setItem('local_courses', JSON.stringify(local));
  }

  closeCourseForm();
  await fetchCourses();
}

async function deleteCourse(id) {
  if (!confirm("Are you sure you want to delete this course from the website?")) return;
  const client = initSupabase();
  if (client) {
    await client.from('courses').delete().eq('id', id);
    fetchCourses();
  } else {
    const local = JSON.parse(localStorage.getItem('local_courses') || '[]');
    const filtered = local.filter(c => c.id !== id);
    localStorage.setItem('local_courses', JSON.stringify(filtered));
    fetchCourses();
  }
}

/* ==========================================================================
   3. MULTI-USER ADMIN MANAGEMENT (NEW!)
   ========================================================================== */
async function fetchAdminUsers() {
  const container = document.getElementById('usersContainer');
  const client = initSupabase();

  if (!client) {
    renderLocalAdminUsers();
    return;
  }

  try {
    const { data, error } = await client.from('admin_users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) {
      renderLocalAdminUsers();
      return;
    }
    renderUsersList(data);
    localStorage.setItem('local_admin_users', JSON.stringify(data));
  } catch (err) {
    renderLocalAdminUsers();
  }
}

function renderUsersList(users) {
  const container = document.getElementById('usersContainer');
  container.innerHTML = users.map(u => `
    <div class="manage-item-card">
      <div style="width:50px; height:50px; border-radius:50%; background:var(--primary); color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; flex-shrink:0;">
        ${(u.full_name || u.username).charAt(0).toUpperCase()}
      </div>
      <div class="manage-item-body">
        <h4>${escapeHtml(u.full_name)} <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:#e0f2fe; color:#0369a1;">${escapeHtml(u.role || 'Admin')}</span></h4>
        <p style="font-weight:600; color:#334155;"><i class="fa-solid fa-user"></i> Username: <code>${escapeHtml(u.username)}</code></p>
        <p><i class="fa-regular fa-envelope"></i> ${escapeHtml(u.email)}</p>
        <div class="action-btn-group">
          <button class="btn btn-outline btn-sm" onclick="editAdminUser(${JSON.stringify(u).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          ${u.username !== 'admin' ? `
            <button class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5;" onclick="deleteAdminUser('${u.id}', '${u.username}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function renderLocalAdminUsers() {
  const local = JSON.parse(localStorage.getItem('local_admin_users') || 'null');
  if (local && local.length > 0) {
    renderUsersList(local);
    return;
  }
  const defaultList = [
    { id: '1', username: 'admin', full_name: 'Lead Academic Director', email: 'contact@ushoqulquran.com', role: 'Super Admin', is_active: true }
  ];
  renderUsersList(defaultList);
}

function openAddUserModal() {
  document.getElementById('userEditId').value = '';
  document.getElementById('newAdminUsername').value = '';
  document.getElementById('newAdminPassword').value = '';
  document.getElementById('newAdminFullName').value = '';
  document.getElementById('newAdminEmail').value = '';
  document.getElementById('newAdminRole').value = 'Admin';
  document.getElementById('userFormTitle').textContent = 'Add New Admin User';
  document.getElementById('userFormCard').style.display = 'block';
  document.getElementById('userFormCard').scrollIntoView({ behavior: 'smooth' });
}

function editAdminUser(u) {
  document.getElementById('userEditId').value = u.id;
  document.getElementById('newAdminUsername').value = u.username;
  document.getElementById('newAdminPassword').value = u.password || '';
  document.getElementById('newAdminFullName').value = u.full_name;
  document.getElementById('newAdminEmail').value = u.email;
  document.getElementById('newAdminRole').value = u.role || 'Admin';
  document.getElementById('userFormTitle').textContent = 'Edit User: ' + u.username;
  document.getElementById('userFormCard').style.display = 'block';
  document.getElementById('userFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeUserForm() {
  document.getElementById('userFormCard').style.display = 'none';
}

async function handleSaveAdminUser(e) {
  e.preventDefault();
  const id = document.getElementById('userEditId').value;
  const username = document.getElementById('newAdminUsername').value.trim();
  const password = document.getElementById('newAdminPassword').value;
  const full_name = document.getElementById('newAdminFullName').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const role = document.getElementById('newAdminRole').value;

  const payload = { username, password, full_name, email, role, is_active: true };

  const client = initSupabase();
  if (client) {
    if (id && !id.startsWith('u')) {
      const { error } = await client.from('admin_users').update(payload).eq('id', id);
      if (error) alert("Error updating user: " + error.message);
    } else {
      const { error } = await client.from('admin_users').insert([payload]);
      if (error) alert("Error creating user: " + error.message);
    }
  } else {
    const local = JSON.parse(localStorage.getItem('local_admin_users') || '[]');
    if (id) {
      const idx = local.findIndex(u => u.id === id);
      if (idx !== -1) local[idx] = { ...payload, id };
    } else {
      local.push({ ...payload, id: 'u_' + Date.now() });
    }
    localStorage.setItem('local_admin_users', JSON.stringify(local));
  }

  closeUserForm();
  await fetchAdminUsers();
}

async function deleteAdminUser(id, username) {
  if (username === 'admin') {
    alert("The primary super admin user cannot be removed.");
    return;
  }
  if (!confirm(`Are you sure you want to remove user '${username}'?`)) return;

  const client = initSupabase();
  if (client) {
    await client.from('admin_users').delete().eq('id', id);
    fetchAdminUsers();
  } else {
    const local = JSON.parse(localStorage.getItem('local_admin_users') || '[]');
    const filtered = local.filter(u => u.id !== id && u.username !== username);
    localStorage.setItem('local_admin_users', JSON.stringify(filtered));
    fetchAdminUsers();
  }
}

/* ==========================================================================
   4. TUTORS MANAGEMENT
   ========================================================================== */
async function fetchTutors() {
  const client = initSupabase();
  if (!client) {
    renderFallbackTutors();
    return;
  }

  try {
    const { data, error } = await client.from('tutors').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      renderFallbackTutors();
      return;
    }
    renderTutorsList(data);
  } catch (err) {
    renderFallbackTutors();
  }
}

function renderTutorsList(tutors) {
  const container = document.getElementById('tutorsContainer');
  container.innerHTML = tutors.map(t => `
    <div class="manage-item-card">
      <img src="${escapeHtml(t.image_url)}" alt="${escapeHtml(t.name)}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';" />
      <div class="manage-item-body">
        <h4>${escapeHtml(t.name)} <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:#e0f2fe; color:#0369a1;">${t.gender}</span></h4>
        <p style="font-weight:600; color:var(--accent);">${escapeHtml(t.role_title)}</p>
        <p style="margin:4px 0 6px;">${escapeHtml(t.bio).substring(0, 70)}...</p>
        <div class="action-btn-group">
          <button class="btn btn-outline btn-sm" onclick="editTutor(${JSON.stringify(t).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5;" onclick="deleteTutor('${t.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFallbackTutors() {
  const fallback = [
    { id: '1', name: 'Sheikh Bilal Ahmed', gender: 'male', role_title: 'Senior Tajweed Specialist', bio: 'Al-Azhar Certified, 9+ years experience.', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
    { id: '2', name: 'Ustadha Fatima Al-Zahra', gender: 'female', role_title: 'Lead Female Instructor', bio: 'Masters in Islamic Studies (Wifaq-ul-Madaris).', image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300' },
    { id: '3', name: 'Qari Muhammad Usman', gender: 'male', role_title: 'Head of Quran Memorization', bio: '12+ years experience with 120+ Huffaz.', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300' }
  ];
  renderTutorsList(fallback);
}

function openAddTutorModal() {
  document.getElementById('tutorEditId').value = '';
  document.getElementById('tutorName').value = '';
  document.getElementById('tutorRole').value = '';
  document.getElementById('tutorBio').value = '';
  document.getElementById('tutorTags').value = '';
  document.getElementById('tutorImageUrl').value = '';
  document.getElementById('tutorFormTitle').textContent = 'Add New Tutor';
  document.getElementById('tutorFormCard').style.display = 'block';
  document.getElementById('tutorFormCard').scrollIntoView({ behavior: 'smooth' });
}

function editTutor(t) {
  document.getElementById('tutorEditId').value = t.id;
  document.getElementById('tutorName').value = t.name;
  document.getElementById('tutorGender').value = t.gender;
  document.getElementById('tutorRole').value = t.role_title;
  document.getElementById('tutorBio').value = t.bio;
  document.getElementById('tutorTags').value = (t.tags || []).join(', ');
  document.getElementById('tutorImageUrl').value = t.image_url;
  document.getElementById('tutorPreview').src = t.image_url;
  document.getElementById('tutorAvailable').checked = t.is_available ?? true;
  document.getElementById('tutorFormTitle').textContent = 'Edit Tutor: ' + t.name;
  document.getElementById('tutorFormCard').style.display = 'block';
  document.getElementById('tutorFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeTutorForm() {
  document.getElementById('tutorFormCard').style.display = 'none';
}

async function handleSaveTutor(e) {
  e.preventDefault();
  const id = document.getElementById('tutorEditId').value;
  const name = document.getElementById('tutorName').value;
  const gender = document.getElementById('tutorGender').value;
  const role_title = document.getElementById('tutorRole').value;
  const bio = document.getElementById('tutorBio').value;
  const tagsStr = document.getElementById('tutorTags').value;
  const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
  const image_url = document.getElementById('tutorImageUrl').value || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300';
  const is_available = document.getElementById('tutorAvailable').checked;

  const client = initSupabase();
  const payload = { name, gender, role_title, bio, tags, image_url, is_available };

  if (client) {
    if (id) {
      const { error } = await client.from('tutors').update(payload).eq('id', id);
      if (error) alert("Error updating tutor: " + error.message);
    } else {
      const { error } = await client.from('tutors').insert([payload]);
      if (error) alert("Error creating tutor: " + error.message);
    }
  }

  closeTutorForm();
  await fetchTutors();
}

async function deleteTutor(id) {
  if (!confirm("Are you sure you want to delete this tutor?")) return;
  const client = initSupabase();
  if (client) {
    await client.from('tutors').delete().eq('id', id);
    fetchTutors();
  }
}

/* ==========================================================================
   5. CHILDREN / STUDENT SHOWCASE MANAGEMENT
   ========================================================================== */
async function fetchStudents() {
  const client = initSupabase();
  if (!client) {
    renderFallbackStudents();
    return;
  }

  try {
    const { data, error } = await client.from('student_showcase').select('*').order('display_order', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      renderFallbackStudents();
      return;
    }
    renderStudentsList(data);
  } catch (err) {
    renderFallbackStudents();
  }
}

function renderStudentsList(students) {
  const container = document.getElementById('studentsContainer');
  container.innerHTML = students.map(s => `
    <div class="manage-item-card">
      <img src="${escapeHtml(s.image_url)}" alt="${escapeHtml(s.student_name)}" onerror="this.src='https://images.unsplash.com/photo-1543269865-cbf427effbad?w=200';" />
      <div class="manage-item-body">
        <h4>${escapeHtml(s.student_name)} <span style="font-size:11px; color:#64748b;">(${s.age ? s.age + ' yrs' : ''} ${s.country ? '• ' + s.country : ''})</span></h4>
        <p style="font-weight:600; color:#15803d;"><i class="fa-solid fa-award"></i> ${escapeHtml(s.course_or_achievement)}</p>
        <p style="margin:4px 0 6px;">${escapeHtml(s.story || '')}</p>
        <div class="action-btn-group">
          <button class="btn btn-outline btn-sm" onclick="editStudent(${JSON.stringify(s).replace(/"/g, '&quot;')})">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#fca5a5;" onclick="deleteStudent('${s.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFallbackStudents() {
  const fallback = [
    { id: '1', student_name: 'Zayd & Safiya', age: 7, country: 'London, UK', course_or_achievement: 'Completed Noorani Qaida in 3 Months', story: 'Reading Surah Al-Mulk fluently with applied Tajweed.', image_url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300' },
    { id: '2', student_name: 'Hamza Farooq', age: 10, country: 'Manchester, UK', course_or_achievement: 'Memorized Juz Amma (Juz 30)', story: 'Completed Hifz of 37 Surahs with Ustadha Fatima.', image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300' }
  ];
  renderStudentsList(fallback);
}

function openAddStudentModal() {
  document.getElementById('studentEditId').value = '';
  document.getElementById('showcaseName').value = '';
  document.getElementById('showcaseAge').value = '';
  document.getElementById('showcaseAchievement').value = '';
  document.getElementById('showcaseCountry').value = '';
  document.getElementById('showcaseStory').value = '';
  document.getElementById('showcaseImageUrl').value = '';
  document.getElementById('studentFormTitle').textContent = 'Add Student Milestone';
  document.getElementById('studentFormCard').style.display = 'block';
  document.getElementById('studentFormCard').scrollIntoView({ behavior: 'smooth' });
}

function editStudent(s) {
  document.getElementById('studentEditId').value = s.id;
  document.getElementById('showcaseName').value = s.student_name;
  document.getElementById('showcaseAge').value = s.age || '';
  document.getElementById('showcaseAchievement').value = s.course_or_achievement;
  document.getElementById('showcaseCountry').value = s.country || '';
  document.getElementById('showcaseStory').value = s.story || '';
  document.getElementById('showcaseImageUrl').value = s.image_url;
  document.getElementById('studentPreview').src = s.image_url;
  document.getElementById('studentFormTitle').textContent = 'Edit: ' + s.student_name;
  document.getElementById('studentFormCard').style.display = 'block';
  document.getElementById('studentFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeStudentForm() {
  document.getElementById('studentFormCard').style.display = 'none';
}

async function handleSaveStudent(e) {
  e.preventDefault();
  const id = document.getElementById('studentEditId').value;
  const student_name = document.getElementById('showcaseName').value;
  const age = parseInt(document.getElementById('showcaseAge').value) || null;
  const course_or_achievement = document.getElementById('showcaseAchievement').value;
  const country = document.getElementById('showcaseCountry').value;
  const story = document.getElementById('showcaseStory').value;
  const image_url = document.getElementById('showcaseImageUrl').value || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=300';

  const client = initSupabase();
  const payload = { student_name, age, course_or_achievement, country, story, image_url };

  if (client) {
    if (id) {
      const { error } = await client.from('student_showcase').update(payload).eq('id', id);
      if (error) alert("Error: " + error.message);
    } else {
      const { error } = await client.from('student_showcase').insert([payload]);
      if (error) alert("Error: " + error.message);
    }
  }

  closeStudentForm();
  await fetchStudents();
}

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to remove this showcase item?")) return;
  const client = initSupabase();
  if (client) {
    await client.from('student_showcase').delete().eq('id', id);
    fetchStudents();
  }
}

/* ==========================================================================
   6. SITE TEXT & SOCIAL MEDIA LINKS SETTINGS
   ========================================================================== */
async function fetchSiteSettings() {
  const client = initSupabase();
  if (!client) {
    loadLocalSettings();
    return;
  }
  try {
    const { data } = await client.from('site_settings').select('*');
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.id === 'uk_phone') document.getElementById('settingUkPhone').value = item.value;
        if (item.id === 'pk_phone') document.getElementById('settingPkPhone').value = item.value;
        if (item.id === 'email') document.getElementById('settingEmail').value = item.value;
        if (item.id === 'announcement') document.getElementById('settingAnnouncement').value = item.value;
        if (item.id === 'facebook_url') document.getElementById('settingFacebook').value = item.value;
        if (item.id === 'youtube_url') document.getElementById('settingYoutube').value = item.value;
        if (item.id === 'instagram_url') document.getElementById('settingInstagram').value = item.value;
        if (item.id === 'tiktok_url') document.getElementById('settingTiktok').value = item.value;
        if (item.id === 'linkedin_url') document.getElementById('settingLinkedin').value = item.value;
      });
    } else {
      loadLocalSettings();
    }
  } catch (e) {
    loadLocalSettings();
  }
}

function loadLocalSettings() {
  document.getElementById('settingUkPhone').value = localStorage.getItem('setting_uk_phone') || '+44 7400 123456';
  document.getElementById('settingPkPhone').value = localStorage.getItem('setting_pk_phone') || '+92 300 1234567';
  document.getElementById('settingEmail').value = localStorage.getItem('setting_email') || 'contact@ushoqulquran.com';
  document.getElementById('settingAnnouncement').value = localStorage.getItem('setting_announcement') || '3-Day Free Trial Available • Zero Registration Fee • 1-on-1 Classes';
  document.getElementById('settingFacebook').value = localStorage.getItem('setting_facebook') || '';
  document.getElementById('settingYoutube').value = localStorage.getItem('setting_youtube') || '';
  document.getElementById('settingInstagram').value = localStorage.getItem('setting_instagram') || '';
  document.getElementById('settingTiktok').value = localStorage.getItem('setting_tiktok') || '';
  document.getElementById('settingLinkedin').value = localStorage.getItem('setting_linkedin') || '';
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const uk_phone = document.getElementById('settingUkPhone').value;
  const pk_phone = document.getElementById('settingPkPhone').value;
  const email = document.getElementById('settingEmail').value;
  const announcement = document.getElementById('settingAnnouncement').value;
  const facebook_url = document.getElementById('settingFacebook').value;
  const youtube_url = document.getElementById('settingYoutube').value;
  const instagram_url = document.getElementById('settingInstagram').value;
  const tiktok_url = document.getElementById('settingTiktok').value;
  const linkedin_url = document.getElementById('settingLinkedin').value;

  localStorage.setItem('setting_uk_phone', uk_phone);
  localStorage.setItem('setting_pk_phone', pk_phone);
  localStorage.setItem('setting_email', email);
  localStorage.setItem('setting_announcement', announcement);
  localStorage.setItem('setting_facebook', facebook_url);
  localStorage.setItem('setting_youtube', youtube_url);
  localStorage.setItem('setting_instagram', instagram_url);
  localStorage.setItem('setting_tiktok', tiktok_url);
  localStorage.setItem('setting_linkedin', linkedin_url);

  const client = initSupabase();
  if (client) {
    await client.from('site_settings').upsert([
      { id: 'uk_phone', key_label: 'UK Phone', value: uk_phone },
      { id: 'pk_phone', key_label: 'PK Phone', value: pk_phone },
      { id: 'email', key_label: 'Email', value: email },
      { id: 'announcement', key_label: 'Announcement', value: announcement },
      { id: 'facebook_url', key_label: 'Facebook', value: facebook_url },
      { id: 'youtube_url', key_label: 'YouTube', value: youtube_url },
      { id: 'instagram_url', key_label: 'Instagram', value: instagram_url },
      { id: 'tiktok_url', key_label: 'TikTok', value: tiktok_url },
      { id: 'linkedin_url', key_label: 'LinkedIn', value: linkedin_url }
    ]);
  }

  const status = document.getElementById('settingsSaveStatus');
  status.style.display = 'inline-block';
  setTimeout(() => status.style.display = 'none', 2500);
}

/* ==========================================================================
   7. SUPABASE STORAGE (IMAGE FILE UPLOAD)
   ========================================================================== */
async function uploadImageFile(fileInput, targetUrlInputId, previewImgId) {
  const file = fileInput.files[0];
  if (!file) return;

  const client = initSupabase();
  if (!client) {
    alert("Supabase connection required. You can paste an image URL in the meantime.");
    return;
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

  try {
    const { data, error } = await client.storage.from('academy-images').upload(fileName, file);
    if (error) {
      alert("Storage upload error: " + error.message);
      return;
    }

    const { data: publicData } = client.storage.from('academy-images').getPublicUrl(fileName);
    if (publicData?.publicUrl) {
      document.getElementById(targetUrlInputId).value = publicData.publicUrl;
      document.getElementById(previewImgId).src = publicData.publicUrl;
    }
  } catch (e) {
    alert("Upload failed: " + e.message);
  }
}

function updateImagePreview(inputId, imgId) {
  const url = document.getElementById(inputId).value;
  if (url) document.getElementById(imgId).src = url;
}

function cleanPhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
