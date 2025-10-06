-- Create spreadsheet_uploads table
CREATE TABLE public.spreadsheet_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spreadsheet_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for spreadsheet_uploads
CREATE POLICY "Users can view their own uploads" 
ON public.spreadsheet_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" 
ON public.spreadsheet_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" 
ON public.spreadsheet_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for spreadsheets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('spreadsheets', 'spreadsheets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for spreadsheets
CREATE POLICY "Users can view their own spreadsheets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own spreadsheets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own spreadsheets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);