-- ============================================================================
-- USHAQ UL QURAN ACADEMY - FULLY IDEMPOTENT SUPABASE SCHEMA
-- Safe to run multiple times without any errors (uses IF NOT EXISTS, 
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS, and DROP POLICY IF EXISTS).
-- ============================================================================

-- ============================================================================
-- 1. TRIAL REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL DEFAULT '',
    phone_whatsapp TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT '';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS student_age INTEGER;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS phone_whatsapp TEXT DEFAULT '';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'Quran Recitation Course';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Standard Plan (3 Days / Week)';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS tutor_preference TEXT DEFAULT 'Either / Any Qualified Scholar';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS preferred_time TEXT DEFAULT 'Evening (05:00 PM - 09:00 PM)';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website_admission_form';
ALTER TABLE public.trial_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Enable Row Level Security
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for trial_requests
DROP POLICY IF EXISTS "Allow public inserts for trial requests" ON public.trial_requests;
CREATE POLICY "Allow public inserts for trial requests" 
ON public.trial_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read trial requests" ON public.trial_requests;
CREATE POLICY "Allow read trial requests" 
ON public.trial_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow update trial requests" ON public.trial_requests;
CREATE POLICY "Allow update trial requests" 
ON public.trial_requests FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete trial requests" ON public.trial_requests;
CREATE POLICY "Allow delete trial requests" 
ON public.trial_requests FOR DELETE TO anon, authenticated USING (true);


-- ============================================================================
-- 2. COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    badge TEXT DEFAULT 'Popular',
    duration TEXT DEFAULT '30 Min / Class',
    target_audience TEXT DEFAULT 'All Ages',
    description TEXT NOT NULL,
    highlights TEXT[] DEFAULT ARRAY[]::TEXT[],
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'Popular';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '30 Min / Class';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'All Ages';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add unique constraint on title if not present so seeding is idempotent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'courses_title_unique'
    ) THEN
        ALTER TABLE public.courses ADD CONSTRAINT courses_title_unique UNIQUE (title);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if duplicate data already prevents unique constraint
END $$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read courses" ON public.courses;
CREATE POLICY "Allow public read courses" 
ON public.courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage courses" ON public.courses;
CREATE POLICY "Allow manage courses" 
ON public.courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 3. ADMIN USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'Admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Admin';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add unique constraint on username if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_username_unique'
    ) THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_username_unique UNIQUE (username);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if duplicate data prevents unique constraint
END $$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read admin users" ON public.admin_users;
CREATE POLICY "Allow read admin users" 
ON public.admin_users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage admin users" ON public.admin_users;
CREATE POLICY "Allow manage admin users" 
ON public.admin_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 4. TUTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'male',
    role_title TEXT NOT NULL,
    bio TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS role_title TEXT;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;

-- Add unique constraint on name for idempotency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tutors_name_unique'
    ) THEN
        ALTER TABLE public.tutors ADD CONSTRAINT tutors_name_unique UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore
END $$;

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read tutors" ON public.tutors;
CREATE POLICY "Allow public read tutors" 
ON public.tutors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage tutors" ON public.tutors;
CREATE POLICY "Allow manage tutors" 
ON public.tutors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 5. STUDENT SHOWCASE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    age INTEGER,
    course_or_achievement TEXT NOT NULL,
    story TEXT,
    image_url TEXT NOT NULL,
    country TEXT,
    display_order INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS course_or_achievement TEXT;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;
ALTER TABLE public.student_showcase ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Add unique constraint on student_name for idempotency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_showcase_name_unique'
    ) THEN
        ALTER TABLE public.student_showcase ADD CONSTRAINT student_showcase_name_unique UNIQUE (student_name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore
END $$;

ALTER TABLE public.student_showcase ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read student showcase" ON public.student_showcase;
CREATE POLICY "Allow public read student showcase" 
ON public.student_showcase FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage student showcase" ON public.student_showcase;
CREATE POLICY "Allow manage student showcase" 
ON public.student_showcase FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 6. SITE SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY,
    key_label TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on existing table
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS key_label TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site settings" ON public.site_settings;
CREATE POLICY "Allow public read site settings" 
ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage site settings" ON public.site_settings;
CREATE POLICY "Allow manage site settings" 
ON public.site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 7. SEED INITIAL SAMPLE DATA (SAFE ON CONFLICT)
-- ============================================================================

-- Seed Default Master Admin User
INSERT INTO public.admin_users (username, password, full_name, email, role, is_active) 
VALUES ('admin', 'admin', 'Lead Academic Director', 'contact@ushaqulquran.com', 'Super Admin', true)
ON CONFLICT (username) DO NOTHING;

-- Seed Initial Courses
INSERT INTO public.courses (title, badge, duration, target_audience, description, highlights, image_url, display_order, is_active) 
VALUES
('Noorani Qaida for Beginners', 'Foundational', '30 Min / Class', 'All Ages', 'Master Arabic phonetics, correct Makharij articulation points, and letter joining rules to build a flawless reading foundation.', ARRAY['Letter shapes & phonics', 'Harakat, Tanween & Sukoon', 'Practice with live feedback'], 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=700&q=80', 1, true),
('Tajweed & Tarteel Mastery', 'Popular', '30 Min / Class', 'Intermediate', 'Learn theoretical and applied rules of Tajweed including Ghunnah, Ikhfa, Idgham, Qalqalah, and Madd for beautiful recitation.', ARRAY['Essential Tajweed regulations', 'Breath control and stopping signs', 'Melodious Tarteel modulation'], 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=700&q=80', 2, true),
('Quran Recitation (Nazra)', 'Core', '30 Min / Class', 'All Levels', 'Guided, fluent recitation through the entire 30 Paras of the Quran with direct corrections and continuous encouragement.', ARRAY['Continuous reading fluency', 'Instant pronunciation fixes', 'Completion certificate at Khatam'], 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=700&q=80', 3, true),
('Quran Memorization (Hifz)', 'Advanced', '45 Min / Class', 'Dedicated', 'Systematic memorization with Sabaq (new lesson), Sabqi (recent revisions), and Manzil (repetition cycle) managed by experienced Huffaz.', ARRAY['Daily revision strategy', 'Full or selected Surah tracks', 'Strong long-term retention'], 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=700&q=80', 4, true),
('Tafseer & Quranic Meaning', 'Enriching', '30 Min / Class', 'Adults & Youths', 'Understand historical context (Asbab al-Nuzul), word-by-word linguistic analysis, and practical life reflections of the Quran.', ARRAY['Word-to-word translation', 'Classical Tafseer summaries', 'Spiritual life reflections'], 'https://images.unsplash.com/photo-1584281729288-897488f5791a?auto=format&fit=crop&w=700&q=80', 5, true),
('Islamic Essentials & Salah', 'Essential', '30 Min / Class', 'Kids (Age 4-15)', 'Step-by-step Salah (Namaz), 6 Kalimas, daily Masnoon Duas, manners (Adab), and engaging stories of the Prophets for young minds.', ARRAY['Practical Wudu & Salah demo', 'Islamic moral character (Akhlaq)', 'Inspiring Seerah stories'], 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=700&q=80', 6, true)
ON CONFLICT (title) DO NOTHING;

-- Seed Initial Tutors
INSERT INTO public.tutors (name, gender, role_title, bio, image_url, tags, is_available, display_order) 
VALUES
('Sheikh Bilal Ahmed', 'male', 'Senior Tajweed & Qira''at Specialist', 'Al-Azhar Certified, 9+ years experience teaching non-native English speakers across the UK & USA.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80', ARRAY['Hafiz-ul-Quran', 'Sanad Holder', 'English & Arabic'], true, 1),
('Qari Muhammad Usman', 'male', 'Director of Tahfeez (Hifz Program)', '12+ years of teaching experience with more than 120 completed Huffaz. Master of memory retention and gentle student encouragement.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80', ARRAY['Hifz Specialist', '120+ Huffaz Produced', 'Urdu & English'], true, 2),
('Mufti Tariq Mansoor', 'male', 'Tafseer & Classical Arabic Teacher', 'Shahadat-ul-Alamiyyah degree holder. Expert in explaining Quranic philosophy, Arabic grammar (Nahw & Sarf).', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80', ARRAY['Alim / Mufti', 'Tafseer Scholar', 'Arabic Expert'], true, 3),
('Ustadha Fatima Al-Zahra', 'female', 'Lead Female Instructor (Kids & Sisters)', 'Masters in Islamic Studies (Wifaq-ul-Madaris). Known for her nurturing, cheerful classroom environment for early Noorani Qaida students.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80', ARRAY['Female Tutor', 'Child Specialist', 'Noorani Qaida'], true, 4),
('Ustadha Zainab Maryam', 'female', 'Senior Tajweed & Sisters Recitation', 'Specializes in helping adult sisters correct long-standing pronunciation mistakes and build melodious, correct Tajweed recitation.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80', ARRAY['Sisters Tajweed', 'Nazra Recitation', 'English & Urdu'], true, 5),
('Ustadha Aisha Siddiqa', 'female', 'Female Hifz & Islamic Studies Coach', 'Passionate educator guiding young girls through complete Quran memorization and daily Masnoon Duas.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80', ARRAY['Hifz Coach', 'Islamic Manners', 'English Speaker'], true, 6)
ON CONFLICT (name) DO NOTHING;

-- Seed Initial Student Showcase
INSERT INTO public.student_showcase (student_name, age, course_or_achievement, story, image_url, country, display_order) 
VALUES
('Zayd & Safiya', 7, 'Completed Noorani Qaida in 3 Months', 'Started with zero Arabic background. Now reading Surah Al-Mulk fluently with applied Tajweed.', 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80', 'London, UK', 1),
('Hamza Farooq', 10, 'Memorized Juz Amma (Juz 30)', 'Completed Hifz of 37 Surahs in 6 months with Ustadha Fatima. Regularly leads family Maghrib prayers.', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80', 'Manchester, UK', 2),
('Aamina Khan', 8, 'Top Nazra Recitation Student', 'Awarded Student of the Month for flawless pronunciation and excellent daily attendance.', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80', 'Dallas, USA', 3)
ON CONFLICT (student_name) DO NOTHING;

-- Seed Site Settings (Uses ON CONFLICT DO UPDATE)
INSERT INTO public.site_settings (id, key_label, value) VALUES
('academy_name', 'Academy Brand Name', 'Ushaq Ul Quran'),
('academy_sub', 'Academy Subtitle / Tagline', 'Online Global Academy'),
('academy_logo_url', 'Website Custom Logo URL', ''),
('uk_phone', 'UK Phone Number', '+44 7400 123456'),
('pk_phone', 'PK Phone / WhatsApp', '+92 300 1234567'),
('email', 'Contact Email', 'contact@ushaqulquran.com'),
('announcement', 'Top Announcement Bar Text', '3-Day Free Trial Available • Zero Registration Fee • 1-on-1 Classes'),
('trial_days', 'Free Trial Days Length', '3')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- 8. STORAGE SETUP (IDEMPOTENT BUCKET & POLICIES)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academy-images', 'academy-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public view academy-images" ON storage.objects;
CREATE POLICY "Allow public view academy-images" 
ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'academy-images');

DROP POLICY IF EXISTS "Allow public upload academy-images" ON storage.objects;
CREATE POLICY "Allow public upload academy-images" 
ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'academy-images');

DROP POLICY IF EXISTS "Allow public update/delete academy-images" ON storage.objects;
CREATE POLICY "Allow public update/delete academy-images" 
ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'academy-images');
