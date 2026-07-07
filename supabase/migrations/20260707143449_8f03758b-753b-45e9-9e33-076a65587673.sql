CREATE TABLE public.wedding_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_profiles TO authenticated;
GRANT ALL ON public.wedding_profiles TO service_role;
ALTER TABLE public.wedding_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own wedding profile" ON public.wedding_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_wedding_profiles_updated_at BEFORE UPDATE ON public.wedding_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();