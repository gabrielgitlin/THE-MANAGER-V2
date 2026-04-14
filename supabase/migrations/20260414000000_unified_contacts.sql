-- supabase/migrations/20260414000000_unified_contacts.sql

-- ─── contacts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category              TEXT NOT NULL CHECK (category IN ('collaborator','crew','business','other')),
  role                  TEXT,
  first_name            TEXT NOT NULL DEFAULT '',
  last_name             TEXT NOT NULL DEFAULT '',
  profile_photo_url     TEXT,
  email                 TEXT,
  phone                 TEXT,
  website               TEXT,
  home_airport          TEXT,
  seating_preference    TEXT CHECK (seating_preference IN ('window','aisle','middle','no_preference')),
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  country               TEXT,
  postal_code           TEXT,
  social_links          JSONB NOT NULL DEFAULT '{}',
  pro_affiliations      JSONB NOT NULL DEFAULT '[]',
  publisher_affiliations JSONB NOT NULL DEFAULT '[]',
  bio                   TEXT,
  notes                 TEXT,
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update" ON contacts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_delete" ON contacts FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION contacts_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts FOR EACH ROW
  EXECUTE FUNCTION contacts_set_updated_at();

-- ─── contact_payment_info ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_payment_info (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id           UUID NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name            TEXT,
  account_holder_name  TEXT,
  routing_number       TEXT,
  account_number       TEXT,
  account_type         TEXT CHECK (account_type IN ('checking','savings')),
  swift_code           TEXT,
  iban                 TEXT,
  bank_address         TEXT,
  paypal_email         TEXT,
  venmo_handle         TEXT,
  zelle_contact        TEXT,
  tax_id               TEXT,
  w9_on_file           BOOLEAN NOT NULL DEFAULT FALSE,
  w9_file_url          TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_payment_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_info_all" ON contact_payment_info
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── contact_files ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL DEFAULT '',
  file_path   TEXT NOT NULL,
  file_size   INTEGER,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_files_all" ON contact_files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('contact-photos', 'contact-photos', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('contact-files',  'contact-files',  false, 26214400, NULL)
ON CONFLICT (id) DO NOTHING;

-- contact-photos: public read, owner write
CREATE POLICY "contact_photos_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'contact-photos');
CREATE POLICY "contact_photos_owner_insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "contact_photos_owner_update"  ON storage.objects FOR UPDATE USING  (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "contact_photos_owner_delete"  ON storage.objects FOR DELETE USING  (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- contact-files: private, owner only
CREATE POLICY "contact_files_owner_all" ON storage.objects
  FOR ALL USING  (bucket_id = 'contact-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK     (bucket_id = 'contact-files' AND auth.uid()::text = (storage.foldername(name))[1]);
