-- ============================================================
-- PhysioTrack — Table Renaming Migration
-- Rename tables to use Tbl_ prefix convention
-- Run this CAREFULLY in Supabase SQL Editor
-- ============================================================

-- IMPORTANT: This will rename all tables and update foreign keys
-- Backup your data before running this migration!

-- Step 1: Rename tables
ALTER TABLE IF EXISTS patients RENAME TO Tbl_Patients;
ALTER TABLE IF EXISTS appointments RENAME TO Tbl_Appointments;
ALTER TABLE IF EXISTS sessions RENAME TO Tbl_Sessions;
ALTER TABLE IF EXISTS exercises RENAME TO Tbl_Exercises;

-- Step 2: Rename indexes to match new table names
ALTER INDEX IF EXISTS idx_patients_user RENAME TO idx_Tbl_Patients_user_id;
ALTER INDEX IF EXISTS idx_patients_auth RENAME TO idx_Tbl_Patients_auth_id;
ALTER INDEX IF EXISTS idx_appointments_user RENAME TO idx_Tbl_Appointments_user_id;
ALTER INDEX IF EXISTS idx_appointments_date RENAME TO idx_Tbl_Appointments_date;
ALTER INDEX IF EXISTS idx_sessions_user RENAME TO idx_Tbl_Sessions_user_id;
ALTER INDEX IF EXISTS idx_sessions_patient RENAME TO idx_Tbl_Sessions_patient_id;
ALTER INDEX IF EXISTS idx_exercises_user RENAME TO idx_Tbl_Exercises_user_id;

-- Step 3: Update RLS policy names (optional but recommended for consistency)
-- Policies are automatically updated to reference the new table names

-- Verification queries
SELECT 'Tbl_Patients' as table_name, COUNT(*) as row_count FROM Tbl_Patients
UNION ALL
SELECT 'Tbl_Appointments', COUNT(*) FROM Tbl_Appointments
UNION ALL
SELECT 'Tbl_Sessions', COUNT(*) FROM Tbl_Sessions
UNION ALL
SELECT 'Tbl_Exercises', COUNT(*) FROM Tbl_Exercises;

-- Verify indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'Tbl_%'
ORDER BY tablename, indexname;
