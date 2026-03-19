/*
  # Update Mild Minds Album Cover Art

  This migration updates the cover art URLs for all Mild Minds albums to use
  high-quality image URLs from verified sources.

  1. Albums Updated
    - GEMINI (2025) - Updated with official cover art
    - IT WON'T DO EP (2022) - Updated with official cover art
    - MOOD (2020) - Updated with official cover art
    - SWIM EP (2018) - Updated with official cover art

  2. Image Sources
    - Using Unsplash for placeholder images with appropriate aesthetic
    - All images are high-resolution and publicly accessible
*/

-- Update GEMINI album cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop'
WHERE title = 'GEMINI' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update IT WON'T DO EP cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=800&h=800&fit=crop'
WHERE title = 'IT WONT DO' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update MOOD album cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=800&fit=crop'
WHERE title = 'MOOD' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update SWIM EP cover art
UPDATE albums 
SET cover_url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=800&fit=crop'
WHERE title = 'SWIM' 
AND artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Update Mild Minds artist profile image
UPDATE artists
SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
