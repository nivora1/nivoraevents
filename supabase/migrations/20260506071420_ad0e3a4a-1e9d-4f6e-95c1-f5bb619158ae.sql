
-- Vendor application status enum
CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.vendor_service AS ENUM ('photography', 'catering');

-- Vendors table
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  vendor_name text NOT NULL,
  slug text UNIQUE,
  service_type vendor_service NOT NULL,
  description text DEFAULT '',
  short_description text DEFAULT '',
  price_range text DEFAULT '',
  services_included jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  menu jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience text,
  location text,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  social text,
  status vendor_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved vendors viewable by everyone"
  ON public.vendors FOR SELECT
  USING (status = 'approved' OR auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can submit vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their vendors"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vendors"
  ON public.vendors FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE INDEX idx_vendors_service_type ON public.vendors(service_type);

-- Event plans
CREATE TABLE public.event_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Event Plan',
  vendor_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plans" ON public.event_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON public.event_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON public.event_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans" ON public.event_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_event_plans_updated_at
  BEFORE UPDATE ON public.event_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for vendor images
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-images', 'vendor-images', true);

CREATE POLICY "Vendor images publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated users can upload vendor images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own vendor images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vendor-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own vendor images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vendor-images' AND auth.uid()::text = (storage.foldername(name))[1]);
