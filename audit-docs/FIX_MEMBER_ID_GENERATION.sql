-- Fix Member ID Generation for ZKTeco K40 Integration
-- This script removes the "GM" prefix and changes to numeric-only member IDs

-- ============================================================================
-- ISSUE: Member IDs are auto-generated with "GM" prefix (e.g., GM8696)
-- PROBLEM: ZKTeco K40 only accepts numeric User IDs
-- SOLUTION: Change to numeric-only format (e.g., 1001, 1002, 1003)
-- ============================================================================

-- Step 1: Create function to generate numeric member IDs
CREATE OR REPLACE FUNCTION generate_numeric_member_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    new_member_id TEXT;
BEGIN
    -- Get the highest numeric member_id and increment
    SELECT COALESCE(MAX(CAST(member_id AS INTEGER)), 1000) + 1
    INTO next_id
    FROM members
    WHERE member_id ~ '^\d+$'; -- Only consider numeric member_ids
    
    -- Return as text (e.g., '1001', '1002', '1003')
    new_member_id := next_id::TEXT;
    
    RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger function to auto-generate member_id on insert
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

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS generate_member_id_trigger ON members;

-- Step 4: Create new trigger
CREATE TRIGGER generate_member_id_trigger
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION set_member_id_before_insert();

-- ============================================================================
-- OPTIONAL: Convert existing "GM" prefixed member IDs to numeric
-- WARNING: Only run this if you want to convert existing members
-- This will break existing fingerprint enrollments on the K40 device!
-- You will need to re-enroll fingerprints with new numeric IDs
-- ============================================================================

-- Uncomment the following to convert existing members:
/*
DO $$
DECLARE
    member_record RECORD;
    new_id INTEGER := 1001;
BEGIN
    FOR member_record IN 
        SELECT id, member_id, name 
        FROM members 
        WHERE member_id LIKE 'GM%'
        ORDER BY created_at
    LOOP
        UPDATE members 
        SET member_id = new_id::TEXT
        WHERE id = member_record.id;
        
        RAISE NOTICE 'Converted % (%) from % to %', 
            member_record.name, 
            member_record.id, 
            member_record.member_id, 
            new_id;
        
        new_id := new_id + 1;
    END LOOP;
END $$;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if trigger was created successfully
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'generate_member_id_trigger';

-- Test the function (should return next available numeric ID)
SELECT generate_numeric_member_id() as next_member_id;

-- View all current member IDs
SELECT member_id, name, created_at 
FROM members 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================
-- INSTRUCTIONS FOR NEW MEMBERS
-- ============================================================================
-- 1. Add member in dashboard (member_id will auto-generate as numeric, e.g., "1001")
-- 2. Go to ZKTeco K40 device
-- 3. Enroll fingerprint with SAME User ID (e.g., "1001")
-- 4. Start biometric listener
-- 5. Test fingerprint scan - should now work!
-- ============================================================================

SELECT '✅ Member ID generation fixed! New members will get numeric IDs.' as status;
