-- ============================================================
-- CLEAR ALL PATIENT DATA FOR TESTING
-- Run this in Supabase SQL Editor
-- ============================================================

-- WARNING: This will delete ALL patient-related data!
-- Make sure you want to do this before running.

-- 1. Delete all exercises (including patient-assigned and library exercises)
DELETE FROM tbl_exercises;

-- 2. Delete all sessions
DELETE FROM tbl_sessions;

-- 3. Delete all appointments
DELETE FROM tbl_appointments;

-- 4. Delete all patient records
DELETE FROM tbl_patients;

-- VERIFICATION: Check that all tables are empty
SELECT 'Patients' as table_name, COUNT(*) as count FROM tbl_patients
UNION ALL
SELECT 'Appointments', COUNT(*) FROM tbl_appointments
UNION ALL
SELECT 'Sessions', COUNT(*) FROM tbl_sessions
UNION ALL
SELECT 'Exercises', COUNT(*) FROM tbl_exercises;

-- Expected result: All counts should be 0
