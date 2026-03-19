/*
  # Seed Default Show Types
  
  1. Data
    - Adds default show types to the `show_types` table
    - Includes common show types: Club Show, Festival, Theater, Private Event, etc.
    - Each type has a description and sort order for logical organization
  
  2. Notes
    - Uses INSERT with ON CONFLICT to safely add types without duplicates
    - All types are active by default
*/

INSERT INTO show_types (id, name, description, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'Club Show', 'Standard club or venue performance', 1, true),
  (gen_random_uuid(), 'Festival', 'Music festival performance', 2, true),
  (gen_random_uuid(), 'Theater', 'Theater or concert hall performance', 3, true),
  (gen_random_uuid(), 'Private Event', 'Private party or corporate event', 4, true),
  (gen_random_uuid(), 'Arena', 'Large arena or stadium performance', 5, true),
  (gen_random_uuid(), 'Opening Act', 'Supporting act for another artist', 6, true),
  (gen_random_uuid(), 'Residency', 'Regular recurring performance at a venue', 7, true)
ON CONFLICT DO NOTHING;
