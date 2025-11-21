-- ============================================================================
-- SINGLE-QUERY DATABASE SCHEMA EXPORT
-- ============================================================================
-- Purpose: Get ALL database metadata in one query as a single JSON object
-- Usage: Run once in Supabase SQL Editor, copy the entire JSON result
-- ============================================================================

WITH
-- All tables with descriptions
tables_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'table_description', obj_description(concat(schemaname, '.', tablename)::regclass, 'pg_class')
        ) ORDER BY tablename
    ) AS data
    FROM pg_tables
    WHERE schemaname = 'public'
),

-- All columns for each table
columns_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', table_name,
            'column_name', column_name,
            'ordinal_position', ordinal_position,
            'data_type', data_type,
            'character_maximum_length', character_maximum_length,
            'column_default', column_default,
            'is_nullable', is_nullable,
            'udt_name', udt_name,
            'column_description', col_description(concat('public.', table_name)::regclass, ordinal_position)
        ) ORDER BY table_name, ordinal_position
    ) AS data
    FROM information_schema.columns
    WHERE table_schema = 'public'
),

-- All primary keys
primary_keys_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', tc.table_name,
            'column_name', kcu.column_name,
            'constraint_name', tc.constraint_name
        ) ORDER BY tc.table_name
    ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
),

-- All foreign keys
foreign_keys_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'from_table', tc.table_name,
            'from_column', kcu.column_name,
            'to_table', ccu.table_name,
            'to_column', ccu.column_name,
            'constraint_name', tc.constraint_name,
            'delete_rule', rc.delete_rule,
            'update_rule', rc.update_rule
        ) ORDER BY tc.table_name, kcu.column_name
    ) AS data
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
),

-- All check constraints
check_constraints_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', tc.table_name,
            'constraint_name', tc.constraint_name,
            'check_clause', cc.check_clause
        ) ORDER BY tc.table_name
    ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
),

-- All unique constraints
unique_constraints_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', tc.table_name,
            'column_name', kcu.column_name,
            'constraint_name', tc.constraint_name
        ) ORDER BY tc.table_name, kcu.column_name
    ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
),

-- All indexes
indexes_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'indexname', indexname,
            'indexdef', indexdef
        ) ORDER BY tablename, indexname
    ) AS data
    FROM pg_indexes
    WHERE schemaname = 'public'
),

-- All functions
functions_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schema_name', n.nspname,
            'function_name', p.proname,
            'arguments', pg_get_function_arguments(p.oid),
            'return_type', pg_get_function_result(p.oid),
            'volatility', CASE p.provolatile
                WHEN 'i' THEN 'IMMUTABLE'
                WHEN 's' THEN 'STABLE'
                WHEN 'v' THEN 'VOLATILE'
            END,
            'security', CASE p.prosecdef
                WHEN true THEN 'SECURITY DEFINER'
                ELSE 'SECURITY INVOKER'
            END,
            'description', obj_description(p.oid, 'pg_proc')
        ) ORDER BY p.proname
    ) AS data
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.prokind = 'f'
),

-- All triggers
triggers_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schema_name', event_object_schema,
            'table_name', event_object_table,
            'trigger_name', trigger_name,
            'trigger_event', event_manipulation,
            'trigger_timing', action_timing,
            'trigger_action', action_statement
        ) ORDER BY event_object_table, trigger_name
    ) AS data
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
),

-- All RLS policies
rls_policies_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'policyname', policyname,
            'permissive', permissive,
            'roles', roles,
            'operation', cmd,
            'using_expression', qual,
            'with_check_expression', with_check
        ) ORDER BY tablename, policyname
    ) AS data
    FROM pg_policies
    WHERE schemaname = 'public'
),

-- RLS enabled status
rls_enabled_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'rls_enabled', rowsecurity
        ) ORDER BY tablename
    ) AS data
    FROM pg_tables
    WHERE schemaname = 'public'
),

-- All enums
enums_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schema_name', schema_name,
            'enum_name', enum_name,
            'enum_values', enum_values
        ) ORDER BY enum_name
    ) AS data
    FROM (
        SELECT
            n.nspname as schema_name,
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        GROUP BY n.nspname, t.typname
    ) enum_data
),

-- All sequences
sequences_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'sequencename', sequencename,
            'last_value', last_value,
            'start_value', start_value,
            'increment_by', increment_by,
            'max_value', max_value,
            'min_value', min_value,
            'cache_size', cache_size,
            'cycle', cycle
        ) ORDER BY sequencename
    ) AS data
    FROM pg_sequences
    WHERE schemaname = 'public'
),

-- Table sizes
table_sizes_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'total_size', pg_size_pretty(pg_total_relation_size(concat(schemaname, '.', tablename)::regclass)),
            'table_size', pg_size_pretty(pg_relation_size(concat(schemaname, '.', tablename)::regclass)),
            'indexes_size', pg_size_pretty(pg_indexes_size(concat(schemaname, '.', tablename)::regclass)),
            'total_bytes', pg_total_relation_size(concat(schemaname, '.', tablename)::regclass)
        ) ORDER BY pg_total_relation_size(concat(schemaname, '.', tablename)::regclass) DESC
    ) AS data
    FROM pg_tables
    WHERE schemaname = 'public'
),

-- Database statistics
db_stats_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'schemaname', schemaname,
            'table_name', relname,
            'row_count_estimate', n_live_tup,
            'dead_rows', n_dead_tup,
            'last_vacuum', last_vacuum,
            'last_autovacuum', last_autovacuum,
            'last_analyze', last_analyze,
            'last_autoanalyze', last_autoanalyze
        ) ORDER BY n_live_tup DESC
    ) AS data
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
),

-- Grants and permissions
grants_info AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'grantee', grantee,
            'table_schema', table_schema,
            'table_name', table_name,
            'privilege_type', privilege_type
        ) ORDER BY table_name, grantee, privilege_type
    ) AS data
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
        AND grantee IN ('authenticated', 'anon', 'service_role')
)

-- Combine everything into a single JSON object
SELECT jsonb_build_object(
    'metadata', jsonb_build_object(
        'exported_at', now(),
        'database_name', current_database(),
        'schema_version', '1.0'
    ),
    'tables', COALESCE((SELECT data FROM tables_info), '[]'::jsonb),
    'columns', COALESCE((SELECT data FROM columns_info), '[]'::jsonb),
    'primary_keys', COALESCE((SELECT data FROM primary_keys_info), '[]'::jsonb),
    'foreign_keys', COALESCE((SELECT data FROM foreign_keys_info), '[]'::jsonb),
    'check_constraints', COALESCE((SELECT data FROM check_constraints_info), '[]'::jsonb),
    'unique_constraints', COALESCE((SELECT data FROM unique_constraints_info), '[]'::jsonb),
    'indexes', COALESCE((SELECT data FROM indexes_info), '[]'::jsonb),
    'functions', COALESCE((SELECT data FROM functions_info), '[]'::jsonb),
    'triggers', COALESCE((SELECT data FROM triggers_info), '[]'::jsonb),
    'rls_policies', COALESCE((SELECT data FROM rls_policies_info), '[]'::jsonb),
    'rls_enabled', COALESCE((SELECT data FROM rls_enabled_info), '[]'::jsonb),
    'enums', COALESCE((SELECT data FROM enums_info), '[]'::jsonb),
    'sequences', COALESCE((SELECT data FROM sequences_info), '[]'::jsonb),
    'table_sizes', COALESCE((SELECT data FROM table_sizes_info), '[]'::jsonb),
    'database_statistics', COALESCE((SELECT data FROM db_stats_info), '[]'::jsonb),
    'grants', COALESCE((SELECT data FROM grants_info), '[]'::jsonb)
) AS complete_database_schema;

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Run this single query in Supabase SQL Editor
-- 2. Copy the entire JSON result
-- 3. Use it to update database.instructions.md with complete schema
-- 4. All metadata is organized in one JSON object with clear keys
-- ============================================================================
