-- ============================================================================
-- QUICK DATABASE CHECK FOR ZKTECO K40
-- Copy and paste this entire query into Supabase SQL Editor
-- ============================================================================

-- This single query will show everything I need to verify your setup
SELECT 
    '=== MEMBERS TABLE STRUCTURE ===' as section,
    NULL as detail
UNION ALL
SELECT 
    'Column: ' || column_name,
    'Type: ' || data_type || 
    CASE WHEN is_nullable = 'NO' THEN ' (NOT NULL)' ELSE '' END
FROM information_schema.columns
WHERE table_name = 'members' AND table_schema = 'public'

UNION ALL SELECT '', ''
UNION ALL SELECT '=== CHECKINS TABLE STRUCTURE ===', NULL
UNION ALL
SELECT 
    'Column: ' || column_name,
    'Type: ' || data_type || 
    CASE WHEN is_nullable = 'NO' THEN ' (NOT NULL)' ELSE '' END
FROM information_schema.columns
WHERE table_name = 'checkins' AND table_schema = 'public'

UNION ALL SELECT '', ''
UNION ALL SELECT '=== SAMPLE MEMBERS ===', NULL
UNION ALL
SELECT 
    'Member: ' || name,
    'ID: ' || COALESCE(member_id, 'NULL') || 
    ' | Biometric: ' || COALESCE(biometric_enrolled::text, 'false')
FROM members
LIMIT 3

UNION ALL SELECT '', ''
UNION ALL SELECT '=== SAMPLE CHECKINS ===', NULL
UNION ALL
SELECT 
    'Time: ' || check_in_time::text,
    'Method: ' || entry_method || ' | Device: ' || COALESCE(device_name, 'NULL')
FROM checkins
ORDER BY check_in_time DESC
LIMIT 3

UNION ALL SELECT '', ''
UNION ALL SELECT '=== ZKTECO COMPATIBILITY CHECK ===', NULL
UNION ALL
SELECT 
    'member_id field',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'member_id')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'biometric_enrolled field',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'biometric_enrolled')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'entry_method field',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'entry_method')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END
UNION ALL
SELECT 
    'device_name field',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'device_name')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END;

-- ============================================================================
-- AFTER RUNNING THIS, ALSO RUN THESE INDIVIDUAL QUERIES:
-- ============================================================================

-- Query 1: Show full members table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'members'
ORDER BY ordinal_position;

-- Query 2: Show full checkins table structure  
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'checkins'
ORDER BY ordinal_position;

-- Query 3: Show all tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
