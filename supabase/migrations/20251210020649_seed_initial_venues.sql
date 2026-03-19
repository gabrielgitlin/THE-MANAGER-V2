/*
  # Seed Initial Venues

  ## Overview
  This migration seeds the venues table with initial venue data from the existing application.

  ## Data Added
    - Madison Square Garden (New York, NY)
    - The Forum (Inglewood, CA)
    - Royal Albert Hall (London, UK)

  ## Important Notes
    1. These venues are marked as non-verified since they come from local data
    2. Usage count starts at 0
    3. Coordinates are preserved for map functionality
*/

INSERT INTO venues (name, address, city, state, country, capacity, website, latitude, longitude, is_verified, usage_count)
VALUES
  (
    'Madison Square Garden',
    '4 Pennsylvania Plaza',
    'New York',
    'NY',
    'United States',
    20000,
    'https://www.msg.com',
    40.7505,
    -73.9934,
    false,
    0
  ),
  (
    'The Forum',
    '3900 W Manchester Blvd',
    'Inglewood',
    'CA',
    'United States',
    17505,
    'https://www.msg.com/the-forum',
    33.9583,
    -118.3419,
    false,
    0
  ),
  (
    'Royal Albert Hall',
    'Kensington Gore',
    'London',
    '',
    'United Kingdom',
    5272,
    'https://www.royalalberthall.com',
    51.5009,
    -0.1774,
    false,
    0
  )
ON CONFLICT (google_place_id) DO NOTHING;