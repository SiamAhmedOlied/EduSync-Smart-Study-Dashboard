-- 1) Exams: add fields for mode, marks, and CSV paths
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('online','offline')) DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS marks integer,
  ADD COLUMN IF NOT EXISTS question_csv_path text,
  ADD COLUMN IF NOT EXISTS answer_csv_path text;

-- 2) Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_path text,
  achieved_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their achievements"
ON public.achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their achievements"
ON public.achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their achievements"
ON public.achievements FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their achievements"
ON public.achievements FOR DELETE
USING (auth.uid() = user_id);

-- 3) Diaries table
CREATE TABLE IF NOT EXISTS public.diaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  date date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their diaries"
ON public.diaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their diaries"
ON public.diaries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their diaries"
ON public.diaries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their diaries"
ON public.diaries FOR DELETE
USING (auth.uid() = user_id);

-- 4) Timestamps trigger function already exists: public.update_updated_at_column
--    Add triggers for automatic updated_at
CREATE TRIGGER IF NOT EXISTS update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_diaries_updated_at
BEFORE UPDATE ON public.diaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Extend users profile fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS class text,
  ADD COLUMN IF NOT EXISTS roll text,
  ADD COLUMN IF NOT EXISTS profile_pic_path text,
  ADD COLUMN IF NOT EXISTS department text;

-- 6) Storage buckets for documents & media (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files','exam-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('achievements','achievements', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents','documents', false)
ON CONFLICT (id) DO NOTHING;

-- 7) Storage policies: user-owned paths like <user_id>/<filename>
-- Exam files
CREATE POLICY IF NOT EXISTS "Exam files are viewable by owner"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exam-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can upload their own exam files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exam-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own exam files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exam-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own exam files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exam-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Achievements images
CREATE POLICY IF NOT EXISTS "Achievement images are viewable by owner"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'achievements'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can upload their own achievement images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'achievements'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own achievement images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'achievements'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own achievement images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'achievements'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- General documents (notes attachments, etc.)
CREATE POLICY IF NOT EXISTS "Documents are viewable by owner"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);