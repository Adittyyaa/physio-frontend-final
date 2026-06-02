# PhysioTrack Database Naming Convention

## Overview
This document defines the improved naming convention for the PhysioTrack database schema.

## Naming Standards

### Tables
- **Format**: `Tbl_` prefix + PascalCase
- **Examples**: 
  - `Tbl_Patients`
  - `Tbl_Appointments`
  - `Tbl_Sessions`
  - `Tbl_Exercises`

### Columns
- **Format**: snake_case (lowercase with underscores)
- **Examples**:
  - `user_id`
  - `patient_auth_id`
  - `created_at`
  - `allow_reschedule`

### Indexes
- **Format**: `idx_TableName_column_name`
- **Examples**:
  - `idx_Tbl_Patients_user_id`
  - `idx_Tbl_Appointments_date`
  - `idx_Tbl_Sessions_patient_id`

### RLS Policies
- **Format**: `TableName_purpose`
- **Examples**:
  - `Tbl_Patients_own` (therapist access)
  - `Tbl_Patients_portal_read` (patient portal access)
  - `Tbl_Exercises_portal_insert` (patient can insert)

### Functions/Triggers
- **Format**: snake_case with descriptive names
- **Examples**:
  - `handle_new_user()`
  - `handle_new_user_after()`
  - `handle_patient_email_change()`

## Migration Path

### Option 1: Fresh Installation
Use `supabase_schema_NEW_NAMING.sql` for new databases.

### Option 2: Existing Database
1. **Backup your data** (export from Supabase dashboard)
2. Run `rename_tables_migration.sql` to rename existing tables
3. Update application code to reference new table names
4. Test thoroughly before deploying

## Table Name Mapping

| Old Name | New Name |
|----------|----------|
| `patients` | `Tbl_Patients` |
| `appointments` | `Tbl_Appointments` |
| `sessions` | `Tbl_Sessions` |
| `exercises` | `Tbl_Exercises` |

## Benefits of This Convention

1. **Clear Table Identification**: `Tbl_` prefix makes tables immediately recognizable
2. **Consistency**: PascalCase for tables, snake_case for columns follows common database standards
3. **Readability**: Descriptive names make queries self-documenting
4. **IDE Support**: Better autocomplete and IntelliSense in modern IDEs
5. **Future-Proof**: Scalable convention as database grows

## Important Notes

⚠️ **Case Sensitivity**: PostgreSQL/Supabase treats quoted identifiers as case-sensitive.
If you use the new table names, you must quote them in queries:

```sql
-- CORRECT
SELECT * FROM "Tbl_Patients";

-- INCORRECT (will fail)
SELECT * FROM Tbl_Patients;
```

However, for simplicity, consider using lowercase if renaming:
- `tbl_patients` instead of `Tbl_Patients`

This avoids the need for quotes everywhere.

## Recommended: Lowercase Alternative

If case-sensitivity becomes an issue, use this simpler convention:

### Tables
- `tbl_patients`
- `tbl_appointments`
- `tbl_sessions`
- `tbl_exercises`

### Benefits
- No need to quote table names
- Still has the `tbl_` prefix for clarity
- More compatible with PostgreSQL conventions
