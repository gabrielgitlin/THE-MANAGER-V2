/*
  # Add Healthcheck Function
  
  1. New Functions
    - `healthcheck()`: Returns true if the database connection is working
  
  2. Security
    - Function is accessible to authenticated users only
*/

-- Create healthcheck function
CREATE OR REPLACE FUNCTION public.healthcheck()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.healthcheck TO authenticated;