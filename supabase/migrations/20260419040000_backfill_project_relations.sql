-- Backfill project_relations from legacy artist_contacts.
-- 34 albums had non-empty artist_contacts; 31 were proper jsonb arrays (3 were scalar strings, skipped).
-- Only albums where artist_contacts is a jsonb array, artist_id is set, and the contact_id is a valid UUID
-- that exists in the contacts table are included.
INSERT INTO project_relations (workspace_id, project_id, contact_id, role, is_primary, notes)
SELECT DISTINCT
  art.workspace_id,
  src.project_id,
  src.contact_id,
  'other',
  false,
  'Migrated from legacy artist_contacts'
FROM (
  SELECT
    a.artist_id AS project_id,
    (tag->>'id')::uuid AS contact_id
  FROM albums a,
    jsonb_array_elements(a.artist_contacts) tag
  WHERE a.artist_contacts <> '[]'::jsonb
    AND a.artist_contacts IS NOT NULL
    AND jsonb_typeof(a.artist_contacts) = 'array'
    AND a.artist_id IS NOT NULL
    AND tag->>'id' IS NOT NULL
) src
JOIN artists art ON art.id = src.project_id
JOIN contacts c ON c.id = src.contact_id
WHERE NOT EXISTS (
  SELECT 1 FROM project_relations pr
  WHERE pr.project_id = src.project_id
    AND pr.contact_id = src.contact_id
);
