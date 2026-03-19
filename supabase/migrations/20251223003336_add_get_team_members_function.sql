/*
  # Add function to get team members

  1. New Functions
    - `get_team_members()` - Returns list of all users with their basic info
      - Returns id, email, and name from auth.users
      - Accessible to authenticated users only
  
  2. Security
    - Function is SECURITY DEFINER to allow reading from auth.users
    - Only authenticated users can call this function
*/

-- Create function to get team members
CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (
  id uuid,
  email text,
  name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.email
    ) as name
  FROM auth.users au
  ORDER BY au.email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_team_members() TO authenticated;