/*
  # Seed Live Section with Mock Data

  ## Overview
  Creates realistic mock data for the Live section to demonstrate functionality:
  - Multiple shows across different venues and dates
  - Transportation between show locations
  - Accommodation bookings for each show
  - Calendar events for releases and other activities

  ## Mock Data Included
  1. Shows (10 shows across various cities)
  2. Transportation (flights, buses between venues)
  3. Accommodations (hotel bookings for each show)
  4. Calendar Events (releases, meetings, rehearsals)

  ## Notes
  - Uses a mock artist_id (first artist in the artists table or creates one)
  - All dates are set to future dates for demo purposes
  - Realistic venue names, cities, and logistics
*/

-- First, ensure we have an artist to associate with shows
DO $$
DECLARE
  mock_artist_id uuid;
BEGIN
  -- Try to get the first artist
  SELECT id INTO mock_artist_id FROM artists LIMIT 1;

  -- If no artist exists, create a mock one
  IF mock_artist_id IS NULL THEN
    INSERT INTO artists (name, bio, genre, image_url)
    VALUES (
      'The Velvet Echo',
      'An indie rock band known for their atmospheric sound and captivating live performances.',
      'Indie Rock',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
    )
    RETURNING id INTO mock_artist_id;
  END IF;

  -- Insert Shows
  INSERT INTO shows (id, artist_id, title, venue_name, venue_city, venue_country, date, doors_time, show_time, capacity, ticket_price, guarantee, status, notes)
  VALUES
    -- Spring 2025 Tour
    (gen_random_uuid(), mock_artist_id, 'The Fillmore', 'The Fillmore', 'San Francisco', 'United States', '2025-03-15', '19:00', '20:00', 1200, 45.00, 15000.00, 'confirmed', 'Opening night of spring tour'),
    (gen_random_uuid(), mock_artist_id, 'The Wiltern', 'The Wiltern', 'Los Angeles', 'United States', '2025-03-17', '19:00', '20:00', 1850, 45.00, 20000.00, 'confirmed', 'Sold out show'),
    (gen_random_uuid(), mock_artist_id, 'Brooklyn Steel', 'Brooklyn Steel', 'Brooklyn', 'United States', '2025-03-22', '19:30', '20:30', 1800, 50.00, 18000.00, 'confirmed', 'NYC debut'),
    (gen_random_uuid(), mock_artist_id, 'The Riviera Theatre', 'The Riviera Theatre', 'Chicago', 'United States', '2025-03-25', '19:00', '20:00', 2500, 42.00, 16000.00, 'confirmed', 'Midwest stop'),

    -- Summer 2025 Festival Season
    (gen_random_uuid(), mock_artist_id, 'Red Rocks Amphitheatre', 'Red Rocks Amphitheatre', 'Morrison', 'United States', '2025-06-08', '18:00', '19:30', 9525, 65.00, 50000.00, 'confirmed', 'Dream venue - bucket list show'),
    (gen_random_uuid(), mock_artist_id, 'Lollapalooza', 'Grant Park', 'Chicago', 'United States', '2025-08-02', '17:00', '18:00', 100000, 0, 75000.00, 'confirmed', 'Festival appearance - mainstage'),

    -- Fall 2025 European Tour
    (gen_random_uuid(), mock_artist_id, 'O2 Shepherd''s Bush Empire', 'O2 Shepherd''s Bush Empire', 'London', 'United Kingdom', '2025-09-15', '19:00', '20:00', 2000, 35.00, 25000.00, 'confirmed', 'European tour kickoff'),
    (gen_random_uuid(), mock_artist_id, 'Bataclan', 'Bataclan', 'Paris', 'France', '2025-09-18', '19:30', '20:30', 1500, 38.00, 22000.00, 'confirmed', 'Historic venue'),
    (gen_random_uuid(), mock_artist_id, 'Paradiso', 'Paradiso', 'Amsterdam', 'Netherlands', '2025-09-21', '20:00', '21:00', 1500, 35.00, 20000.00, 'pending', 'Waiting on final confirmation'),
    (gen_random_uuid(), mock_artist_id, 'Columbiahalle', 'Columbiahalle', 'Berlin', 'Germany', '2025-09-24', '19:00', '20:00', 3500, 40.00, 28000.00, 'confirmed', 'Largest EU show');

END $$;

-- Insert Transportation
DO $$
DECLARE
  show_sf_id uuid;
  show_la_id uuid;
  show_ny_id uuid;
  show_chi_id uuid;
  show_red_rocks_id uuid;
  show_london_id uuid;
  show_paris_id uuid;
  show_amsterdam_id uuid;
  show_berlin_id uuid;
BEGIN
  -- Get show IDs
  SELECT id INTO show_sf_id FROM shows WHERE venue_city = 'San Francisco' AND date = '2025-03-15';
  SELECT id INTO show_la_id FROM shows WHERE venue_city = 'Los Angeles' AND date = '2025-03-17';
  SELECT id INTO show_ny_id FROM shows WHERE venue_city = 'Brooklyn' AND date = '2025-03-22';
  SELECT id INTO show_chi_id FROM shows WHERE venue_city = 'Chicago' AND date = '2025-03-25';
  SELECT id INTO show_red_rocks_id FROM shows WHERE venue_city = 'Morrison' AND date = '2025-06-08';
  SELECT id INTO show_london_id FROM shows WHERE venue_city = 'London' AND date = '2025-09-15';
  SELECT id INTO show_paris_id FROM shows WHERE venue_city = 'Paris' AND date = '2025-09-18';
  SELECT id INTO show_amsterdam_id FROM shows WHERE venue_city = 'Amsterdam' AND date = '2025-09-21';
  SELECT id INTO show_berlin_id FROM shows WHERE venue_city = 'Berlin' AND date = '2025-09-24';

  -- Spring Tour Transportation
  INSERT INTO transportation (show_id, type, departure_location, arrival_location, departure_time, arrival_time, cost, confirmation_number, notes)
  VALUES
    -- To San Francisco (opening show)
    (show_sf_id, 'Flight', 'Los Angeles (LAX)', 'San Francisco (SFO)', '2025-03-15 08:00:00-08', '2025-03-15 09:30:00-08', 1200.00, 'UA1234', 'Morning flight for sound check'),

    -- SF to LA
    (show_la_id, 'Tour Bus', 'San Francisco', 'Los Angeles', '2025-03-16 10:00:00-08', '2025-03-16 16:00:00-08', 800.00, 'BUS-001', 'Scenic coastal route'),

    -- LA to NYC
    (show_ny_id, 'Flight', 'Los Angeles (LAX)', 'New York (JFK)', '2025-03-21 07:00:00-08', '2025-03-21 15:30:00-05', 2400.00, 'AA567', 'Cross-country flight - business class'),

    -- NYC to Chicago
    (show_chi_id, 'Flight', 'New York (JFK)', 'Chicago (ORD)', '2025-03-24 14:00:00-05', '2025-03-24 16:00:00-06', 1500.00, 'UA890', 'Short flight'),

    -- To Red Rocks (Summer)
    (show_red_rocks_id, 'Flight', 'Los Angeles (LAX)', 'Denver (DEN)', '2025-06-07 10:00:00-08', '2025-06-07 13:30:00-07', 1800.00, 'SW234', 'Day before show arrival'),
    (show_red_rocks_id, 'Van Rental', 'Denver Airport', 'Morrison', '2025-06-07 14:30:00-07', '2025-06-07 15:00:00-07', 200.00, 'HERTZ-789', 'Band and crew transport'),

    -- European Tour Transportation
    (show_london_id, 'Flight', 'Los Angeles (LAX)', 'London (LHR)', '2025-09-14 18:00:00-08', '2025-09-15 12:00:00+01', 5000.00, 'BA282', 'Overnight to London'),

    -- London to Paris
    (show_paris_id, 'Train', 'London St Pancras', 'Paris Gare du Nord', '2025-09-17 10:00:00+01', '2025-09-17 13:30:00+02', 600.00, 'EURO-456', 'Eurostar - comfortable ride'),

    -- Paris to Amsterdam
    (show_amsterdam_id, 'Train', 'Paris Gare du Nord', 'Amsterdam Centraal', '2025-09-20 09:00:00+02', '2025-09-20 12:30:00+02', 500.00, 'THAL-789', 'Thalys high-speed train'),

    -- Amsterdam to Berlin
    (show_berlin_id, 'Flight', 'Amsterdam (AMS)', 'Berlin (BER)', '2025-09-23 15:00:00+02', '2025-09-23 16:30:00+02', 400.00, 'KL1234', 'Quick flight');

END $$;

-- Insert Accommodations
DO $$
DECLARE
  show_sf_id uuid;
  show_la_id uuid;
  show_ny_id uuid;
  show_chi_id uuid;
  show_red_rocks_id uuid;
  show_london_id uuid;
  show_paris_id uuid;
  show_amsterdam_id uuid;
  show_berlin_id uuid;
BEGIN
  -- Get show IDs
  SELECT id INTO show_sf_id FROM shows WHERE venue_city = 'San Francisco' AND date = '2025-03-15';
  SELECT id INTO show_la_id FROM shows WHERE venue_city = 'Los Angeles' AND date = '2025-03-17';
  SELECT id INTO show_ny_id FROM shows WHERE venue_city = 'Brooklyn' AND date = '2025-03-22';
  SELECT id INTO show_chi_id FROM shows WHERE venue_city = 'Chicago' AND date = '2025-03-25';
  SELECT id INTO show_red_rocks_id FROM shows WHERE venue_city = 'Morrison' AND date = '2025-06-08';
  SELECT id INTO show_london_id FROM shows WHERE venue_city = 'London' AND date = '2025-09-15';
  SELECT id INTO show_paris_id FROM shows WHERE venue_city = 'Paris' AND date = '2025-09-18';
  SELECT id INTO show_amsterdam_id FROM shows WHERE venue_city = 'Amsterdam' AND date = '2025-09-21';
  SELECT id INTO show_berlin_id FROM shows WHERE venue_city = 'Berlin' AND date = '2025-09-24';

  INSERT INTO accommodations (show_id, hotel_name, address, check_in_date, check_out_date, rooms, cost, confirmation_number, notes)
  VALUES
    -- Spring Tour
    (show_sf_id, 'Hotel Zephyr', '250 Beach Street, San Francisco, CA 94133', '2025-03-15', '2025-03-16', 5, 1200.00, 'HZ-123456', 'Waterfront location, close to venue'),
    (show_la_id, 'The LINE Hotel', '3515 Wilshire Blvd, Los Angeles, CA 90010', '2025-03-16', '2025-03-18', 5, 1400.00, 'LINE-789012', 'Walking distance to venue'),
    (show_ny_id, 'The William Vale', '111 N 12th St, Brooklyn, NY 11249', '2025-03-21', '2025-03-23', 6, 2100.00, 'WV-345678', 'Brooklyn hotel with rooftop views'),
    (show_chi_id, 'The Hoxton Chicago', '200 N Green St, Chicago, IL 60607', '2025-03-24', '2025-03-26', 5, 1300.00, 'HOX-901234', 'Trendy hotel in West Loop'),

    -- Summer
    (show_red_rocks_id, 'The Maven Hotel', '1850 Wazee St, Denver, CO 80202', '2025-06-07', '2025-06-09', 6, 1800.00, 'MAV-567890', 'Modern hotel in downtown Denver'),

    -- European Tour
    (show_london_id, 'The Hoxton Shoreditch', '81 Great Eastern St, London EC2A 3HU', '2025-09-15', '2025-09-17', 6, 1600.00, 'HOX-UK-123', 'Central London location'),
    (show_paris_id, 'Hotel Fabric', '31 Rue de la Folie Méricourt, 75011 Paris', '2025-09-17', '2025-09-20', 6, 1800.00, 'FABRIC-456', 'Boutique hotel in Le Marais'),
    (show_amsterdam_id, 'The Hoxton Amsterdam', 'Herengracht 255, 1016 BJ Amsterdam', '2025-09-20', '2025-09-23', 6, 1700.00, 'HOX-AMS-789', 'Canal-side location'),
    (show_berlin_id, 'Hotel Oderberger', 'Oderberger Str. 57, 10435 Berlin', '2025-09-23', '2025-09-25', 6, 1500.00, 'ODER-012', 'Historic building with pool');

END $$;

-- Insert Calendar Events (for the authenticated user)
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user ID
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Only insert calendar events if we have a user
  IF first_user_id IS NOT NULL THEN
    INSERT INTO calendar_events (user_id, title, description, event_type, start_date, start_time, end_date, end_time, location, color)
    VALUES
      -- Album releases and promo
      (first_user_id, 'New Single Release', 'Release "Midnight Waves" on all platforms', 'release', '2025-02-14', '00:00', '2025-02-14', '23:59', 'Digital Release', '#10B981'),
      (first_user_id, 'Album Release Day', 'Full album "Echo Chamber" drops worldwide', 'release', '2025-04-04', '00:00', '2025-04-04', '23:59', 'Digital Release', '#10B981'),

      -- Rehearsals and prep
      (first_user_id, 'Tour Rehearsals Begin', 'Start rehearsing for spring tour at Sound City Studios', 'accommodation', '2025-03-01', '10:00', '2025-03-12', '18:00', 'Sound City Studios, Los Angeles', '#F59E0B'),
      (first_user_id, 'Production Meeting', 'Meet with lighting and stage designers', 'accommodation', '2025-03-05', '14:00', '2025-03-05', '16:00', 'Production Office, LA', '#6366F1'),

      -- Press and Media
      (first_user_id, 'NPR Tiny Desk Concert', 'Record Tiny Desk performance', 'show', '2025-03-20', '14:00', '2025-03-20', '16:00', 'NPR Studios, Washington DC', '#EF4444'),
      (first_user_id, 'Rolling Stone Interview', 'Feature interview and photoshoot', 'accommodation', '2025-03-23', '10:00', '2025-03-23', '15:00', 'Rolling Stone HQ, NYC', '#8B5CF6'),

      -- Other events
      (first_user_id, 'Coachella Rehearsal', 'Stage rehearsal at Coachella', 'show', '2025-04-10', '09:00', '2025-04-10', '12:00', 'Empire Polo Club, Indio, CA', '#EC4899'),
      (first_user_id, 'Music Video Shoot', 'Shoot video for "Neon Lights"', 'accommodation', '2025-05-15', '08:00', '2025-05-16', '20:00', 'Joshua Tree, CA', '#14B8A6'),

      -- Summer prep
      (first_user_id, 'Festival Circuit Planning', 'Plan summer festival schedule with booking agent', 'accommodation', '2025-05-20', '11:00', '2025-05-20', '13:00', 'Virtual Meeting', '#6366F1'),

      -- Fall tour prep
      (first_user_id, 'EU Tour Production Meeting', 'Final logistics for European tour', 'accommodation', '2025-08-25', '10:00', '2025-08-25', '17:00', 'Management Office, LA', '#F59E0B');
  END IF;
END $$;
