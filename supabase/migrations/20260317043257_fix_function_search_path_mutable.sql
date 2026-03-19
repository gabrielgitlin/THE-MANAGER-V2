/*
  # Fix Function Search Path Mutable

  Sets immutable search_path on public functions to prevent search_path manipulation attacks.
  This is a security best practice to ensure functions always reference the intended schemas.

  1. Functions affected:
    - `public.handle_updated_at()` - Trigger function for auto-updating updated_at columns
    - `public.handle_new_user()` - Trigger function for creating user profiles on auth signup

  2. Security
    - Prevents potential privilege escalation via search_path manipulation
    - Both functions now explicitly use 'public' schema in search_path
*/

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist_manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
