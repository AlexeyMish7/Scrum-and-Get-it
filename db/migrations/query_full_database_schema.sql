-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA QUERY
-- ============================================================================
-- Purpose: Get complete overview of all tables, columns, functions, triggers,
--          policies, indexes, and constraints for documentation
-- Usage: Run in Supabase SQL Editor and copy results to update instructions
-- ============================================================================

-- ============================================================================
-- 1. ALL TABLES WITH DESCRIPTIONS
-- ============================================================================
SELECT
    schemaname,
    tablename,
    obj_description(concat(schemaname, '.', tablename)::regclass, 'pg_class') as table_description
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. ALL COLUMNS FOR EACH TABLE (with types, defaults, constraints)
-- ============================================================================
SELECT
    table_name,
    column_name,
    ordinal_position,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable,
    udt_name,
    col_description(concat('public.', table_name)::regclass, ordinal_position) as column_description
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. ALL PRIMARY KEYS
-- ============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 4. ALL FOREIGN KEYS (with referenced tables)
-- ============================================================================
SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 5. ALL CHECK CONSTRAINTS
-- ============================================================================
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 6. ALL UNIQUE CONSTRAINTS
-- ============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 7. ALL INDEXES (including performance indexes)
-- ============================================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 8. ALL FUNCTIONS (stored procedures, RPC endpoints)
-- ============================================================================
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security,
    obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- Only functions (not aggregates or window functions)
ORDER BY p.proname;

-- ============================================================================
-- 9. ALL TRIGGERS
-- ============================================================================
SELECT
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as trigger_event,
    action_timing as trigger_timing,
    action_statement as trigger_action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 10. ALL RLS POLICIES
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 11. RLS ENABLED STATUS FOR EACH TABLE
-- ============================================================================
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 12. ALL ENUMS (custom types)
-- ============================================================================
SELECT
    n.nspname as schema_name,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- ============================================================================
-- 13. ALL SEQUENCES (for auto-increment columns)
-- ============================================================================
SELECT
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    max_value,
    min_value,
    cache_size,
    cycle
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- ============================================================================
-- 14. TABLE SIZES (for performance analysis)
-- ============================================================================
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(concat(schemaname, '.', tablename)::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(concat(schemaname, '.', tablename)::regclass)) as table_size,
    pg_size_pretty(pg_indexes_size(concat(schemaname, '.', tablename)::regclass)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(concat(schemaname, '.', tablename)::regclass) DESC;

-- ============================================================================
-- 15. STORAGE BUCKETS (Supabase Storage)
-- ============================================================================
-- Note: Only run if storage schema exists in your database
SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- 16. STORAGE BUCKET OBJECTS (check if storage is configured)
-- ============================================================================
-- Note: Skip if you get "relation does not exist" error
-- Alternative: Check storage via Supabase Dashboard instead
SELECT
    b.name as bucket_name,
    COUNT(o.id) as object_count
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.name
ORDER BY b.name;

-- ============================================================================
-- 17. FUNCTION SOURCE CODE (for key functions)
-- ============================================================================
-- Get source code for specific functions you want to document
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'get_company_research',
        'upsert_company_info',
        'save_company_research',
        'get_user_companies',
        'normalize_company_name',
        'cleanup_expired_company_research',
        'update_updated_at_column',
        'increment_document_version'
    )
ORDER BY p.proname;

-- ============================================================================
-- 18. GRANTS AND PERMISSIONS
-- ============================================================================
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 19. COLUMN GRANTS (for specific columns if any)
-- ============================================================================
SELECT
    grantee,
    table_schema,
    table_name,
    column_name,
    privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
ORDER BY table_name, column_name, grantee;

-- ============================================================================
-- 20. DATABASE STATISTICS (row counts per table)
-- ============================================================================
SELECT
    schemaname,
    relname as table_name,
    n_live_tup as row_count_estimate,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- BONUS: Generate CREATE TABLE statements for all tables
-- ============================================================================
-- This is a custom query to reconstruct table definitions
-- Run this to get the full CREATE TABLE syntax for documentation

DO $$
DECLARE
    rec RECORD;
    table_def TEXT;
BEGIN
    FOR rec IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Get table definition
        SELECT INTO table_def
            'CREATE TABLE public.' || rec.tablename || ' (' || chr(10) ||
            string_agg(
                '  ' || column_name || ' ' ||
                data_type ||
                CASE WHEN character_maximum_length IS NOT NULL
                    THEN '(' || character_maximum_length || ')'
                    ELSE ''
                END ||
                CASE WHEN column_default IS NOT NULL
                    THEN ' DEFAULT ' || column_default
                    ELSE ''
                END ||
                CASE WHEN is_nullable = 'NO'
                    THEN ' NOT NULL'
                    ELSE ''
                END,
                ',' || chr(10)
            ) || chr(10) || ');' || chr(10)
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = rec.tablename
        GROUP BY table_name;

        RAISE NOTICE '%', table_def;
    END LOOP;
END $$;

-- ============================================================================
-- INSTRUCTIONS FOR USE:
-- ============================================================================
-- 1. Run each query section separately in Supabase SQL Editor
-- 2. Export results to CSV or copy to clipboard
-- 3. Use results to update database.instructions.md with:
--    - Complete table definitions
--    - All foreign key relationships
--    - All indexes and their purposes
--    - All functions with descriptions
--    - All RLS policies
--    - All triggers
--    - All custom types/enums
-- 4. Document any missing comments or descriptions
-- ============================================================================
