-- ============================================================================
-- COMPLETE DATABASE STRUCTURE AUDIT
-- Run these queries in Supabase SQL Editor to check your database
-- ============================================================================

-- Query 1: List all tables
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Query 2: Get complete structure of 'members' table
-- ============================================================================
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

-- Query 3: Get complete structure of 'checkins' table
-- ============================================================================
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

-- Query 4: Get complete structure of 'biometric_devices' table
-- ============================================================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'biometric_devices'
ORDER BY ordinal_position;

-- Query 5: Check all indexes
-- ============================================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Query 6: Check all foreign keys
-- ============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Query 7: Check all triggers
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Query 8: Check RLS policies
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Query 9: Sample data from members table
-- ============================================================================
SELECT 
    id,
    member_id,
    name,
    email,
    phone,
    membership_type,
    status,
    biometric_id,
    biometric_enrolled,
    last_seen,
    total_visits,
    created_at
FROM members
ORDER BY created_at DESC
LIMIT 5;

-- Query 10: Sample data from checkins table
-- ============================================================================
SELECT 
    c.id,
    c.member_id,
    m.name as member_name,
    m.member_id as member_identifier,
    c.check_in_time,
    c.entry_method,
    c.device_name,
    c.scanner_id,
    c.notes
FROM checkins c
LEFT JOIN members m ON c.member_id = m.id
ORDER BY c.check_in_time DESC
LIMIT 5;

-- Query 11: Check for missing member_id values
-- ============================================================================
SELECT 
    id,
    name,
    member_id,
    biometric_enrolled
FROM members
WHERE member_id IS NULL OR member_id = ''
ORDER BY created_at DESC;

-- Query 12: Check member_id uniqueness
-- ============================================================================
SELECT 
    member_id,
    COUNT(*) as count
FROM members
WHERE member_id IS NOT NULL
GROUP BY member_id
HAVING COUNT(*) > 1;

-- Query 13: Statistics
-- ============================================================================
SELECT 
    'Total Members' as metric,
    COUNT(*) as value
FROM members
UNION ALL
SELECT 
    'Active Members',
    COUNT(*)
FROM members
WHERE status = 'active'
UNION ALL
SELECT 
    'Members with Biometric',
    COUNT(*)
FROM members
WHERE biometric_enrolled = true
UNION ALL
SELECT 
    'Total Check-ins',
    COUNT(*)
FROM checkins
UNION ALL
SELECT 
    'Check-ins Today',
    COUNT(*)
FROM checkins
WHERE check_in_time >= CURRENT_DATE
UNION ALL
SELECT 
    'Biometric Check-ins',
    COUNT(*)
FROM checkins
WHERE entry_method = 'biometric';

-- ============================================================================
-- RECOMMENDED STRUCTURE FOR ZKTECO K40
-- ============================================================================

-- Query 14: Check if members table has required fields for ZKTeco
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'members' AND column_name = 'member_id'
        ) THEN '✅ member_id exists'
        ELSE '❌ member_id missing'
    END as member_id_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'members' AND column_name = 'biometric_id'
        ) THEN '✅ biometric_id exists'
        ELSE '❌ biometric_id missing'
    END as biometric_id_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'members' AND column_name = 'biometric_enrolled'
        ) THEN '✅ biometric_enrolled exists'
        ELSE '❌ biometric_enrolled missing'
    END as biometric_enrolled_check;

-- Query 15: Check if checkins table has required fields for ZKTeco
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkins' AND column_name = 'entry_method'
        ) THEN '✅ entry_method exists'
        ELSE '❌ entry_method missing'
    END as entry_method_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkins' AND column_name = 'device_name'
        ) THEN '✅ device_name exists'
        ELSE '❌ device_name missing'
    END as device_name_check,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'checkins' AND column_name = 'scanner_id'
        ) THEN '✅ scanner_id exists'
        ELSE '❌ scanner_id missing'
    END as scanner_id_check;

-- ============================================================================
-- EXPORT COMPLETE SCHEMA
-- ============================================================================

-- Query 16: Generate CREATE TABLE statements for all tables
-- ============================================================================
SELECT 
    'CREATE TABLE ' || table_name || ' (' || 
    string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' 
            THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('members', 'checkins', 'biometric_devices', 'users', 'invoices')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

/*
HOW TO USE THESE QUERIES:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste each query one by one
4. Run each query
5. Copy the results and share with me

IMPORTANT QUERIES TO RUN:
- Query 2: members table structure
- Query 3: checkins table structure  
- Query 9: Sample members data
- Query 10: Sample checkins data
- Query 14: ZKTeco compatibility check
- Query 15: Checkins compatibility check

These will help me verify if your database is properly configured for ZKTeco K40.
*/
