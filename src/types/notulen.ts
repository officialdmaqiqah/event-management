export type MeetingMinutes = {
  id: string;
  pengajuan_id: string;
  meeting_title: string;
  meeting_type: string | null;
  meeting_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  chairperson_name: string | null;
  secretary_name: string | null;
  agenda: string | null;
  discussion_summary: string | null;
  decisions: string | null;
  important_notes: string | null;
  status: 'draft' | 'finalized';
  privacy_level: 'public' | 'internal' | 'restricted' | 'confidential';
  is_published: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MeetingActionItem = {
  id: string;
  meeting_minutes_id: string;
  description: string;
  assignee_name: string | null;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'done';
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MeetingPhoto = {
  id: string;
  meeting_minutes_id: string;
  photo_url: string;
  caption: string | null;
  visibility: 'public' | 'internal' | 'confidential';
  created_at?: string;
}
