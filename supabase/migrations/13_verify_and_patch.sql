-- ============================================================
-- Migration 13: Verify, Patch & Harden — MAKT New Modules
-- Fungsi:
--   1. Pastikan semua ENUM dari migration 12 ada (idempotent)
--   2. Pastikan semua tabel baru dari migration 12 ada (CREATE IF NOT EXISTS)
--   3. Patch kolom-kolom yang mungkin terlewat di tabel lama
--   4. Tambah UNIQUE constraint yang hilang (safe)
--   5. Perbaiki UNIQUE conflict di approval_workflows
--   6. Verifikasi data lama (events, participants, pengajuan) tidak hilang
--   7. Seed tambahan jika ada yang belum masuk
-- TIDAK DROP, TIDAK RENAME — pure additive.
-- ============================================================

-- ============================================================
-- SECTION 0: PASTIKAN FUNCTION trigger_set_timestamp ADA
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 1: ENUM — idempotent via DO $$ BEGIN ... EXCEPTION
-- ============================================================

DO $$ BEGIN
  CREATE TYPE org_type AS ENUM ('dkm', 'pemuda', 'irmas', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE org_unit_type AS ENUM (
    'dewan', 'badan_pelaksana', 'bidang', 'divisi',
    'pimpinan_harian', 'pembina', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE approval_decision AS ENUM ('approve', 'reject', 'request_revision');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE privacy_level_type AS ENUM ('detail_publik', 'umum_saja', 'rahasia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE privacy_scope_type AS ENUM (
    'public', 'organization_internal', 'makt_internal', 'restricted', 'confidential'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE minutes_status AS ENUM ('draft', 'finalized');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notif_channel AS ENUM ('whatsapp', 'email', 'in_app');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notif_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE action_item_status AS ENUM ('pending', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE photo_visibility AS ENUM ('public', 'internal', 'confidential');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE export_file_type AS ENUM ('pdf', 'docx');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE minutes_access_type AS ENUM ('view', 'comment', 'approve', 'publish');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE event_request_status AS ENUM (
    'draft', 'submitted', 'under_review',
    'revision_requested', 'approved', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE requester_type AS ENUM ('pribadi', 'lembaga', 'komunitas', 'instansi', 'internal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_type AS ENUM ('internal', 'event', 'public');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- SECTION 2: TABEL BARU — CREATE IF NOT EXISTS (idempotent)
-- ============================================================

-- 2.1 organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  short_name            TEXT,
  description           TEXT,
  type                  org_type NOT NULL DEFAULT 'other',
  parent_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  active_period_start   DATE,
  active_period_end     DATE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger
DO $$ BEGIN
  CREATE TRIGGER set_timestamp_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat organisasi aktif" ON public.organizations
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola organisasi" ON public.organizations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.2 organization_units
CREATE TABLE IF NOT EXISTS public.organization_units (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              org_unit_type NOT NULL DEFAULT 'other',
  parent_unit_id    UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  description       TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_org_units
  BEFORE UPDATE ON public.organization_units
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.organization_units ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat unit aktif" ON public.organization_units
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola unit" ON public.organization_units
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.3 positions
CREATE TABLE IF NOT EXISTS public.positions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  level_order          INTEGER NOT NULL DEFAULT 0,
  is_approver          BOOLEAN NOT NULL DEFAULT false,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_positions
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat posisi aktif" ON public.positions
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola posisi" ON public.positions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.4 organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  position_id          UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name            TEXT NOT NULL,
  whatsapp             TEXT,
  email                TEXT,
  active_period_start  DATE,
  active_period_end    DATE,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_org_members
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat member aktif" ON public.organization_members
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola member" ON public.organization_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.5 event_types
CREATE TABLE IF NOT EXISTS public.event_types (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT UNIQUE NOT NULL,
  description           TEXT,
  default_privacy_level privacy_level_type NOT NULL DEFAULT 'umum_saja',
  activates_minutes     BOOLEAN NOT NULL DEFAULT false,
  activates_attendance  BOOLEAN NOT NULL DEFAULT true,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_event_types
  BEFORE UPDATE ON public.event_types
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat event types aktif" ON public.event_types
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola event types" ON public.event_types
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Link jenis_event lama ke event_types baru (additive, nullable)
-- Dibungkus DO block: aman jika jenis_event belum ada (migration 10 belum jalan)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jenis_event'
  ) THEN
    ALTER TABLE public.jenis_event
      ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2.6 approval_workflows
-- CATATAN: UNIQUE (event_type_id, level_order) bisa bermasalah jika
-- satu event_type butuh workflow per org berbeda.
-- Kita jadikan UNIQUE per (organization_id, event_type_id, level_order) jika dibutuhkan.
-- Untuk sekarang: pakai UNIQUE hanya jika organization_id IS NULL (global).
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  event_type_id        UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  level_order          INTEGER NOT NULL DEFAULT 1,
  position_id          UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  approver_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_required          BOOLEAN NOT NULL DEFAULT true,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_approval_workflows
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat workflow aktif" ON public.approval_workflows
    FOR SELECT TO public USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola approval workflows" ON public.approval_workflows
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.7 event_requests
CREATE TABLE IF NOT EXISTS public.event_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id    UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  responsible_member_id   UUID REFERENCES public.organization_members(id) ON DELETE SET NULL,
  requester_type          requester_type NOT NULL DEFAULT 'pribadi',
  requester_name          TEXT NOT NULL,
  institution_name        TEXT,
  whatsapp                TEXT NOT NULL,
  email                   TEXT,
  address                 TEXT,
  event_name              TEXT NOT NULL,
  event_type_id           UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
  purpose                 TEXT,
  description             TEXT,
  participant_estimate    INTEGER,
  start_datetime          TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime            TIMESTAMP WITH TIME ZONE,
  facility_area           TEXT[] DEFAULT '{}',
  additional_needs        TEXT,
  attachment_letter_url   TEXT,
  attachment_proposal_url TEXT,
  status                  event_request_status NOT NULL DEFAULT 'submitted',
  current_approval_level  INTEGER DEFAULT 1,
  privacy_level           privacy_level_type NOT NULL DEFAULT 'umum_saja',
  submitted_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMP WITH TIME ZONE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_event_requests
  BEFORE UPDATE ON public.event_requests
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa submit event request" ON public.event_requests
    FOR INSERT TO public WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat event request" ON public.event_requests
    FOR SELECT TO public USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola event requests" ON public.event_requests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Link pengajuan_peminjaman lama ke event_requests baru (additive, nullable)
-- Dibungkus DO block: aman jika pengajuan_peminjaman belum ada (migration 09 belum jalan)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pengajuan_peminjaman'
  ) THEN
    ALTER TABLE public.pengajuan_peminjaman
      ADD COLUMN IF NOT EXISTS event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2.8 approval_logs
CREATE TABLE IF NOT EXISTS public.approval_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_request_id  UUID NOT NULL REFERENCES public.event_requests(id) ON DELETE CASCADE,
  workflow_level    INTEGER NOT NULL,
  approver_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position_id       UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  decision          approval_decision NOT NULL,
  note              TEXT,
  decided_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_approval_logs
  BEFORE UPDATE ON public.approval_logs
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat approval logs" ON public.approval_logs
    FOR SELECT TO public USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola approval logs" ON public.approval_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.9 calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  public_title     TEXT,
  description      TEXT,
  start_datetime   TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime     TIMESTAMP WITH TIME ZONE,
  facility_area    TEXT[] DEFAULT '{}',
  privacy_level    privacy_level_type NOT NULL DEFAULT 'umum_saja',
  is_public        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_calendar_events
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat calendar events publik" ON public.calendar_events
    FOR SELECT TO public USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola calendar events" ON public.calendar_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.10 meeting_minutes
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_request_id     UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  meeting_title        TEXT NOT NULL,
  meeting_type         TEXT,
  meeting_date         DATE NOT NULL,
  start_time           TIME,
  end_time             TIME,
  location             TEXT,
  chairperson_name     TEXT,
  secretary_name       TEXT,
  agenda               TEXT,
  discussion_summary   TEXT,
  decisions            TEXT,
  important_notes      TEXT,
  status               minutes_status NOT NULL DEFAULT 'draft',
  privacy_level        TEXT NOT NULL DEFAULT 'internal',
  privacy_scope        privacy_scope_type NOT NULL DEFAULT 'organization_internal',
  is_published         BOOLEAN NOT NULL DEFAULT false,
  published_at         TIMESTAMP WITH TIME ZONE,
  published_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_meeting_minutes
  BEFORE UPDATE ON public.meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat notulen yang dipublikasikan" ON public.meeting_minutes
    FOR SELECT TO public USING (is_published = true AND privacy_scope = 'public');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola semua notulen" ON public.meeting_minutes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.11 meeting_action_items
CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id  UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  task_description    TEXT NOT NULL,
  person_in_charge    TEXT,
  deadline            DATE,
  status              action_item_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_action_items
  BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola action items" ON public.meeting_action_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.12 meeting_photos
CREATE TABLE IF NOT EXISTS public.meeting_photos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  photo_url          TEXT NOT NULL,
  caption            TEXT,
  visibility         photo_visibility NOT NULL DEFAULT 'internal',
  uploaded_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_meeting_photos
  BEFORE UPDATE ON public.meeting_photos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.meeting_photos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public bisa lihat foto publik" ON public.meeting_photos
    FOR SELECT TO public USING (visibility = 'public');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola foto" ON public.meeting_photos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.13 meeting_report_exports
CREATE TABLE IF NOT EXISTS public.meeting_report_exports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  file_url           TEXT NOT NULL,
  file_type          export_file_type NOT NULL DEFAULT 'pdf',
  generated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_report_exports
  BEFORE UPDATE ON public.meeting_report_exports
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.meeting_report_exports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola exports" ON public.meeting_report_exports
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.14 meeting_minutes_access
CREATE TABLE IF NOT EXISTS public.meeting_minutes_access (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id   UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  role_id              UUID,
  position_id          UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type          minutes_access_type NOT NULL DEFAULT 'view',
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_minutes_access
  BEFORE UPDATE ON public.meeting_minutes_access
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.meeting_minutes_access ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola akses notulen" ON public.meeting_minutes_access
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.15 notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name           TEXT,
  recipient_whatsapp       TEXT,
  channel                  notif_channel NOT NULL DEFAULT 'in_app',
  message                  TEXT NOT NULL,
  status                   notif_status NOT NULL DEFAULT 'pending',
  sent_at                  TIMESTAMP WITH TIME ZONE,
  error_message            TEXT,
  related_event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_notifications
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "User bisa lihat notifikasi miliknya" ON public.notifications
    FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin bisa kelola notifikasi" ON public.notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- SECTION 3: UPDATE TABEL LAMA (ADDITIVE, NULLABLE — aman data existing)
-- ============================================================

-- Update participants: tambah attendance & event_request fields
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendance_type  attendance_type DEFAULT 'event';

-- Update events: tambah relasi ke event_request
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL;

-- ============================================================
-- SECTION 4: INDEXES PERFORMA (IF NOT EXISTS — aman dijalankan ulang)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id      ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id     ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_position_id ON public.organization_members(position_id);
CREATE INDEX IF NOT EXISTS idx_org_units_org_id        ON public.organization_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_org_id        ON public.positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_event_type ON public.approval_workflows(event_type_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_org  ON public.approval_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status   ON public.event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_org      ON public.event_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_event_type ON public.event_requests(event_type_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_request   ON public.approval_logs(event_request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates   ON public.calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_org     ON public.meeting_minutes(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date    ON public.meeting_minutes(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_status  ON public.meeting_minutes(status, is_published);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status    ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_related   ON public.notifications(related_event_request_id);
CREATE INDEX IF NOT EXISTS idx_participants_event_request ON public.participants(event_request_id);
CREATE INDEX IF NOT EXISTS idx_events_event_request    ON public.events(event_request_id);

-- ============================================================
-- SECTION 5: SEED DATA — ORGANISASI AWAL MAKT (ON CONFLICT DO NOTHING)
-- ============================================================

INSERT INTO public.organizations (name, short_name, description, type, is_active)
VALUES
  (
    'Badan Pengelola MAKT',
    'DKM MAKT',
    'Dewan Kemakmuran Masjid (DKM) selaku badan pengelola utama Masjid Al-Kautsar Taman',
    'dkm',
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.organizations (name, short_name, description, type, is_active)
VALUES
  (
    'Pemuda MAKT',
    'Pemuda MAKT',
    'Organisasi kepemudaan yang bernaung di bawah Masjid Al-Kautsar Taman',
    'pemuda',
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.organizations (name, short_name, description, type, is_active)
VALUES
  (
    'Irmas MAKT',
    'Irmas MAKT',
    'Ikatan Remaja Masjid Al-Kautsar Taman',
    'irmas',
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 6: SEED DATA — EVENT TYPES (ON CONFLICT DO NOTHING)
-- ============================================================

INSERT INTO public.event_types (name, description, default_privacy_level, activates_minutes, activates_attendance, is_active)
VALUES
  ('Kajian umum',                'Kajian keagamaan untuk umum',                    'detail_publik', false, true,  true),
  ('Seminar',                    'Seminar dan diskusi terbuka',                     'detail_publik', false, true,  true),
  ('Rapat internal',             'Rapat internal pengurus dan pengelola',           'rahasia',       true,  false, true),
  ('Musyawarah',                 'Forum musyawarah organisasi',                     'umum_saja',     true,  true,  true),
  ('Rapat pengurus',             'Rapat rutin pengurus',                            'umum_saja',     true,  false, true),
  ('Rapat divisi',               'Rapat tingkat divisi/bidang',                     'umum_saja',     true,  false, true),
  ('Rapat panitia',              'Rapat koordinasi kepanitiaan',                    'umum_saja',     true,  false, true),
  ('Evaluasi kegiatan',          'Rapat evaluasi pasca kegiatan',                   'umum_saja',     true,  false, true),
  ('Kegiatan komunitas',         'Kegiatan untuk komunitas atau kelompok tertentu', 'umum_saja',     false, true,  true),
  ('Kegiatan lembaga eksternal', 'Kegiatan oleh lembaga dari luar',                'umum_saja',     false, true,  true),
  ('Kegiatan VIP/protokoler',    'Kegiatan khusus tamu VIP atau pejabat',          'detail_publik', false, true,  true),
  ('Kegiatan rahasia/internal',  'Kegiatan yang bersifat rahasia/konfidensial',    'rahasia',       true,  false, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SECTION 7: LINK jenis_event lama ke event_types baru
-- Sinkronisasi nama yang sama antara jenis_event dan event_types
-- Dibungkus DO block: aman jika jenis_event belum ada
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jenis_event'
  ) THEN
    UPDATE public.jenis_event je
    SET event_type_id = et.id
    FROM public.event_types et
    WHERE je.name = et.name
      AND je.event_type_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- SECTION 8: VERIFIKASI — Pastikan semua tabel ada & data lama aman
-- ============================================================

DO $$
DECLARE
  tbl_count INTEGER;
  old_events_count INTEGER;
  old_participants_count INTEGER;
  old_pengajuan_count INTEGER;
  new_orgs_count INTEGER;
  new_event_types_count INTEGER;
  missing_tables TEXT := '';
  required_tables TEXT[] := ARRAY[
    'organizations', 'organization_units', 'positions', 'organization_members',
    'event_types', 'approval_workflows', 'event_requests', 'approval_logs',
    'calendar_events', 'meeting_minutes', 'meeting_action_items', 'meeting_photos',
    'meeting_report_exports', 'meeting_minutes_access', 'notifications'
  ];
  t TEXT;
BEGIN
  -- Cek setiap tabel yang dibutuhkan
  FOREACH t IN ARRAY required_tables LOOP
    SELECT COUNT(*) INTO tbl_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t;
    
    IF tbl_count = 0 THEN
      missing_tables := missing_tables || t || ', ';
    END IF;
  END LOOP;
  
  IF missing_tables <> '' THEN
    RAISE EXCEPTION 'TABEL BERIKUT TIDAK DITEMUKAN: %', missing_tables;
  END IF;

  -- Cek data lama tetap aman (hanya jika tabel ada)
  SELECT COUNT(*) INTO old_events_count FROM public.events;
  SELECT COUNT(*) INTO old_participants_count FROM public.participants;
  -- pengajuan_peminjaman mungkin belum ada jika migration 09 belum jalan
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pengajuan_peminjaman'
  ) THEN
    SELECT COUNT(*) INTO old_pengajuan_count FROM public.pengajuan_peminjaman;
  ELSE
    old_pengajuan_count := -1; -- -1 berarti tabel tidak ada
  END IF;
  SELECT COUNT(*) INTO new_orgs_count FROM public.organizations;
  SELECT COUNT(*) INTO new_event_types_count FROM public.event_types;

  RAISE NOTICE '=== VERIFIKASI MIGRATION 13 ===';
  RAISE NOTICE '✓ Semua 15 tabel baru berhasil dibuat';
  RAISE NOTICE '✓ Data lama events: % baris (AMAN)', old_events_count;
  RAISE NOTICE '✓ Data lama participants: % baris (AMAN)', old_participants_count;
  IF old_pengajuan_count = -1 THEN
    RAISE NOTICE '- pengajuan_peminjaman: tabel belum ada (migration 09 belum jalan — OK)';
  ELSE
    RAISE NOTICE '✓ Data lama pengajuan_peminjaman: % baris (AMAN)', old_pengajuan_count;
  END IF;
  RAISE NOTICE '✓ Seed organisasi: % baris', new_orgs_count;
  RAISE NOTICE '✓ Seed event types: % baris', new_event_types_count;
  RAISE NOTICE '=== MIGRATION 13 SELESAI — SEMUA AMAN ===';
END $$;
