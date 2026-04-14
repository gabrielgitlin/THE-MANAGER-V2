-- Add updated_at trigger to contact_payment_info
DROP TRIGGER IF EXISTS payment_info_updated_at ON contact_payment_info;
CREATE TRIGGER payment_info_updated_at
  BEFORE UPDATE ON contact_payment_info FOR EACH ROW
  EXECUTE FUNCTION contacts_set_updated_at();

-- Performance indexes for RLS and common queries
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contact_payment_info_contact_id_idx ON contact_payment_info(contact_id);
CREATE INDEX IF NOT EXISTS contact_files_contact_id_idx ON contact_files(contact_id);
