-- ============================================================================
-- FIX DATABASE FOR ZKTECO K40 INTEGRATION
-- Run these queries in Supabase SQL Editor to add missing fields
-- ============================================================================

-- 1. Add biometric_enrolled field to members table
-- ============================================================================
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false;

COMMENT ON COLUMN members.biometric_enrolled IS 'Flag to track if member has fingerprint enrolled on K40 device';

-- 2. Add device_name field to checkins table
-- ============================================================================
ALTER TABLE checkins 
ADD COLUMN IF NOT EXISTS device_name TEXT DEFAULT 'ZKTeco K40';

COMMENT ON COLUMN checkins.device_name IS 'Name of the biometric device used for check-in';

-- 3. Update existing checkins to have device_name
-- ============================================================================
UPDATE checkins 
SET device_name = 'ZKTeco K40' 
WHERE device_name IS NULL;

-- 4. Verify the changes
-- ============================================================================
SELECT 
    'members.biometric_enrolled' as field,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'members' AND column_name = 'biometric_enrolled'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'checkins.device_name',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkins' AND column_name = 'device_name'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END;

-- 5. Show updated members table structure
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'members'
  AND column_name IN ('member_id', 'biometric_id', 'biometric_enrolled', 'fingerprint_data', 'scanner_device_id')
ORDER BY ordinal_position;

-- 6. Show updated checkins table structure
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'checkins'
  AND column_name IN ('member_id', 'scanner_id', 'entry_method', 'device_name')
ORDER BY ordinal_position;

-- ============================================================================
-- DONE! Your database is now ready for ZKTeco K40
-- ============================================================================
