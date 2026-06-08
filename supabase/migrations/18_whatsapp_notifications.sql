-- Migrasi ke-18: Sistem Notifikasi WhatsApp & Log

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_name TEXT NOT NULL,
    recipient_whatsapp TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, simulated_sent
    related_event_request_id UUID REFERENCES public.pengajuan_peminjaman(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view notification logs" ON public.notification_logs;
CREATE POLICY "Admin view notification logs" 
ON public.notification_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_org_roles
    WHERE user_org_roles.user_id = auth.uid()
    AND (user_org_roles.role IN ('super_admin', 'admin_makt', 'admin_organisasi', 'admin_event'))
  )
);

DROP POLICY IF EXISTS "System insert notification logs" ON public.notification_logs;
CREATE POLICY "System insert notification logs" 
ON public.notification_logs FOR INSERT 
WITH CHECK (true); -- Dibolehkan karena ini di-trigger dari backend (Service Role / API). Bisa diubah jika perlu.

DROP POLICY IF EXISTS "System update notification logs" ON public.notification_logs;
CREATE POLICY "System update notification logs" 
ON public.notification_logs FOR UPDATE 
USING (true);
