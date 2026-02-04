-- ClearPress AI - Fix User Data Script
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This script will:
-- 1. Create the missing RPC function for signup
-- 2. Create an organization for orphaned auth users
-- 3. Create user profiles linked to the organization

-- =====================================================
-- STEP 1: Create the RPC function (drop existing first)
-- =====================================================

-- Drop the existing function if it exists with different signature
DROP FUNCTION IF EXISTS create_user_and_organization(uuid, text, text, text);

CREATE OR REPLACE FUNCTION create_user_and_organization(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  org_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  -- Create user profile
  INSERT INTO users (id, organization_id, email, name, role)
  VALUES (user_id, new_org_id, user_email, user_name, 'pr_admin')
  ON CONFLICT (id) DO UPDATE SET
    organization_id = new_org_id,
    name = EXCLUDED.name;

  RETURN jsonb_build_object('success', true, 'organization_id', new_org_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Find orphaned auth users and fix them
-- =====================================================

-- First, let's see what auth users exist without profiles
-- (Run this SELECT first to see the problem)
SELECT
  au.id as auth_user_id,
  au.email,
  u.id as profile_id,
  u.organization_id,
  o.name as org_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id;

-- =====================================================
-- STEP 3: Create org and profile for users without them
-- =====================================================

-- This will create an organization and profile for EACH auth user
-- that doesn't have a complete profile setup

DO $$
DECLARE
  auth_user RECORD;
  new_org_id UUID;
BEGIN
  -- Loop through auth users without a proper profile
  FOR auth_user IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN users u ON au.id = u.id
    WHERE u.id IS NULL OR u.organization_id IS NULL
  LOOP
    -- Check if org already exists for this user
    SELECT u.organization_id INTO new_org_id
    FROM users u WHERE u.id = auth_user.id;

    -- If no org, create one
    IF new_org_id IS NULL THEN
      INSERT INTO organizations (name)
      VALUES ('My Organization')
      RETURNING id INTO new_org_id;

      RAISE NOTICE 'Created organization % for user %', new_org_id, auth_user.email;
    END IF;

    -- Create or update user profile
    INSERT INTO users (id, organization_id, email, name, role)
    VALUES (
      auth_user.id,
      new_org_id,
      auth_user.email,
      COALESCE(SPLIT_PART(auth_user.email, '@', 1), 'User'),
      'pr_admin'
    )
    ON CONFLICT (id) DO UPDATE SET
      organization_id = COALESCE(users.organization_id, new_org_id);

    RAISE NOTICE 'Fixed user profile for %', auth_user.email;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Verify the fix
-- =====================================================

-- Run this to confirm all users now have profiles and orgs
SELECT
  au.id as auth_user_id,
  au.email,
  u.id as profile_id,
  u.organization_id,
  u.role,
  o.name as org_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id;

-- =====================================================
-- DONE! Now refresh your browser and try again.
-- =====================================================
