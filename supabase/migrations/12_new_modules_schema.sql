-- ============================================================
-- Migration 12: Modul Baru MAKT — Additive Only
-- Tidak DROP, tidak RENAME tabel lama.
-- Semua kolom baru di tabel lama = NULLABLE (aman untuk data existing)
-- ============================================================

-- ============================================================
-- SECTION 0: ENUMS BARU
-- ============================================================

-- Tipe organisasi
DO $$ BEGIN
  CREATE TYPE org_type AS ENUM ('dkm', 'pemuda', 'irmas', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe unit organisasi
DO $$ BEGIN
  CREATE TYPE org_unit_type AS ENUM (
    'dewan', 'badan_pelaksana', 'bidang', 'divisi',
    'pimpinan_harian', 'pembina', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Keputusan approval
DO $$ BEGIN
  CREATE TYPE approval_decision AS ENUM ('approve', 'reject', 'request_revision');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Level privasi (lebih generik dari privacy_event existing)
DO $$ BEGIN
  CREATE TYPE privacy_level_type AS ENUM (
    'detail_publik', 'umum_saja', 'rahasia'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Scope privasi notulen
DO $$ BEGIN
  CREATE TYPE privacy_scope_type AS ENUM (
    'public', 'organization_internal', 'makt_internal', 'restricted', 'confidential'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Status notulen
DO $$ BEGIN
  CREATE TYPE minutes_status AS ENUM ('draft', 'finalized');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe channel notifikasi
DO $$ BEGIN
  CREATE TYPE notif_channel AS ENUM ('whatsapp', 'email', 'in_app');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Status notifikasi
DO $$ BEGIN
  CREATE TYPE notif_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Status action item
DO $$ BEGIN
  CREATE TYPE action_item_status AS ENUM ('pending', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Visibility foto
DO $$ BEGIN
  CREATE TYPE photo_visibility AS ENUM ('public', 'internal', 'confidential');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe file export
DO $$ BEGIN
  CREATE TYPE export_file_type AS ENUM ('pdf', 'docx');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe akses notulen
DO $$ BEGIN
  CREATE TYPE minutes_access_type AS ENUM ('view', 'comment', 'approve', 'publish');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Status event request (lebih generik dari pengajuan_status existing)
DO $$ BEGIN
  CREATE TYPE event_request_status AS ENUM (
    'draft', 'submitted', 'under_review',
    'revision_requested', 'approved', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe requester event request
DO $$ BEGIN
  CREATE TYPE requester_type AS ENUM ('pribadi', 'lembaga', 'komunitas', 'instansi', 'internal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tipe kehadiran
DO $$ BEGIN
  CREATE TYPE attendance_type AS ENUM ('internal', 'event', 'public');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- SECTION 1: ORGANIZATIONS
-- ============================================================
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

CREATE TRIGGER set_timestamp_organizations
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 2: ORGANIZATION_UNITS
-- ============================================================
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

CREATE TRIGGER set_timestamp_org_units
BEFORE UPDATE ON public.organization_units
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 3: POSITIONS
-- ============================================================
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

CREATE TRIGGER set_timestamp_positions
BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 4: ORGANIZATION_MEMBERS
-- ============================================================
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

CREATE TRIGGER set_timestamp_org_members
BEFORE UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 5: EVENT_TYPES (Pengganti/Superset dari jenis_event)
-- Tidak drop jenis_event — tetap ada untuk backward compat
-- ============================================================
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

CREATE TRIGGER set_timestamp_event_types
BEFORE UPDATE ON public.event_types
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Link jenis_event lama ke event_types baru (nullable, additive)
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

-- ============================================================
-- SECTION 6: APPROVAL_WORKFLOWS (Superset dari workflow_approval)
-- Tidak drop workflow_approval lama
-- ============================================================
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
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_type_id, level_order)
);

CREATE TRIGGER set_timestamp_approval_workflows
BEFORE UPDATE ON public.approval_workflows
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 7: EVENT_REQUESTS (Superset dari pengajuan_peminjaman)
-- Tidak drop pengajuan_peminjaman lama
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relasi organisasi (opsional, untuk request internal)
  organization_id         UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id    UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  responsible_member_id   UUID REFERENCES public.organization_members(id) ON DELETE SET NULL,

  -- Data Pemohon
  requester_type          requester_type NOT NULL DEFAULT 'pribadi',
  requester_name          TEXT NOT NULL,
  institution_name        TEXT,
  whatsapp                TEXT NOT NULL,
  email                   TEXT,
  address                 TEXT,

  -- Data Event
  event_name              TEXT NOT NULL,
  event_type_id           UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
  purpose                 TEXT,
  description             TEXT,
  participant_estimate    INTEGER,
  start_datetime          TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime            TIMESTAMP WITH TIME ZONE,
  facility_area           TEXT[] DEFAULT '{}',
  additional_needs        TEXT,

  -- Lampiran
  attachment_letter_url   TEXT,
  attachment_proposal_url TEXT,

  -- Status & Workflow
  status                  event_request_status NOT NULL DEFAULT 'submitted',
  current_approval_level  INTEGER DEFAULT 1,
  privacy_level           privacy_level_type NOT NULL DEFAULT 'umum_saja',

  -- Audit
  submitted_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_event_requests
BEFORE UPDATE ON public.event_requests
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Link pengajuan_peminjaman lama ke event_requests baru (nullable, additive)
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

-- ============================================================
-- SECTION 8: APPROVAL_LOGS (Superset dari pengajuan_approvals)
-- Tidak drop pengajuan_approvals lama
-- ============================================================
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

CREATE TRIGGER set_timestamp_approval_logs
BEFORE UPDATE ON public.approval_logs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 9: CALENDAR_EVENTS
-- ============================================================
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

CREATE TRIGGER set_timestamp_calendar_events
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 10: MEETING_MINUTES (Notulen Rapat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relasi ke event/request (semua nullable)
  event_id             UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_request_id     UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,

  -- Informasi Rapat
  meeting_title        TEXT NOT NULL,
  meeting_type         TEXT,
  meeting_date         DATE NOT NULL,
  start_time           TIME,
  end_time             TIME,
  location             TEXT,
  chairperson_name     TEXT,
  secretary_name       TEXT,

  -- Konten Notulen
  agenda               TEXT,
  discussion_summary   TEXT,
  decisions            TEXT,
  important_notes      TEXT,

  -- Status & Privasi
  status               minutes_status NOT NULL DEFAULT 'draft',
  privacy_level        TEXT NOT NULL DEFAULT 'internal',
  privacy_scope        privacy_scope_type NOT NULL DEFAULT 'organization_internal',
  is_published         BOOLEAN NOT NULL DEFAULT false,
  published_at         TIMESTAMP WITH TIME ZONE,
  published_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Audit
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_meeting_minutes
BEFORE UPDATE ON public.meeting_minutes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 11: MEETING_ACTION_ITEMS
-- ============================================================
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

CREATE TRIGGER set_timestamp_action_items
BEFORE UPDATE ON public.meeting_action_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 12: MEETING_PHOTOS
-- ============================================================
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

CREATE TRIGGER set_timestamp_meeting_photos
BEFORE UPDATE ON public.meeting_photos
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 13: MEETING_REPORT_EXPORTS
-- ============================================================
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

CREATE TRIGGER set_timestamp_report_exports
BEFORE UPDATE ON public.meeting_report_exports
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 14: MEETING_MINUTES_ACCESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_minutes_access (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minutes_id   UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  organization_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_unit_id UUID REFERENCES public.organization_units(id) ON DELETE SET NULL,
  role_id              UUID,                 -- placeholder untuk sistem role masa depan
  position_id          UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type          minutes_access_type NOT NULL DEFAULT 'view',
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_minutes_access
BEFORE UPDATE ON public.meeting_minutes_access
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 15: NOTIFICATIONS
-- ============================================================
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

CREATE TRIGGER set_timestamp_notifications
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SECTION 16: UPDATE TABEL LAMA (ADDITIVE ONLY)
-- Semua kolom baru NULLABLE — tidak merusak data existing
-- ============================================================

-- Update participants: tambah attendance fields
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendance_type  attendance_type DEFAULT 'event';

-- Update events: tambah relasi ke event_request
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL;

-- ============================================================
-- SECTION 17: ROW LEVEL SECURITY
-- ============================================================

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat organisasi aktif" ON public.organizations
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola organisasi" ON public.organizations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Organization Units
ALTER TABLE public.organization_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat unit aktif" ON public.organization_units
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola unit" ON public.organization_units
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat posisi aktif" ON public.positions
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola posisi" ON public.positions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat member aktif" ON public.organization_members
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola member" ON public.organization_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Event Types
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat event types aktif" ON public.event_types
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola event types" ON public.event_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Approval Workflows
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat workflow aktif" ON public.approval_workflows
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin bisa kelola approval workflows" ON public.approval_workflows
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Event Requests
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa submit event request" ON public.event_requests
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public bisa lihat event request" ON public.event_requests
  FOR SELECT TO public USING (true);
CREATE POLICY "Admin bisa kelola event requests" ON public.event_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Approval Logs
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat approval logs" ON public.approval_logs
  FOR SELECT TO public USING (true);
CREATE POLICY "Admin bisa kelola approval logs" ON public.approval_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat calendar events publik" ON public.calendar_events
  FOR SELECT TO public USING (is_public = true);
CREATE POLICY "Admin bisa kelola calendar events" ON public.calendar_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting Minutes
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat notulen yang dipublikasikan" ON public.meeting_minutes
  FOR SELECT TO public USING (is_published = true AND privacy_scope = 'public');
CREATE POLICY "Admin bisa kelola semua notulen" ON public.meeting_minutes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting Action Items
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bisa kelola action items" ON public.meeting_action_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting Photos
ALTER TABLE public.meeting_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public bisa lihat foto publik" ON public.meeting_photos
  FOR SELECT TO public USING (visibility = 'public');
CREATE POLICY "Admin bisa kelola foto" ON public.meeting_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting Report Exports
ALTER TABLE public.meeting_report_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bisa kelola exports" ON public.meeting_report_exports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting Minutes Access
ALTER TABLE public.meeting_minutes_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin bisa kelola akses notulen" ON public.meeting_minutes_access
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User bisa lihat notifikasi miliknya" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "Admin bisa kelola notifikasi" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SECTION 18: INDEXES UNTUK PERFORMA
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_position_id ON public.organization_members(position_id);
CREATE INDEX IF NOT EXISTS idx_org_units_org_id ON public.organization_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_org_id ON public.positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_event_type ON public.approval_workflows(event_type_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON public.event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_org ON public.event_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_event_type ON public.event_requests(event_type_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_request ON public.approval_logs(event_request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_org ON public.meeting_minutes(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON public.meeting_minutes(meeting_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- ============================================================
-- SECTION 19: SEED DATA — ORGANISASI AWAL MAKT
-- ============================================================

-- Organisasi Utama: DKM / Badan Pengelola MAKT
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

-- Organisasi: Pemuda MAKT
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

-- Organisasi: Irmas MAKT
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
-- SECTION 20: SEED DATA — EVENT TYPES (Sinkronisasi dengan jenis_event)
-- ============================================================

INSERT INTO public.event_types (name, description, default_privacy_level, activates_minutes, activates_attendance, is_active)
VALUES
  ('Kajian umum',             'Kajian keagamaan untuk umum',                    'detail_publik', false, true,  true),
  ('Seminar',                 'Seminar dan diskusi terbuka',                     'detail_publik', false, true,  true),
  ('Rapat internal',          'Rapat internal pengurus dan pengelola',           'rahasia',       true,  false, true),
  ('Musyawarah',              'Forum musyawarah organisasi',                     'umum_saja',     true,  true,  true),
  ('Rapat pengurus',          'Rapat rutin pengurus',                            'umum_saja',     true,  false, true),
  ('Rapat divisi',            'Rapat tingkat divisi/bidang',                     'umum_saja',     true,  false, true),
  ('Rapat panitia',           'Rapat koordinasi kepanitiaan',                    'umum_saja',     true,  false, true),
  ('Evaluasi kegiatan',       'Rapat evaluasi pasca kegiatan',                   'umum_saja',     true,  false, true),
  ('Kegiatan komunitas',      'Kegiatan untuk komunitas atau kelompok tertentu', 'umum_saja',     false, true,  true),
  ('Kegiatan lembaga eksternal', 'Kegiatan oleh lembaga dari luar',              'umum_saja',     false, true,  true),
  ('Kegiatan VIP/protokoler', 'Kegiatan khusus tamu VIP atau pejabat',          'detail_publik', false, true,  true),
  ('Kegiatan rahasia/internal','Kegiatan yang bersifat rahasia/konfidensial',    'rahasia',       true,  false, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SECTION 21: VERIFIKASI — Query cek semua tabel terbuat
-- ============================================================

-- Uncomment baris berikut untuk verifikasi manual di SQL Editor Supabase:
-- SELECT tablename, schemaname
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
