-- ============================================================================
-- College Complaint Management System - Supabase schema
-- ============================================================================
--
-- HOW TO APPLY
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and click "Run".
--   3. Create an admin user: Authentication -> Users -> "Add user"
--      (email + password), then run the ADMIN SETUP snippet at the bottom
--      of this file with that email.
--
-- This script is IDEMPOTENT: it can be run repeatedly and it also migrates an
-- older `complaints` table that used `student_id`/`location` columns.
--
-- AUTHORIZATION MODEL (enforced by RLS, not just by the UI)
--   anon / student : may INSERT complaints, and read ACTIVE categories and
--                    priority keywords (priority is calculated at submit time).
--   admin          : a row in admin_profiles (is_admin = true) linked to an
--                    auth.users account. Only admins may read complaints or
--                    manage categories and priority keywords.
-- ============================================================================


-- ============================================================================
-- 1. COMPLAINTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_number TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  class_division TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  category TEXT NOT NULL,
  pc_number TEXT,
  description TEXT NOT NULL,
  priority_level TEXT NOT NULL DEFAULT 'LOW',
  priority_score SMALLINT NOT NULL DEFAULT 1,
  detected_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by TEXT
);

-- --- Migration from the earlier schema (safe no-ops on a fresh database) ---
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS gmail_id TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT;

-- Preserve any existing historical data before tightening the new columns.
UPDATE complaints SET roll_number = COALESCE(roll_number, student_id) WHERE roll_number IS NULL;
UPDATE complaints SET gmail_id = COALESCE(gmail_id, 'unknown@example.com') WHERE gmail_id IS NULL;

ALTER TABLE complaints ALTER COLUMN roll_number SET NOT NULL;
ALTER TABLE complaints ALTER COLUMN gmail_id SET NOT NULL;

-- The old columns are no longer part of the form; keep them nullable so
-- historical rows are not lost.
ALTER TABLE complaints ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE complaints ALTER COLUMN location DROP NOT NULL;

-- --- Constraints -----------------------------------------------------------
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS check_priority_level;
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE complaints
  ADD CONSTRAINT check_priority_level CHECK (priority_level IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  ADD CONSTRAINT check_status CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','REJECTED'));

-- --- Indexes ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority_score ON complaints(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at ASC);

-- Composite index backing the Priority Queue query for active complaints.
CREATE INDEX IF NOT EXISTS idx_complaints_queue
  ON complaints(priority_score DESC, created_at ASC)
  WHERE status IN ('PENDING','IN_PROGRESS');


-- --- Complaint number generation -------------------------------------------
-- Students are anonymous and RLS lets them INSERT but NOT SELECT complaints,
-- so the browser cannot read the current maximum number to increment it.
-- This SECURITY DEFINER function computes the next number inside the database
-- (as the table owner, bypassing RLS) and is the only generator the anon role
-- needs. The UNIQUE constraint on complaint_number still protects against
-- concurrent collisions; the client retries with a freshly generated number.
CREATE OR REPLACE FUNCTION next_complaint_number()
RETURNS TEXT AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(split_part(complaint_number, '-', 3)::INTEGER), 0) + 1
    INTO next_seq
    FROM complaints
   WHERE complaint_number LIKE 'CMP-' || yr || '-%';

  RETURN 'CMP-' || yr || '-' || lpad(next_seq::TEXT, 5, '0');
EXCEPTION
  WHEN others THEN
    -- A legacy row with a non-numeric sequence must not block submissions.
    -- Fall back to a time-based value; UNIQUE + client retry handles clashes.
    RETURN 'CMP-' || yr || '-' ||
      lpad((extract(epoch FROM clock_timestamp())::BIGINT % 100000)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION next_complaint_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION next_complaint_number() TO anon, authenticated;


-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);


-- ============================================================================
-- 3. PRIORITY KEYWORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS priority_keywords (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  priority_level TEXT NOT NULL DEFAULT 'LOW',
  priority_score SMALLINT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE priority_keywords DROP CONSTRAINT IF EXISTS check_priority_keywords_level;
ALTER TABLE priority_keywords
  ADD CONSTRAINT check_priority_keywords_level CHECK (priority_level IN ('CRITICAL','HIGH','MEDIUM','LOW'));

CREATE INDEX IF NOT EXISTS idx_priority_keywords_active ON priority_keywords(is_active);


-- ============================================================================
-- 4. ADMIN PROFILES (authorization source of truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 5. ADMIN CHECK FUNCTION
-- ============================================================================
-- SECURITY DEFINER so it can read admin_profiles regardless of caller RLS.
CREATE OR REPLACE FUNCTION is_admin_user(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = uid AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- --- complaints ------------------------------------------------------------
-- Anyone may submit a complaint. Status and priority are not settable by the
-- student form beyond the values the app computes, and no UPDATE/DELETE is
-- granted to anon.
DROP POLICY IF EXISTS "Students can insert complaints" ON complaints;
CREATE POLICY "Students can insert complaints" ON complaints
  FOR INSERT
  WITH CHECK (true);

-- Remove the legacy policy that treated every authenticated user as an admin.
DROP POLICY IF EXISTS "Authenticated users can view complaints" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can update complaints" ON complaints;

DROP POLICY IF EXISTS "Admins can view complaints" ON complaints;
CREATE POLICY "Admins can view complaints" ON complaints
  FOR SELECT
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;
CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- Permanent removal is admin-only and irreversible. Students/anon have no
-- DELETE grant, so a complaint can only be purged by an authorized admin.
DROP POLICY IF EXISTS "Admins can delete complaints" ON complaints;
CREATE POLICY "Admins can delete complaints" ON complaints
  FOR DELETE
  USING (is_admin_user(auth.uid()));

-- --- categories ------------------------------------------------------------
-- Students/anon only see active categories in the complaint form.
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT
  USING (is_active = true);

-- Admins see every category, including deactivated ones.
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
CREATE POLICY "Admins can view all categories" ON categories
  FOR SELECT
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT
  WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE
  USING (is_admin_user(auth.uid()));

-- --- priority_keywords -----------------------------------------------------
-- Priority is calculated at submit time on the client, so the active keyword
-- list must be readable by anon. Inactive keywords stay hidden.
DROP POLICY IF EXISTS "Anyone can view active priority keywords" ON priority_keywords;
CREATE POLICY "Anyone can view active priority keywords" ON priority_keywords
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all priority keywords" ON priority_keywords;
CREATE POLICY "Admins can view all priority keywords" ON priority_keywords
  FOR SELECT
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert priority keywords" ON priority_keywords;
CREATE POLICY "Admins can insert priority keywords" ON priority_keywords
  FOR INSERT
  WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update priority keywords" ON priority_keywords;
CREATE POLICY "Admins can update priority keywords" ON priority_keywords
  FOR UPDATE
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete priority keywords" ON priority_keywords;
CREATE POLICY "Admins can delete priority keywords" ON priority_keywords
  FOR DELETE
  USING (is_admin_user(auth.uid()));

-- --- admin_profiles --------------------------------------------------------
-- A signed-in user may read only their own profile row; this is what the admin
-- login and admin layout use to confirm authorization.
DROP POLICY IF EXISTS "Users can read own admin profile" ON admin_profiles;
CREATE POLICY "Users can read own admin profile" ON admin_profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert their own profile" ON admin_profiles;
CREATE POLICY "Admins can insert their own profile" ON admin_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update own profile" ON admin_profiles;
CREATE POLICY "Admins can update own profile" ON admin_profiles
  FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================================
-- 7. REALTIME
-- ============================================================================
-- Supabase Realtime only publishes tables that are members of the
-- supabase_realtime publication. Without this, admins would have to refresh
-- the dashboard manually to see new complaints.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- already published
END;
$$;

-- ============================================================================
-- 8. updated_at TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_complaints_updated_at ON complaints;
CREATE TRIGGER set_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_priority_keywords_updated_at ON priority_keywords;
CREATE TRIGGER set_priority_keywords_updated_at
  BEFORE UPDATE ON priority_keywords
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- 9. SEED DATA (inserted only when the tables are still empty)
-- ============================================================================
DO $$
DECLARE
  category_count INTEGER;
  keyword_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO category_count FROM categories;
  IF category_count = 0 THEN
    INSERT INTO categories (name) VALUES
      ('Computer / PC'),
      ('Internet / Wi-Fi'),
      ('Electrical'),
      ('Projector / Smart Board'),
      ('Fan / AC'),
      ('Furniture'),
      ('Water / Plumbing'),
      ('Cleanliness'),
      ('Security'),
      ('Laboratory Equipment'),
      ('Other');
  END IF;

  SELECT COUNT(*) INTO keyword_count FROM priority_keywords;
  IF keyword_count = 0 THEN
    INSERT INTO priority_keywords (keyword, priority_level, priority_score) VALUES
      ('short circuit', 'CRITICAL', 4),
      ('sparks', 'CRITICAL', 4),
      ('electric shock', 'CRITICAL', 4),
      ('fire', 'CRITICAL', 4),
      ('smoke', 'CRITICAL', 4),
      ('exposed wire', 'CRITICAL', 4),
      ('burning wire', 'CRITICAL', 4),
      ('power failure', 'HIGH', 3),
      ('network down', 'HIGH', 3),
      ('server down', 'HIGH', 3),
      ('entire lab not working', 'HIGH', 3),
      ('multiple PCs not working', 'HIGH', 3),
      ('major water leakage', 'HIGH', 3),
      ('PC not working', 'MEDIUM', 2),
      ('printer not working', 'MEDIUM', 2),
      ('fan not working', 'MEDIUM', 2),
      ('AC not working', 'MEDIUM', 2),
      ('projector not working', 'MEDIUM', 2),
      ('Wi-Fi slow', 'MEDIUM', 2),
      ('minor issue', 'LOW', 1),
      ('small damage', 'LOW', 1),
      ('cosmetic issue', 'LOW', 1);
  END IF;
END;
$$;


-- ============================================================================
-- 10. ADMIN SETUP  (run AFTER creating a user in Authentication -> Users)
-- ============================================================================
-- Replace the email below with your admin account email, then run just this
-- statement:
--
-- INSERT INTO admin_profiles (id, email, full_name, is_admin)
-- SELECT id, email, 'College Administrator', true
-- FROM auth.users
-- WHERE email = 'admin@college.edu'
-- ON CONFLICT (id) DO UPDATE SET is_admin = true;
--
-- To revoke admin access later:
-- UPDATE admin_profiles SET is_admin = false WHERE email = 'admin@college.edu';


-- ============================================================================
-- 11. DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE complaints IS 'Student complaints managed by college administrators';
COMMENT ON COLUMN complaints.complaint_number IS 'Unique complaint identifier, format CMP-YYYY-NNNNN';
COMMENT ON COLUMN complaints.priority_level IS 'CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1';
COMMENT ON COLUMN complaints.detected_keywords IS 'Keywords detected from category/description at submit time (frozen with the record)';
COMMENT ON TABLE categories IS 'Complaint categories shown in the student form';
COMMENT ON TABLE priority_keywords IS 'Admin-managed keyword to priority mapping';
COMMENT ON TABLE admin_profiles IS 'Authorized administrators; existence here is required to access the admin portal';
COMMENT ON FUNCTION next_complaint_number() IS 'Returns the next CMP-YYYY-NNNNN complaint number (SECURITY DEFINER: works for anon, who cannot SELECT complaints)';


-- ============================================================================
-- 12. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================================
-- Make new columns/functions immediately visible to the REST API instead of
-- waiting for the next automatic reload.
NOTIFY pgrst, 'reload schema';
