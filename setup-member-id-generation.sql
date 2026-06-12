-- Setup Member ID Auto-Generation Starting from 1001
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Create function to generate numeric member IDs starting from 1001
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_numeric_member_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    new_member_id TEXT;
BEGIN
    -- Get the highest numeric member_id and increment
    -- If no members exist, start from 1001
    SELECT COALESCE(MAX(CAST(member_id AS INTEGER)), 1000) + 1
    INTO next_id
    FROM members
    WHERE member_id ~ '^\d+$'; -- Only consider numeric member_ids
    
    -- Return as text (e.g., '1001', '1002', '1003')
    new_member_id := next_id::TEXT;
    
    RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create trigger function to auto-generate member_id on insert
-- ============================================================================
CREATE OR REPLACE FUNCTION set_member_id_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if member_id is NULL or empty
    IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
        NEW.member_id := generate_numeric_member_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Drop existing trigger if it exists and create new one
-- ============================================================================
DROP TRIGGER IF EXISTS generate_member_id_trigger ON members;

CREATE TRIGGER generate_member_id_trigger
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION set_member_id_before_insert();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if trigger was created successfully
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'generate_member_id_trigger';

-- Test the function (should return next available numeric ID starting from 1001)
SELECT generate_numeric_member_id() as next_member_id;

-- View all current member IDs
SELECT member_id, name, created_at 
FROM members 
ORDER BY CAST(member_id AS INTEGER) DESC 
LIMIT 10;

SELECT '✅ Member ID generation configured! New members will start from 1001.' as status;
