-- Create profile for admin@doughy.app user if missing
-- This user was created via Supabase Dashboard which didn't trigger handle_new_user()

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@doughy.app';

  -- Only insert if the user exists and doesn't have a profile yet
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, workspace_id)
    VALUES (
      admin_user_id,
      'admin@doughy.app',
      'admin',
      NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'  -- Update to admin if profile exists but has wrong role
    WHERE profiles.id = admin_user_id;

    RAISE NOTICE 'Created/updated admin profile for user %', admin_user_id;
  ELSE
    RAISE NOTICE 'User admin@doughy.app not found in auth.users';
  END IF;
END $$;
