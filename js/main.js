/* ==========================================================================
   Ushaq Ul Quran Academy - Interactive Main JS with Supabase Realtime Sync
   - Page Preloader Dismissal & Icon Animations
   - Entrance Animations (Slide from Left, Right, Up, Zoom)
   - Mobile Nav Toggle
   - Currency Switcher
   - Dynamic Courses Loading & Realtime Frontend Rendering
   - Quick Trial Form (Hero) with Supabase Insert
   - Full Admission Form with Supabase Insert
   - Dynamic Sync of Tutors, Showcase, & Site Settings + ONLY-ADDED Social Media Links
   ========================================================================== */

// 0. PRELOADER HANDLER (Smooth fade with fallback)
function hidePreloader() {
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
  hidePreloader();
} else {
  window.addEventListener('load', hidePreloader);
  setTimeout(hidePreloader, 1200); // 1.2s failsafe
}

// 0.1 SCROLL ENTRANCE ANIMATIONS OBSERVER
function initScrollAnimations() {
  const animElements = document.querySelectorAll('.anim-left, .anim-right, .anim-up, .anim-zoom, .anim-fade');
  if (!animElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    animElements.forEach(el => observer.observe(el));
  } else {
    animElements.forEach(el => el.classList.add('is-visible'));
  }
}
window.initScrollAnimations = initScrollAnimations;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize animations on initial static elements
  initScrollAnimations();

  // Initialize Pure Student Images Auto-Scroll Banner in Hero
  initHeroBannerSlider();

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const spans = mobileToggle.querySelectorAll('span');
      if (navMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
      }
    });
  }

  // 2. Multi-Currency Pricing Switcher
  const currencyTabs = document.getElementById('currencyTabs');
  if (currencyTabs) {
    const buttons = currencyTabs.querySelectorAll('.curr-btn');
    const symbolMap = { usd: '$', gbp: '£', cad: 'C$', aud: 'A$', eur: '€' };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const curr = btn.getAttribute('data-curr');
        const symbol = symbolMap[curr] || '$';

        document.querySelectorAll('.curr-symbol').forEach((s) => (s.textContent = symbol));
        document.querySelectorAll('.curr-val').forEach((val) => {
          const newVal = val.getAttribute(`data-${curr}`);
          if (newVal) val.textContent = newVal;
        });
      });
    });
  }

  // 3. Pre-select Course/Plan from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const courseParam = urlParams.get('course');
  const planParam = urlParams.get('plan');

  const courseSelect = document.getElementById('admissionCourse');
  if (courseSelect && courseParam) {
    for (let i = 0; i < courseSelect.options.length; i++) {
      if (courseSelect.options[i].text.toLowerCase().includes(courseParam.toLowerCase())) {
        courseSelect.selectedIndex = i;
        break;
      }
    }
  }

  const planSelect = document.getElementById('admissionPlan');
  if (planSelect && planParam) {
    for (let i = 0; i < planSelect.options.length; i++) {
      if (planSelect.options[i].text.toLowerCase().includes(planParam.toLowerCase())) {
        planSelect.selectedIndex = i;
        break;
      }
    }
  }

  // 4. Smooth Anchor Scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 5. Load Live Settings, Courses, Tutors & ONLY-Added Social Media Links
  await loadLiveSiteContent();
});

/* ==========================================================================
   Supabase Dynamic Content, Courses, Phones & ONLY-ADDED Social Links Sync
   ========================================================================== */
async function loadLiveSiteContent() {
  const client = typeof initSupabase === 'function' ? initSupabase() : null;
  
  // 1. Sync from LocalStorage cache first (instant render)
  applyCachedSettings();

  // 2. Render cached courses immediately if available
  const cachedCourses = JSON.parse(localStorage.getItem('local_courses') || 'null');
  if (cachedCourses && cachedCourses.length > 0) {
    renderDynamicCourses(cachedCourses);
  }

  if (!client) return;

  try {
    // Sync Settings & Social Media Links from Supabase
    const { data: dbSettings } = await client.from('site_settings').select('*');
    if (dbSettings && dbSettings.length > 0) {
      dbSettings.forEach(s => {
        localStorage.setItem(`setting_${s.id}`, s.value);
      });
      applyCachedSettings();
    }

    // Sync Courses from Supabase (NEW!)
    const { data: dbCourses } = await client.from('courses').select('*').order('display_order', { ascending: true });
    if (dbCourses && dbCourses.length > 0) {
      localStorage.setItem('local_courses', JSON.stringify(dbCourses));
      renderDynamicCourses(dbCourses);
      updateAdmissionCourseDropdown(dbCourses);
    }

    // Sync Tutors from Supabase
    const { data: dbTutors } = await client.from('tutors').select('*').order('display_order', { ascending: true });
    if (dbTutors && dbTutors.length > 0) {
      renderDynamicTutors(dbTutors);
    }

    // Sync Student Showcase from Supabase
    const { data: dbShowcase } = await client.from('student_showcase').select('*').order('display_order', { ascending: true });
    if (dbShowcase && dbShowcase.length > 0) {
      renderDynamicShowcase(dbShowcase);
    }
  } catch (err) {
    console.log("Using cached/static content:", err.message);
  }
}

function applyCachedSettings() {
  // 1. Dynamic Academy Brand Name, Subtitle & Custom Logo
  const academyName = (localStorage.getItem('setting_academy_name') || 'Ushaq Ul Quran').trim();
  const academySub = (localStorage.getItem('setting_academy_sub') || 'Online Global Academy').trim();
  const academyLogo = (localStorage.getItem('setting_academy_logo_url') || '').trim();

  document.querySelectorAll('.brand-title').forEach(el => el.textContent = academyName);
  document.querySelectorAll('.brand-sub').forEach(el => el.textContent = academySub);
  document.querySelectorAll('.preloader-title').forEach(el => el.textContent = academyName);
  document.querySelectorAll('.preloader-subtitle').forEach(el => el.textContent = academySub);

  // Apply custom logo if uploaded, else default icon
  document.querySelectorAll('.logo-icon').forEach(iconEl => {
    if (academyLogo) {
      iconEl.innerHTML = `<img src="${escapeHtml(academyLogo)}" alt="${escapeHtml(academyName)}" style="width:100%; height:100%; object-fit:contain; border-radius:inherit;" />`;
    } else {
      iconEl.innerHTML = `<i class="fa-solid fa-book-quran"></i>`;
    }
  });

  const announcement = localStorage.getItem('setting_announcement');
  if (announcement) {
    const badge = document.querySelector('.top-actions .badge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-star"></i> ${announcement}`;
  }

  const ukPhone = localStorage.getItem('setting_uk_phone') || '+44 7400 123456';
  const pkPhone = localStorage.getItem('setting_pk_phone') || '+92 300 1234567';
  const email = localStorage.getItem('setting_email') || 'contact@ushaqulquran.com';

  const topInfo = document.querySelector('.top-info');
  if (topInfo) {
    topInfo.innerHTML = `
      <span><i class="fa-solid fa-phone"></i> ${escapeHtml(ukPhone)} (UK)</span>
      <span><i class="fa-brands fa-whatsapp"></i> ${escapeHtml(pkPhone)} (PK)</span>
      <span><i class="fa-regular fa-envelope"></i> ${escapeHtml(email)}</span>
    `;
  }

  const footerContactList = document.querySelector('.contact-info-list, .footer-col:last-child');
  if (footerContactList) {
    const pTags = footerContactList.querySelectorAll('p');
    if (pTags.length >= 3) {
      pTags[0].innerHTML = `<i class="fa-solid fa-phone"></i> ${escapeHtml(ukPhone)}`;
      pTags[1].innerHTML = `<i class="fa-brands fa-whatsapp"></i> ${escapeHtml(pkPhone)}`;
      pTags[2].innerHTML = `<i class="fa-regular fa-envelope"></i> ${escapeHtml(email)}`;
    }
  }

  const fb = (localStorage.getItem('setting_facebook_url') || localStorage.getItem('setting_facebook') || '').trim();
  const yt = (localStorage.getItem('setting_youtube_url') || localStorage.getItem('setting_youtube') || '').trim();
  const ig = (localStorage.getItem('setting_instagram_url') || localStorage.getItem('setting_instagram') || '').trim();
  const tt = (localStorage.getItem('setting_tiktok_url') || localStorage.getItem('setting_tiktok') || '').trim();
  const li = (localStorage.getItem('setting_linkedin_url') || localStorage.getItem('setting_linkedin') || '').trim();

  const activeSocials = [];
  if (fb) activeSocials.push({ name: 'Facebook', url: fb, icon: 'fa-brands fa-facebook-f' });
  if (yt) activeSocials.push({ name: 'YouTube', url: yt, icon: 'fa-brands fa-youtube' });
  if (ig) activeSocials.push({ name: 'Instagram', url: ig, icon: 'fa-brands fa-instagram' });
  if (tt) activeSocials.push({ name: 'TikTok', url: tt, icon: 'fa-brands fa-tiktok' });
  if (li) activeSocials.push({ name: 'LinkedIn', url: li, icon: 'fa-brands fa-linkedin-in' });

  const topSocialsContainer = document.querySelector('.top-socials');
  if (topSocialsContainer) {
    if (activeSocials.length === 0) {
      topSocialsContainer.style.display = 'none';
    } else {
      topSocialsContainer.style.display = 'flex';
      topSocialsContainer.innerHTML = activeSocials.map(s => `
        <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">
          <i class="${s.icon}"></i>
        </a>
      `).join('');
    }
  }

  document.querySelectorAll('.footer-socials').forEach(group => {
    if (activeSocials.length === 0) {
      group.style.display = 'none';
    } else {
      group.style.display = 'flex';
      group.innerHTML = activeSocials.map(s => `
        <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}" title="${s.name}">
          <i class="${s.icon}"></i>
        </a>
      `).join('');
    }
  });
}

// Render dynamic courses on homepage & courses page
function renderDynamicCourses(courses) {
  const coursesGrid = document.querySelector('.courses-grid');
  if (!coursesGrid) return;

  coursesGrid.innerHTML = courses.map((c, idx) => `
    <div class="course-card anim-up anim-delay-${(idx % 3) + 1}">
      <div class="course-thumb">
        <img src="${escapeHtml(c.image_url)}" alt="${escapeHtml(c.title)}" onerror="this.src='https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600';" />
        <span class="course-badge">${escapeHtml(c.badge || 'Course')}</span>
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span><i class="fa-regular fa-clock"></i> ${escapeHtml(c.duration || '30 Min / Class')}</span>
          <span><i class="fa-solid fa-user-group"></i> ${escapeHtml(c.target_audience || 'All Ages')}</span>
        </div>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description)}</p>
        <ul class="course-highlights">
          ${(c.highlights || []).map(h => `<li><i class="fa-solid fa-check"></i> ${escapeHtml(h)}</li>`).join('')}
        </ul>
        <div class="course-footer">
          <a href="admission.html?course=${encodeURIComponent(c.title)}" class="btn btn-outline btn-sm">Enroll Now</a>
          <a href="admission.html?course=${encodeURIComponent(c.title)}" class="learn-link">Free Trial <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    </div>
  `).join('');

  if (typeof initScrollAnimations === 'function') {
    initScrollAnimations();
  }
}

function updateAdmissionCourseDropdown(courses) {
  const selects = [document.getElementById('admissionCourse'), document.getElementById('leadCourse')];
  selects.forEach(select => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = courses.map(c => `<option value="${escapeHtml(c.title)}">${escapeHtml(c.title)}</option>`).join('');
    if (currentVal) select.value = currentVal;
  });
}

function renderDynamicTutors(tutors) {
  const homeTutorsGrid = document.querySelector('.tutors-grid');
  if (!homeTutorsGrid) return;

  homeTutorsGrid.innerHTML = tutors.slice(0, 3).map((t, idx) => `
    <div class="tutor-card anim-up anim-delay-${(idx % 3) + 1}">
      <div class="tutor-avatar">
        <img src="${t.image_url}" alt="${t.name}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300';" />
        <span class="tutor-status online"><i class="fa-solid fa-circle"></i> Available</span>
      </div>
      <div class="tutor-info">
        <h3>${t.name}</h3>
        <span class="tutor-role">${t.role_title}</span>
        <p>${t.bio}</p>
        <div class="tutor-tags">
          ${(t.tags || []).map(tag => `<span>${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  if (typeof initScrollAnimations === 'function') {
    initScrollAnimations();
  }
}

function renderDynamicShowcase(items) {
  const showcaseContainer = document.getElementById('studentShowcaseGrid');
  if (showcaseContainer && items) {
    showcaseContainer.innerHTML = items.map((s, idx) => `
      <div class="pillar-card anim-up anim-delay-${(idx % 3) + 1}" style="padding:20px; text-align:center;">
        <img src="${s.image_url}" alt="${s.student_name}" style="width:100%; height:190px; border-radius:10px; object-fit:cover; margin-bottom:14px;" />
        <h3 style="font-size:18px;">${s.student_name} <small style="font-size:12px; color:var(--text-muted);">${s.age ? '(' + s.age + ' yrs)' : ''}</small></h3>
        <p style="color:var(--accent); font-weight:700; font-size:13px; margin-bottom:6px;"><i class="fa-solid fa-award"></i> ${s.course_or_achievement}</p>
        <p style="font-size:13px; color:var(--text-muted);">${s.story || ''}</p>
        ${s.country ? `<small style="color:#64748b; margin-top:8px; display:block;"><i class="fa-solid fa-location-dot"></i> ${s.country}</small>` : ''}
      </div>
    `).join('');
  }

  // Sync Student Images to the Hero Banner
  if (items && items.length) {
    updateHeroBannerImages(items);
  }

  if (typeof initScrollAnimations === 'function') {
    initScrollAnimations();
  }
}

// ==========================================================================
// HERO PURE STUDENT IMAGES AUTO-SCROLL BANNER
// ==========================================================================
let currentHeroBannerIndex = 0;
let heroBannerTimer = null;

function initHeroBannerSlider() {
  const slides = document.querySelectorAll('.hero-banner-slide');
  const dotsContainer = document.getElementById('heroBannerDots');
  if (!slides.length) return;

  function showBannerSlide(index) {
    const allSlides = document.querySelectorAll('.hero-banner-slide');
    const allDots = document.querySelectorAll('#heroBannerDots .banner-slider-dot');
    if (!allSlides.length) return;

    if (index >= allSlides.length) index = 0;
    if (index < 0) index = allSlides.length - 1;

    allSlides.forEach((s, idx) => {
      s.classList.toggle('active', idx === index);
    });

    allDots.forEach((d, idx) => {
      d.classList.toggle('active', idx === index);
    });

    currentHeroBannerIndex = index;
  }

  window.goToHeroBannerSlide = function(index) {
    showBannerSlide(index);
    startBannerTimer();
  };

  window.nextHeroBannerSlide = function() {
    showBannerSlide(currentHeroBannerIndex + 1);
    startBannerTimer();
  };

  window.prevHeroBannerSlide = function() {
    showBannerSlide(currentHeroBannerIndex - 1);
    startBannerTimer();
  };

  function startBannerTimer() {
    if (heroBannerTimer) clearInterval(heroBannerTimer);
    heroBannerTimer = setInterval(() => {
      showBannerSlide(currentHeroBannerIndex + 1);
    }, 3200); // Transitions to next student image every 3.2s
  }

  const frame = document.querySelector('.hero-banner-frame');
  if (frame) {
    frame.addEventListener('mouseenter', () => {
      if (heroBannerTimer) clearInterval(heroBannerTimer);
    });
    frame.addEventListener('mouseleave', () => {
      startBannerTimer();
    });
  }

  startBannerTimer();
}

// Dynamically sync student images from Supabase showcase into the Hero Banner
function updateHeroBannerImages(items) {
  const track = document.getElementById('heroBannerTrack');
  const dots = document.getElementById('heroBannerDots');
  if (!track || !items || !items.length) return;

  track.innerHTML = items.map((s, idx) => `
    <div class="hero-banner-slide ${idx === 0 ? 'active' : ''}">
      <img src="${escapeHtml(s.image_url)}" alt="Quran Student" onerror="this.src='https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80';" />
    </div>
  `).join('');

  if (dots) {
    dots.innerHTML = items.map((_, idx) => `
      <span class="banner-slider-dot ${idx === 0 ? 'active' : ''}" onclick="goToHeroBannerSlide(${idx})"></span>
    `).join('');
  }

  initHeroBannerSlider();
}

/* ==========================================================================
   Form Handlers with Supabase INSERT
   ========================================================================== */

// 1. Quick Lead Form Handler (Homepage)
async function handleQuickForm(e) {
  e.preventDefault();
  const name = document.getElementById('leadName').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const email = document.getElementById('leadEmail').value.trim();
  const course = document.getElementById('leadCourse').value;
  const tutor = document.getElementById('leadTutor').value;
  const statusDiv = document.getElementById('quickFormStatus');

  if (!name || !phone || !email) {
    alert('Please fill out all required fields.');
    return;
  }

  statusDiv.className = 'form-status success';
  statusDiv.innerHTML = `
    <i class="fa-solid fa-circle-check"></i> JazakAllah Khair ${name}! Your free trial request has been submitted.<br>
    <small>Our counselor will contact you via WhatsApp (${phone}) to schedule your first class.</small>
  `;

  const client = typeof initSupabase === 'function' ? initSupabase() : null;
  const payload = {
    student_name: name,
    phone_whatsapp: phone,
    email: email,
    course: course,
    tutor_preference: tutor,
    source: 'quick_hero_form',
    status: 'pending'
  };

  if (client) {
    try {
      const { error } = await client.from('trial_requests').insert([payload]);
      if (error) console.error("Supabase insert error:", error);
    } catch (err) {
      console.error(err);
    }
  } else {
    saveLocalTrial(payload);
  }

  const waMsg = encodeURIComponent(
    `Assalam-o-Alaikum, I just registered for a 3-Day Free Trial at Ushaq Ul Quran Academy.\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nCourse: ${course}\nTutor: ${tutor}`
  );
  
  setTimeout(() => {
    window.open(`https://wa.me/923001234567?text=${waMsg}`, '_blank');
  }, 1200);

  e.target.reset();
}

// 2. Full Admission Form Handler (admission.html)
async function handleAdmissionForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('admissionStatus');
  const name = document.getElementById('studentName').value.trim();
  const age = parseInt(document.getElementById('studentAge')?.value) || null;
  const guardian = document.getElementById('guardianName')?.value.trim() || null;
  const gender = document.getElementById('studentGender')?.value || null;
  const phone = document.getElementById('studentPhone').value.trim();
  const email = document.getElementById('studentEmail')?.value.trim();
  const country = document.getElementById('studentCountry')?.value || null;
  const timezone = document.getElementById('studentTimezone')?.value || null;
  const course = document.getElementById('admissionCourse').value;
  const plan = document.getElementById('admissionPlan')?.value;
  const tutorPref = document.getElementById('admissionTutorPref')?.value;
  const timeSlot = document.getElementById('admissionTimeSlot')?.value;
  const notes = document.getElementById('admissionNotes')?.value;

  statusDiv.className = 'form-status success';
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `
    <h4><i class="fa-solid fa-circle-check"></i> Registration Successfully Received!</h4>
    <p>JazakAllah Khair, <strong>${name}</strong>. Your 3-Day Free Trial for <strong>${course}</strong> has been registered. Our supervisor will message you at <strong>${phone}</strong> shortly with your classroom link.</p>
  `;

  const payload = {
    student_name: name,
    student_age: age,
    guardian_name: guardian,
    gender: gender,
    phone_whatsapp: phone,
    email: email,
    country: country,
    timezone: timezone,
    course: course,
    plan: plan,
    tutor_preference: tutorPref,
    preferred_time: timeSlot,
    notes: notes,
    source: 'website_admission_form',
    status: 'pending'
  };

  const client = typeof initSupabase === 'function' ? initSupabase() : null;
  if (client) {
    try {
      const { error } = await client.from('trial_requests').insert([payload]);
      if (error) console.error("Supabase insert error:", error);
    } catch (err) {
      console.error(err);
    }
  } else {
    saveLocalTrial(payload);
  }

  const waMsg = encodeURIComponent(
    `Assalam-o-Alaikum Ushaq Ul Quran Academy, I have submitted the complete admission form for ${name} for ${course}. Please confirm our free trial schedule.`
  );

  setTimeout(() => {
    window.open(`https://wa.me/923001234567?text=${waMsg}`, '_blank');
  }, 1500);

  e.target.reset();
}

function saveLocalTrial(payload) {
  const local = JSON.parse(localStorage.getItem('local_trials') || '[]');
  payload.created_at = new Date().toISOString();
  payload.id = 'local_' + Date.now();
  local.unshift(payload);
  localStorage.setItem('local_trials', JSON.stringify(local));
}

// Contact Form Handler
function handleContactForm(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('contactStatus');
  statusDiv.className = 'form-status success';
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Message sent successfully! Our academic counselor will respond within 24 hours.`;
  e.target.reset();
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
