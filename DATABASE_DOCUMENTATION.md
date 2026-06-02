# PhysioTrack Database Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Tables Explained](#tables-explained) 
4. [How Data Flows](#how-data-flows)
5. [Security & Access Control](#security--access-control)
6. [Relationships](#relationships)
7. [Common Operations](#common-operations)
8. [Backup & Maintenance](#backup--maintenance)

---

## Overview

PhysioTrack uses **Supabase** (PostgreSQL) as its database backend. The database is designed to support:
- Multiple therapist accounts (each isolated from others)
- Patient management
- Appointment scheduling
- Session logging with progress tracking
- Exercise library and patient-specific exercise assignments
- Optional patient portal access

### Naming Convention
- **Tables**: `Tbl_` prefix with PascalCase (e.g., `Tbl_Patients`)
- **Columns**: snake_case (e.g., `user_id`, `patient_auth_id`)
- **Indexes**: `idx_TableName_column_name` format

---

## Database Architecture

### High-Level Structure

```
auth.users (Supabase Auth)
    ↓
    ├─→ Tbl_Patients (therapist owns patients)
    │       ↓
    │       ├─→ Tbl_Appointments
    │       ├─→ Tbl_Sessions  
    │       └─→ Tbl_Exercises (assigned)
    │
    ├─→ Tbl_Appointments (therapist creates)
    ├─→ Tbl_Sessions (therapist logs)
    └─→ Tbl_Exercises (therapist's library)
```

### Key Concepts

1. **User Roles**: 
   - `therapist` (default): Can manage patients, appointments, sessions, exercises
   - `patient`: Can view their own data only (read-only portal access)

2. **Data Isolation**: 
   - Each therapist's data is isolated via `user_id` foreign key
   - Row Level Security (RLS) enforces access at database level

3. **Patient Portal**:
   - Optional feature allowing patients to view their data
   - Uses `patient_auth_id` to link patient records to auth accounts

---

## Tables Explained

### 1. `auth.users` (Supabase Built-in)

**Purpose**: Stores authentication credentials and user metadata.

**Not directly managed by you** - Supabase Auth handles this.

**Important Fields**:
- `id` (uuid): Unique user identifier
- `email`: Login email
- `user_metadata`: JSON containing `role` and `patient_id`

**User Metadata Structure**:
```json
{
  "role": "therapist" | "patient",
  "patient_id": "P1A2" // Only for patient accounts
}
```

---

### 2. `Tbl_Patients`

**Purpose**: Stores patient records linked to a therapist.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique patient code (e.g., "P1A2") |
| `user_id` | uuid (FK) | Therapist who owns this patient |
| `patient_auth_id` | uuid (FK) | Auth account for patient portal (optional) |
| `patient_email` | text | Email for patient portal linking |
| `name` | text | Patient's full name |
| `age` | integer | Patient age |
| `gender` | text | Patient gender |
| `phone` | text | Contact number |
| `diagnosis` | text | Medical diagnosis |
| `treatment_area` | text | Body area being treated |
| `referred_by` | text | Referral source |
| `notes` | text | General notes |
| `allow_reschedule` | boolean | Can patient reschedule appointments? |
| `active` | boolean | Is patient currently active? |
| `created_at` | timestamptz | When record was created |

**Relationships**:
- **Owned by**: One therapist (`auth.users.id`)
- **Has many**: Appointments, Sessions, Exercises

**Business Logic**:
- Each patient belongs to exactly ONE therapist
- Patient ID is a 4-character code (e.g., P1A2)
- `patient_auth_id` is NULL until patient creates a portal account

---

### 3. `Tbl_Appointments`

**Purpose**: Stores appointment bookings between therapist and patient.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique appointment ID |
| `user_id` | uuid (FK) | Therapist who created this |
| `patient_id` | text (FK) | Patient for this appointment |
| `patient_name` | text | Denormalized patient name (for performance) |
| `date` | date | Appointment date |
| `time` | text | Appointment time (e.g., "10:00") |
| `duration` | text | Duration in minutes (default: "60") |
| `type` | text | Appointment type (e.g., "Regular Session") |
| `notes` | text | Appointment notes |
| `reminder` | boolean | Send reminder? |
| `status` | text | scheduled \| completed \| cancelled \| pending |
| `created_at` | timestamptz | When booked |

**Relationships**:
- **Owned by**: One therapist
- **Belongs to**: One patient (optional - can be null for general appointments)

**Business Logic**:
- Therapist creates appointments for their patients
- `patient_name` is stored redundantly to avoid joins when listing appointments
- Status transitions: scheduled → completed OR cancelled

---

### 4. `Tbl_Sessions`

**Purpose**: Stores therapy session logs with pain scores, exercises done, and progress notes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique session ID |
| `user_id` | uuid (FK) | Therapist who logged this |
| `patient_id` | text (FK) | Patient for this session |
| `patient_name` | text | Denormalized patient name |
| `date` | date | Session date |
| `session_num` | integer | Session number in sequence |
| `pain` | integer | Pain score 0-10 (CHECK constraint) |
| `exercises` | text[] | Array of exercise names performed |
| `current_treatment` | text | Treatment applied this session |
| `progress` | text | Progress notes |
| `next_plan` | text | Plan for next session |
| `home_exercises` | text | Home exercise instructions |
| `rating` | integer | Session rating 1-5 (CHECK constraint) |
| `private_notes` | text | Therapist-only notes (not visible to patient) |
| `created_at` | timestamptz | When logged |

**Relationships**:
- **Owned by**: One therapist
- **Belongs to**: One patient

**Business Logic**:
- Therapist logs sessions after completing them
- `exercises` array stores names of exercises done (not IDs)
- `private_notes` excluded from patient portal views
- Pain and rating have CHECK constraints to ensure valid ranges

---

### 5. `Tbl_Exercises`

**Purpose**: Dual purpose - therapist's exercise library AND patient-specific assignments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique exercise ID |
| `user_id` | uuid (FK) | Therapist who owns this |
| `patient_id` | text (FK) | NULL = library; set = assigned to patient |
| `name` | text | Exercise name |
| `category` | text | neck \| shoulder \| back \| knee \| hip \| ankle \| other |
| `reps` | text | Repetitions (e.g., "3 × 10") |
| `instructions` | text | Step-by-step instructions |
| `media` | text | URL to video/image |
| `active` | boolean | Is exercise currently active? |
| `created_at` | timestamptz | When created |

**Relationships**:
- **Owned by**: One therapist
- **Assigned to**: Zero or one patient

**Business Logic**:
- **Library exercises**: `patient_id` is NULL - reusable templates
- **Assigned exercises**: `patient_id` is set - specific to one patient
- Therapist can assign library exercises to patients (creates new row with `patient_id` set)
- Patients can toggle `active` flag on their assigned exercises

---

## How Data Flows

### 1. Therapist Signs Up

```
1. User signs up with email/password
   ↓
2. auth.users record created with id = UUID
   ↓
3. Trigger sets user_metadata.role = "therapist"
   ↓
4. Therapist can now create patients
```

### 2. Therapist Adds a Patient

```
1. Therapist fills out patient form
   ↓
2. INSERT INTO Tbl_Patients (id, user_id, name, ...)
   ↓
3. Patient gets unique ID (e.g., "P1A2")
   ↓
4. Patient linked to therapist via user_id
```

### 3. Therapist Books Appointment

```
1. Therapist selects patient
   ↓
2. INSERT INTO Tbl_Appointments (id, user_id, patient_id, date, time, ...)
   ↓
3. Appointment appears in therapist's schedule
```

### 4. Therapist Logs Session

```
1. After session, therapist fills session form
   ↓
2. INSERT INTO Tbl_Sessions (id, user_id, patient_id, pain, exercises[], ...)
   ↓
3. Session appears in patient's history
```

### 5. Patient Portal Access (Optional)

```
1. Therapist adds patient_email to Tbl_Patients
   ↓
2. Patient signs up with that email
   ↓
3. Trigger finds matching patient record
   ↓
4. Sets user_metadata.role = "patient"
   ↓
5. Sets user_metadata.patient_id = "P1A2"
   ↓
6. Updates Tbl_Patients.patient_auth_id = auth user id
   ↓
7. Patient can now log in and view their data
```

### 6. Exercise Assignment Flow

```
Library Exercise (patient_id = NULL)
   ↓
Therapist clicks "Assign to Patient"
   ↓
New row created:
   - Same name, category, reps, instructions
   - patient_id = "P1A2"
   - user_id = therapist's id
   ↓
Patient can now view and toggle active status
```

---

## Security & Access Control

### Row Level Security (RLS)

All tables have RLS enabled. Access rules:

#### Therapist Access
```sql
-- Therapists can do ANYTHING with their own data
CREATE POLICY "Tbl_Patients_own" ON Tbl_Patients
  FOR ALL USING (auth.uid() = user_id);
```

Applied to: Tbl_Patients, Tbl_Appointments, Tbl_Sessions, Tbl_Exercises

#### Patient Portal Access (Read-Only)

```sql
-- Patients can READ their own patient record
CREATE POLICY "Tbl_Patients_portal_read" ON Tbl_Patients
  FOR SELECT
  USING (patient_auth_id = auth.uid());

-- Patients can READ their appointments
-- (via patient_id link)
CREATE POLICY "Tbl_Appointments_portal_read" ON Tbl_Appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM Tbl_Patients p
      WHERE p.id = Tbl_Appointments.patient_id
        AND p.patient_auth_id = auth.uid()
    )
  );

-- Similar for sessions and exercises
```

**Key Points**:
- Therapists have **full CRUD** on their own data
- Patients have **read-only** access to their data
- Patients can **insert/update/delete** their assigned exercises
- No cross-therapist data access (enforced by `user_id` filter)

### Triggers for Automatic Linking

#### 1. `handle_new_user()` - BEFORE INSERT on auth.users
**Purpose**: Set correct role when user signs up

```sql
IF patient_email matches existing patient record THEN
  role = "patient"
  patient_id = matching record ID
ELSE
  role = "therapist"
END IF
```

#### 2. `handle_new_user_after()` - AFTER INSERT on auth.users
**Purpose**: Link patient_auth_id when patient signs up

```sql
IF new user email matches patient_email THEN
  UPDATE Tbl_Patients
  SET patient_auth_id = new user ID
END IF
```

#### 3. `handle_patient_email_change()` - BEFORE INSERT/UPDATE on Tbl_Patients
**Purpose**: Auto-link if auth user already exists

```sql
IF patient_email is set AND auth user with that email exists THEN
  SET patient_auth_id = existing auth user ID
  UPDATE auth.users metadata to role = "patient"
END IF
```

---

## Relationships

### Entity Relationship Summary

```
auth.users (1) ─────────────────(M) Tbl_Patients
    │                                    │
    │                                    ├─(M) Tbl_Appointments
    │                                    ├─(M) Tbl_Sessions
    │                                    └─(M) Tbl_Exercises
    │
    ├─(M) Tbl_Appointments (direct)
    ├─(M) Tbl_Sessions (direct)
    └─(M) Tbl_Exercises (direct)
```

### Cascade Delete Rules

When a **therapist is deleted**:
```
DELETE auth.users (therapist)
   ↓ CASCADE
DELETE Tbl_Patients (all their patients)
   ↓ CASCADE  
DELETE Tbl_Appointments, Tbl_Sessions, Tbl_Exercises (all related data)
```

When a **patient record is deleted**:
```
DELETE Tbl_Patients
   ↓ CASCADE
DELETE Tbl_Appointments (their appointments)
DELETE Tbl_Sessions (their sessions)
DELETE Tbl_Exercises (their assigned exercises)
```

When a **patient auth user is deleted**:
```
DELETE auth.users (patient)
   ↓ SET NULL
Tbl_Patients.patient_auth_id = NULL
   ↓
Patient record remains, portal access removed
```

---

## Common Operations

### Create a New Therapist
```sql
-- Done via Supabase Auth signup
-- Automatically gets role = "therapist" via trigger
```

### Add a Patient
```sql
INSERT INTO "Tbl_Patients" (
  id, user_id, name, age, phone, diagnosis
) VALUES (
  'P1A2',                           -- Unique patient code
  'therapist-uuid-here',            -- Therapist's auth.users.id
  'John Doe',
  35,
  '555-0123',
  'Lower back pain'
);
```

### Book an Appointment
```sql
INSERT INTO "Tbl_Appointments" (
  id, user_id, patient_id, patient_name, date, time, status
) VALUES (
  'apt-uuid',
  'therapist-uuid',
  'P1A2',
  'John Doe',
  '2026-06-15',
  '10:00',
  'scheduled'
);
```

### Log a Session
```sql
INSERT INTO "Tbl_Sessions" (
  id, user_id, patient_id, patient_name, date, 
  pain, exercises, progress
) VALUES (
  'ses-uuid',
  'therapist-uuid',
  'P1A2',
  'John Doe',
  '2026-06-15',
  6,                                -- Pain score 0-10
  ARRAY['Chin Tucks', 'Bird Dog'],  -- Exercises done
  'Improved range of motion'
);
```

### Assign Exercise to Patient
```sql
-- Copy library exercise (patient_id = NULL) to patient-specific
INSERT INTO "Tbl_Exercises" (
  id, user_id, patient_id, name, category, reps, instructions
)
SELECT
  'new-uuid',
  user_id,
  'P1A2',           -- Assign to this patient
  name,
  category,
  reps,
  instructions
FROM "Tbl_Exercises"
WHERE id = 'library-exercise-id';
```

### Query Patient's Full History
```sql
-- Get patient details
SELECT * FROM "Tbl_Patients" WHERE id = 'P1A2';

-- Get all appointments
SELECT * FROM "Tbl_Appointments" 
WHERE patient_id = 'P1A2' 
ORDER BY date DESC;

-- Get all sessions
SELECT * FROM "Tbl_Sessions" 
WHERE patient_id = 'P1A2' 
ORDER BY date DESC;

-- Get assigned exercises
SELECT * FROM "Tbl_Exercises" 
WHERE patient_id = 'P1A2' 
  AND active = true;
```

---

## Backup & Maintenance

### Manual Backup (Free Plan)

**Option 1: Export via Supabase Dashboard**
1. Go to Table Editor
2. Click on each table
3. Click "⋯" menu → Export as CSV
4. Save files: `Tbl_Patients.csv`, `Tbl_Appointments.csv`, etc.

**Option 2: SQL Export**
```sql
-- Run these queries and download results
SELECT * FROM "Tbl_Patients";
SELECT * FROM "Tbl_Appointments";
SELECT * FROM "Tbl_Sessions";
SELECT * FROM "Tbl_Exercises";
```

### Restore from Backup
```sql
-- Assuming CSV files backed up
COPY "Tbl_Patients" FROM '/path/to/Tbl_Patients.csv' CSV HEADER;
COPY "Tbl_Appointments" FROM '/path/to/Tbl_Appointments.csv' CSV HEADER;
-- etc.
```

### Maintenance Queries

**Check database health**:
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_stat_get_live_tuples(c.oid) AS rows
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public'
  AND tablename LIKE 'Tbl_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Find unused indexes**:
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'Tbl_%'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Performance Considerations

### Indexes

Current indexes optimize:
1. **Therapist data lookup**: `idx_Tbl_Patients_user_id`
2. **Patient portal login**: `idx_Tbl_Patients_auth_id` (UNIQUE)
3. **Appointment date range queries**: `idx_Tbl_Appointments_date`
4. **Patient history lookup**: `idx_Tbl_Sessions_patient_id`

### Query Optimization Tips

1. **Always filter by user_id first** (therapist's data):
   ```sql
   WHERE user_id = 'therapist-uuid' AND ...
   ```

2. **Use indexed columns in WHERE clauses**:
   - ✅ `WHERE patient_id = 'P1A2'`
   - ❌ `WHERE LOWER(name) = 'john'` (not indexed)

3. **Limit result sets**:
   ```sql
   SELECT * FROM "Tbl_Sessions" 
   WHERE user_id = 'uuid' 
   ORDER BY date DESC 
   LIMIT 50;
   ```

---

## Troubleshooting

### Common Issues

**1. "relation does not exist" error**
```
Error: relation "tbl_patients" does not exist
```
**Fix**: Use double quotes for case-sensitive names:
```sql
SELECT * FROM "Tbl_Patients";
```

**2. Patient can't see their data**
**Check**:
```sql
-- Verify patient_auth_id is set
SELECT id, name, patient_auth_id, patient_email 
FROM "Tbl_Patients" 
WHERE id = 'P1A2';

-- Check user metadata
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'patient@example.com';
```

**3. Data not showing for therapist**
**Check user_id match**:
```sql
SELECT * FROM "Tbl_Patients" 
WHERE user_id = (SELECT auth.uid());
```

---

## Summary

**PhysioTrack Database** is designed for:
- ✅ Multi-tenant isolation (each therapist's data separate)
- ✅ Secure patient portal with read-only access
- ✅ Comprehensive appointment and session tracking
- ✅ Flexible exercise library and assignment system
- ✅ Audit trail via timestamps
- ✅ Automatic cleanup via CASCADE deletes
- ✅ Role-based access control via RLS

**Key Design Decisions**:
1. `user_id` links everything to therapist for isolation
2. `patient_id` is human-readable code, not UUID
3. Denormalized `patient_name` in appointments/sessions for performance
4. Exercise library uses NULL `patient_id` for reusability
5. Triggers handle automatic patient portal linking

---

**Version**: 1.0  
**Last Updated**: June 2, 2026  
**Database**: PostgreSQL 15 (Supabase)
