/*
  # Seed Show Details with Comprehensive Mock Data

  ## Overview
  Populates all show detail tables with realistic mock data for the 10 existing shows:
  - Deal information (guarantees, percentages, expenses, settlements)
  - Show advances (contacts, schedules, catering, parking)
  - Setlists (complete with 10-15 songs per show)
  - Guest lists (5-10 guests per show)
  - Marketing tasks (standard checklist items)
  - Production files (riders, stage plots, etc.)

  ## Mock Data Coverage
  - All 10 shows from the live section
  - Realistic financial data
  - Complete production information
  - Varied setlists
  - Diverse guest lists
  - Standard marketing checklists
  - Essential production documents
*/

DO $$
DECLARE
  v_show_ids uuid[];
  v_show_id uuid;
  v_setlist_id uuid;
  v_idx integer;
BEGIN
  -- Get all show IDs
  SELECT ARRAY_AGG(id ORDER BY date) INTO v_show_ids FROM shows;

  -- Loop through each show and add complete data
  FOR v_idx IN 1..array_length(v_show_ids, 1) LOOP
    v_show_id := v_show_ids[v_idx];

    -- Insert Show Deal
    INSERT INTO show_deals (show_id, deal_type, guarantee, percentage, expenses, settlement)
    VALUES (
      v_show_id,
      CASE v_idx % 3
        WHEN 0 THEN 'guarantee'
        WHEN 1 THEN 'percentage'
        ELSE 'guarantee_vs_percentage'
      END,
      (10000 + (v_idx * 5000))::numeric,
      CASE WHEN v_idx % 3 != 0 THEN 80 + (v_idx % 10) ELSE 0 END,
      jsonb_build_object(
        'production', (5000 + (v_idx * 1000))::numeric,
        'marketing', (2000 + (v_idx * 500))::numeric,
        'staffing', (3000 + (v_idx * 750))::numeric,
        'transportation', (1500 + (v_idx * 250))::numeric
      ),
      jsonb_build_object(
        'gross', (50000 + (v_idx * 10000))::numeric,
        'expenses', (11500 + (v_idx * 2500))::numeric,
        'net', (38500 + (v_idx * 7500))::numeric
      )
    );

    -- Insert Show Advances
    INSERT INTO show_advances (
      show_id,
      production_manager,
      venue_contact,
      schedule,
      catering,
      parking
    )
    VALUES (
      v_show_id,
      jsonb_build_object(
        'name', 'Sarah Mitchell',
        'email', 'sarah.mitchell@tourproduction.com',
        'phone', CASE v_idx WHEN 1 THEN '(555) 123-4567' WHEN 2 THEN '(555) 234-5678' WHEN 3 THEN '(555) 345-6789' WHEN 4 THEN '(555) 456-7890' WHEN 5 THEN '(555) 567-8901' WHEN 6 THEN '(555) 678-9012' WHEN 7 THEN '(555) 789-0123' WHEN 8 THEN '(555) 890-1234' WHEN 9 THEN '(555) 901-2345' ELSE '(555) 012-3456' END
      ),
      jsonb_build_object(
        'name', CASE v_idx WHEN 1 THEN 'John Martinez' WHEN 2 THEN 'Emily Chen' WHEN 3 THEN 'Michael Johnson' WHEN 4 THEN 'Lisa Anderson' WHEN 5 THEN 'David Brown' WHEN 6 THEN 'Sophie Taylor' WHEN 7 THEN 'James Wilson' WHEN 8 THEN 'Marie Dubois' WHEN 9 THEN 'Peter van der Berg' ELSE 'Klaus Schmidt' END,
        'email', CASE v_idx WHEN 1 THEN 'john@fillmore.com' WHEN 2 THEN 'emily@wiltern.com' WHEN 3 THEN 'michael@brooklynsteel.com' WHEN 4 THEN 'lisa@riviera.com' WHEN 5 THEN 'david@redrocks.com' WHEN 6 THEN 'sophie@lollapalooza.com' WHEN 7 THEN 'james@o2empire.co.uk' WHEN 8 THEN 'marie@bataclan.fr' WHEN 9 THEN 'peter@paradiso.nl' ELSE 'klaus@columbiahalle.de' END,
        'phone', CASE v_idx WHEN 1 THEN '(415) 346-6000' WHEN 2 THEN '(213) 388-1400' WHEN 3 THEN '(718) 291-8810' WHEN 4 THEN '(773) 275-6800' WHEN 5 THEN '(720) 865-2494' WHEN 6 THEN '(312) 235-7000' WHEN 7 THEN '+44 20 8354 3300' WHEN 8 THEN '+33 1 43 14 00 30' WHEN 9 THEN '+31 20 626 4521' ELSE '+49 30 698 08 960' END
      ),
      jsonb_build_object(
        'loadIn', '14:00',
        'soundcheck', '16:00',
        'doors', '19:00',
        'showtime', '20:00',
        'curfew', CASE WHEN v_idx <= 5 THEN '23:00' ELSE '23:30' END
      ),
      jsonb_build_object(
        'mealTimes', jsonb_build_object('lunch', '13:00', 'dinner', '17:30'),
        'requirements', 'Hot meal for band and crew (15 people). Vegetarian and vegan options required. Gluten-free options preferred.'
      ),
      jsonb_build_object(
        'trucks', '2 spaces',
        'buses', '1 space',
        'cars', '5 spaces',
        'location', 'Loading dock - contact venue 1 hour before arrival'
      )
    );

    -- Insert Setlist
    INSERT INTO setlists (show_id, status, notes, updated_by)
    VALUES (
      v_show_id,
      CASE WHEN v_idx <= 6 THEN 'final' ELSE 'proposed' END,
      CASE 
        WHEN v_idx = 1 THEN 'Opening night - include crowd favorites'
        WHEN v_idx = 5 THEN 'Red Rocks show - extend key songs for venue'
        WHEN v_idx = 6 THEN 'Festival set - shorter runtime'
        ELSE 'Standard touring setlist'
      END,
      'Tour Manager'
    )
    RETURNING id INTO v_setlist_id;

    -- Insert Setlist Songs (12-15 songs per show)
    INSERT INTO setlist_songs (setlist_id, position, song_title, duration, key, is_encore)
    SELECT 
      v_setlist_id,
      song_data.position,
      song_data.title,
      song_data.duration,
      song_data.key,
      song_data.is_encore
    FROM (VALUES
      (1, 'Opening Track', '3:45', 'E', false),
      (2, 'Electric Energy', '4:20', 'A', false),
      (3, 'Midnight Dreams', '5:15', 'D', false),
      (4, 'City Lights', '3:50', 'G', false),
      (5, 'Lost in Sound', '6:30', 'C', false),
      (6, 'Neon Waves', '4:45', 'F', false),
      (7, 'Rhythm of the Night', '5:00', 'Bb', false),
      (8, 'Echoes', '7:15', 'Am', false),
      (9, 'Silver Moon', '4:30', 'E', false),
      (10, 'Dance with Me', '3:55', 'D', false),
      (11, 'The Journey', '8:20', 'G', false),
      (12, 'Closing Time', '4:10', 'C', true),
      (13, 'One More Song', '3:30', 'A', true)
    ) AS song_data(position, title, duration, key, is_encore);

    -- Insert Guest List (varying number per show)
    INSERT INTO guest_list (show_id, name, type, quantity, requested_by, status, contact_info, notes)
    SELECT
      v_show_id,
      guest_data.name,
      guest_data.type,
      guest_data.quantity,
      guest_data.requested_by,
      guest_data.status,
      guest_data.contact_info,
      guest_data.notes
    FROM (VALUES
      ('Local Radio DJs', 'media', 2, 'Marketing Team', 'approved', 'promo@radiostation.com', 'Morning show hosts'),
      ('Venue Staff Guests', 'industry', 3, 'Venue', 'approved', '', 'Venue comp tickets'),
      ('Artist Family', 'friends_family', 4, 'Band', 'approved', '', 'Band member families'),
      ('Record Label Executives', 'industry', 2, 'Management', 'approved', 'execs@recordlabel.com', 'A&R and marketing'),
      ('Music Journalists', 'media', 2, 'Publicist', 'approved', 'press@magazine.com', 'Feature interview'),
      ('VIP Fan Contest Winners', 'vip', 2, 'Marketing Team', 'approved', 'winner@email.com', 'Social media contest'),
      ('Local Promoter', 'industry', 1, 'Booking Agent', 'approved', 'promoter@local.com', 'Relationship building'),
      ('Photography Team', 'media', 2, 'Management', 'approved', 'photo@studio.com', 'Tour documentary')
    ) AS guest_data(name, type, quantity, requested_by, status, contact_info, notes)
    LIMIT CASE WHEN v_idx % 2 = 0 THEN 8 ELSE 5 END;

    -- Insert Marketing Tasks (standard checklist)
    INSERT INTO marketing_tasks (show_id, task_key, label, completed, completed_at, completed_by)
    SELECT
      v_show_id,
      task_data.task_key,
      task_data.label,
      task_data.completed,
      CASE WHEN task_data.completed THEN (SELECT date FROM shows WHERE id = v_show_id) - INTERVAL '30 days' + (random() * INTERVAL '25 days') ELSE NULL END,
      CASE WHEN task_data.completed THEN 'Marketing Team' ELSE '' END
    FROM (VALUES
      ('announcement_email', 'Announcement Email Sent', true),
      ('marketing_email', 'Marketing Email Sent', CASE WHEN v_idx <= 7 THEN true ELSE false END),
      ('marketing_plan', 'Marketing Plan Received', true),
      ('facebook_event', 'Event added on Facebook', CASE WHEN v_idx <= 8 THEN true ELSE false END),
      ('songkick_event', 'Event added on Songkick', CASE WHEN v_idx <= 8 THEN true ELSE false END),
      ('bandsintown_event', 'Event added on Bandsintown', CASE WHEN v_idx <= 6 THEN true ELSE false END),
      ('posters_printed', 'Posters Printed', CASE WHEN v_idx <= 5 THEN true ELSE false END),
      ('radio_ads', 'Radio Ads Booked', CASE WHEN v_idx <= 7 THEN true ELSE false END),
      ('press_release', 'Press Release Sent', true),
      ('social_media_graphics', 'Social Media Graphics Created', true),
      ('ticket_links', 'Ticket Links Distributed', true),
      ('venue_promo', 'Venue Promotional Materials Sent', CASE WHEN v_idx <= 6 THEN true ELSE false END)
    ) AS task_data(task_key, label, completed);

    -- Insert Production Files
    INSERT INTO production_files (show_id, name, type, file_url, version, uploaded_by)
    SELECT
      v_show_id,
      file_data.name,
      file_data.type,
      'https://example.com/files/' || lower(replace(file_data.name, ' ', '_')) || '.pdf',
      file_data.version,
      file_data.uploaded_by
    FROM (VALUES
      ('Technical Rider 2025', 'tech_rider', '3.2', 'Production Manager'),
      ('Hospitality Rider', 'hospitality_rider', '2.0', 'Tour Manager'),
      ('Stage Plot', 'stage_plot', '2.1', 'Production Designer'),
      ('Input List', 'input_list', '2.5', 'FOH Engineer'),
      ('Backline Requirements', 'backline', '1.8', 'Backline Tech'),
      ('Lighting Plot', 'other', '1.5', 'Lighting Designer')
    ) AS file_data(name, type, version, uploaded_by);

  END LOOP;
END $$;
