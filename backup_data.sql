-- ============================================================
-- Manual Backup Script for Supabase Free Plan
-- Run each SELECT query separately and download the results as CSV
-- ============================================================

-- 1. Backup Patients
SELECT * FROM patients ORDER BY created_at;
-- After running, click "Download as CSV" button in Supabase SQL Editor

-- 2. Backup Appointments
SELECT * FROM appointments ORDER BY created_at;
-- After running, click "Download as CSV" button

-- 3. Backup Sessions
SELECT * FROM sessions ORDER BY created_at;
-- After running, click "Download as CSV" button

-- 4. Backup Exercises
SELECT * FROM exercises ORDER BY created_at;
-- After running, click "Download as CSV" button

-- ============================================================
-- Optional: Get a quick summary of your data
-- ============================================================
SELECT 
    'patients' as table_name, 
    COUNT(*) as row_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM patients
UNION ALL
SELECT 'appointments', COUNT(*), MIN(created_at), MAX(created_at) FROM appointments
UNION ALL
SELECT 'sessions', COUNT(*), MIN(created_at), MAX(created_at) FROM sessions
UNION ALL
SELECT 'exercises', COUNT(*), MIN(created_at), MAX(created_at) FROM exercises;
