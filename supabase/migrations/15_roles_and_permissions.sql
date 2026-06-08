-- ============================================================
-- Migration 15: Role & Permission System (Multi-Organisasi MAKT)
-- Additive only — tidak drop/rename kolom existing
-- jabatan (text) tetap ada untuk backward compatibility approval workflow
-- ============================================================

-- ============================================================
-- STEP 1: Enum system_role_type
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.system_role_type AS ENUM (
    'super_admin',
    'admin_makt',
    'admin_organisasi',
    'admin_event',
    'admin_absensi',
    'sekretaris',
    'approver',
    'ketua_rapat',
    'pengurus',
    'viewer'
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'system_role_type sudah ada, skip';
END $$;

-- ============================================================
-- STEP 2: Tambah system_role ke user_profiles (nullable = tetap aman)
-- ============================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS system_role public.system_role_type DEFAULT NULL;

-- Tambah kolom organization_id untuk Admin Organisasi (opsional)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS primary_organization_id UUID
    REFERENCES public.organizations(id) ON DELETE SET NULL
    DEFAULT NULL;

-- ============================================================
-- STEP 3: Tabel user_org_roles — role per organisasi
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_org_roles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role              public.system_role_type NOT NULL DEFAULT 'pengurus',
  granted_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Trigger updated_at
CREATE TRIGGER set_user_org_roles_updated_at
  BEFORE UPDATE ON public.user_org_roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- STEP 4: Helper functions (SECURITY DEFINER agar bisa akses auth.users)
-- ============================================================

-- 4.1: Cek apakah user saat ini adalah Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Cek via system_role di user_profiles
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND system_role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;
  -- Fallback: cek email hardcoded (backward compatibility)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN ('officialsiyoyok@gmail.com', 'yahya@example.com')
  ) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- 4.2: Ambil system_role user saat ini
CREATE OR REPLACE FUNCTION public.get_my_system_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Super admin check dulu
  IF public.is_super_admin() THEN
    RETURN 'super_admin';
  END IF;
  -- Ambil dari user_profiles
  SELECT system_role::TEXT INTO v_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- 4.3: Cek apakah user punya role tertentu (global)
CREATE OR REPLACE FUNCTION public.has_system_role(check_role public.system_role_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF public.is_super_admin() THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND system_role = check_role
  );
END;
$$;

-- 4.4: Cek apakah user adalah anggota/memiliki role di organisasi tertentu
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF public.is_super_admin() THEN RETURN TRUE; END IF;
  -- Cek via user_org_roles
  IF EXISTS (
    SELECT 1 FROM public.user_org_roles
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  -- Cek via organization_members (jabatan)
  IF EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = p_organization_id
    AND om.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- 4.5: Ambil semua org_id yang user punya akses
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_ids UUID[];
BEGIN
  IF public.is_super_admin() THEN
    SELECT ARRAY(SELECT id FROM public.organizations) INTO v_org_ids;
    RETURN v_org_ids;
  END IF;
  SELECT ARRAY(
    SELECT DISTINCT organization_id FROM public.user_org_roles
    WHERE user_id = auth.uid() AND is_active = TRUE
    UNION
    SELECT DISTINCT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  ) INTO v_org_ids;
  RETURN COALESCE(v_org_ids, '{}');
END;
$$;

-- 4.6: Cek apakah user bisa manage data organisasi tertentu
CREATE OR REPLACE FUNCTION public.can_manage_org(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF public.is_super_admin() THEN RETURN TRUE; END IF;
  -- admin_makt bisa kelola semua
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND system_role = 'admin_makt'
  ) THEN RETURN TRUE; END IF;
  -- admin_organisasi hanya org sendiri
  IF EXISTS (
    SELECT 1 FROM public.user_org_roles
    WHERE user_id = auth.uid()
    AND organization_id = p_organization_id
    AND role IN ('admin_organisasi', 'admin_makt')
    AND is_active = TRUE
  ) THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$;

-- 4.7: Cek apakah user bisa melihat notulen berdasarkan privacy scope
CREATE OR REPLACE FUNCTION public.can_view_minutes(
  p_organization_id UUID,
  p_privacy_scope TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- public: semua bisa
  IF p_privacy_scope = 'public' THEN RETURN TRUE; END IF;
  -- Harus login untuk scope lainnya
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  -- super_admin & admin_makt: selalu bisa
  IF public.is_super_admin() THEN RETURN TRUE; END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND system_role = 'admin_makt'
  ) THEN RETURN TRUE; END IF;
  -- organization_internal: hanya anggota org pemilik
  IF p_privacy_scope = 'organization_internal' THEN
    RETURN public.is_org_member(p_organization_id);
  END IF;
  -- makt_internal: semua yang punya role di org manapun
  IF p_privacy_scope = 'makt_internal' THEN
    RETURN ARRAY_LENGTH(public.get_my_org_ids(), 1) > 0;
  END IF;
  -- confidential: hanya super_admin (sudah handled di atas)
  IF p_privacy_scope = 'confidential' THEN
    RETURN FALSE;
  END IF;
  -- restricted: cek via meeting_minutes_access (handled di aplikasi)
  RETURN FALSE;
END;
$$;

-- ============================================================
-- STEP 5: Enable RLS di tabel baru & tambah policies
-- ============================================================

-- 5.1: organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_public_read" ON public.organizations
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "org_superadmin_manage" ON public.organizations
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "org_admin_makt_manage" ON public.organizations
  FOR ALL USING (public.has_system_role('admin_makt'));

-- 5.2: organization_units table
ALTER TABLE public.organization_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_public_read" ON public.organization_units
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "units_admin_manage" ON public.organization_units
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_system_role('admin_makt')
    OR public.can_manage_org(organization_id)
  );

-- 5.3: positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_public_read" ON public.positions
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "positions_admin_manage" ON public.positions
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_system_role('admin_makt')
    OR public.can_manage_org(organization_id)
  );

-- 5.4: organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_org_read" ON public.organization_members
  FOR SELECT USING (
    is_active = TRUE
    AND public.is_org_member(organization_id)
  );

CREATE POLICY "members_admin_manage" ON public.organization_members
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_system_role('admin_makt')
    OR public.can_manage_org(organization_id)
  );

-- 5.5: user_org_roles table
ALTER TABLE public.user_org_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_org_roles_own_read" ON public.user_org_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "user_org_roles_admin_manage" ON public.user_org_roles
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_system_role('admin_makt')
  );

-- 5.6: meeting_minutes — privacy scope aware
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "meeting_minutes_all_access" ON public.meeting_minutes;
DROP POLICY IF EXISTS "authenticated_all" ON public.meeting_minutes;

-- Read: privacy scope aware
CREATE POLICY "meeting_minutes_read" ON public.meeting_minutes
  FOR SELECT USING (
    public.can_view_minutes(organization_id, COALESCE(privacy_scope::TEXT, 'makt_internal'))
  );

-- Write: sekretaris, ketua_rapat, admin_makt, super_admin
CREATE POLICY "meeting_minutes_write" ON public.meeting_minutes
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_system_role('admin_makt')
    OR public.has_system_role('sekretaris')
    OR public.has_system_role('ketua_rapat')
    OR (organization_id IS NOT NULL AND public.can_manage_org(organization_id))
  );

-- 5.7: Fix RLS user_profiles — perbaiki inkonsistensi (officialsiyoyok juga dapat akses)
-- Tambah policy khusus untuk super_admin via fungsi (tidak hardcode email lagi)
CREATE POLICY "user_profiles_super_admin_all" ON public.user_profiles
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================================
-- STEP 6: Seed — set Super Admin
-- ============================================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Set officialsiyoyok sebagai super_admin
  SELECT id INTO v_user_id FROM auth.users
  WHERE email = 'officialsiyoyok@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET system_role = 'super_admin'
    WHERE user_id = v_user_id;
    RAISE NOTICE '✓ officialsiyoyok@gmail.com → super_admin';
  END IF;

  -- Set yahya sebagai super_admin juga (jika ada)
  SELECT id INTO v_user_id FROM auth.users
  WHERE email ILIKE 'yahya@%'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET system_role = 'super_admin'
    WHERE user_id = v_user_id;
    RAISE NOTICE '✓ yahya@... → super_admin';
  END IF;

  RAISE NOTICE '=== Migration 15 SELESAI ===';
END $$;
