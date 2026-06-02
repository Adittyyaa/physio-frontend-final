-- ============================================================
-- PhysioTrack — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ── PATIENTS ─────────────────────────────────────────────────
create table if not exists tbl_patients (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  patient_auth_id uuid references auth.users(id) on delete set null,
  patient_email text,
  name          text not null,
  age           integer,
  gender        text,
  phone         text,
  diagnosis     text,
  treatment_area text,
  referred_by   text,
  notes         text,
  allow_reschedule boolean default true,
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ── APPOINTMENTS ──────────────────────────────────────────────
create table if not exists tbl_appointments (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  patient_id    text references tbl_patients(id) on delete cascade,
  patient_name  text,
  date          date not null,
  time          text not null,
  duration      text default '60',
  type          text default 'Regular Session',
  notes         text,
  reminder      boolean default true,
  status        text default 'scheduled', -- scheduled | completed | cancelled | pending
  created_at    timestamptz default now()
);

-- ── SESSIONS ──────────────────────────────────────────────────
create table if not exists tbl_sessions (
  id                text primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  patient_id        text references tbl_patients(id) on delete cascade,
  patient_name      text,
  date              date not null,
  session_num       integer,
  pain              integer check (pain >= 0 and pain <= 10),
  exercises         text[],          -- array of exercise names
  current_treatment text,
  progress          text,
  next_plan         text,
  home_exercises    text,
  rating            integer check (rating >= 1 and rating <= 5),
  private_notes     text,
  created_at        timestamptz default now()
);

-- ── EXERCISES ─────────────────────────────────────────────────
create table if not exists tbl_exercises (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  patient_id    text references tbl_patients(id) on delete cascade default null,
  name          text not null,
  category      text not null default 'other', -- neck|shoulder|back|knee|hip|ankle|other
  reps          text,
  instructions  text,
  media         text,   -- URL to video/image
  active        boolean default true,
  created_at    timestamptz default now()
);

-- Migration: add patient_id to existing exercises table if not present
alter table tbl_exercises add column if not exists patient_id text references tbl_patients(id) on delete cascade default null;

-- Migration: add active column to existing exercises table if not present
alter table tbl_exercises add column if not exists active boolean default true;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table tbl_patients enable row level security;
alter table tbl_appointments enable row level security;
alter table tbl_sessions enable row level security;
alter table tbl_exercises enable row level security;

-- Policies: users can only see and modify their own data
create policy "patients_own" on tbl_patients
  for all using (auth.uid() = user_id);

create policy "appointments_own" on tbl_appointments
  for all using (auth.uid() = user_id);

create policy "sessions_own" on tbl_sessions
  for all using (auth.uid() = user_id);

create policy "exercises_own" on tbl_exercises
  for all using (auth.uid() = user_id);

-- ── Patient login (optional) ─────────────────────────────────
-- If you create auth users for patients, set their user_metadata:
--   role = "patient"
--   patient_id = "<tbl_patients.id>"
--
-- Then these policies allow patients to READ their own patient record + appointments/sessions.
create policy "patients_patient_read" on tbl_patients
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'patient'
    and id = (auth.jwt() -> 'user_metadata' ->> 'patient_id')
  );

create policy "appointments_patient_read" on tbl_appointments
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'patient'
    and patient_id = (auth.jwt() -> 'user_metadata' ->> 'patient_id')
  );

create policy "sessions_patient_read" on tbl_sessions
  for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'patient'
    and patient_id = (auth.jwt() -> 'user_metadata' ->> 'patient_id')
  );

-- ── INDEXES ───────────────────────────────────────────────────
create index if not exists idx_patients_user on tbl_patients(user_id);
create unique index if not exists idx_patients_auth on tbl_patients(patient_auth_id);
create index if not exists idx_appointments_user on tbl_appointments(user_id);
create index if not exists idx_appointments_date on tbl_appointments(date);
create index if not exists idx_sessions_user on tbl_sessions(user_id);
create index if not exists idx_sessions_patient on tbl_sessions(patient_id);
create index if not exists idx_exercises_user on tbl_exercises(user_id);

-- ── Patient portal access (optional) ─────────────────────────
-- Secure patient access uses `tbl_patients.patient_auth_id = auth.uid()`.
-- This avoids relying on `user_metadata` claims in RLS (which are user-editable).
drop policy if exists "patients_patient_read" on tbl_patients;
drop policy if exists "appointments_patient_read" on tbl_appointments;
drop policy if exists "sessions_patient_read" on tbl_sessions;
drop policy if exists "patients_portal_read" on tbl_patients;
drop policy if exists "appointments_portal_read" on tbl_appointments;
drop policy if exists "sessions_portal_read" on tbl_sessions;
drop policy if exists "exercises_portal_read" on tbl_exercises;

-- Patients can read their own patient row
create policy "patients_portal_read" on tbl_patients
  for select
  using (patient_auth_id = (select auth.uid()));

-- Patients can read their own appointments (joined via patient row)
create policy "appointments_portal_read" on tbl_appointments
  for select
  using (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_appointments.patient_id
        and p.patient_auth_id = (select auth.uid())
    )
  );

-- Patients can read their own sessions (joined via patient row)
create policy "sessions_portal_read" on tbl_sessions
  for select
  using (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_sessions.patient_id
        and p.patient_auth_id = (select auth.uid())
    )
  );

-- Patients can read library exercises (patient_id is null) OR their own assigned exercises
create policy "exercises_portal_read" on tbl_exercises
  for select
  using (
    exists (
      select 1
      from tbl_patients p
      where p.patient_auth_id = auth.uid()
        and (tbl_exercises.patient_id = p.id or (tbl_exercises.patient_id is null and tbl_exercises.user_id = p.user_id))
    )
  );

-- Patients can insert exercises for themselves
create policy "exercises_portal_insert" on tbl_exercises
  for insert
  with check (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- Patients can delete their own assigned exercises
create policy "exercises_portal_delete" on tbl_exercises
  for delete
  using (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- Patients can update their own assigned exercises (e.g. toggle active)
create policy "exercises_portal_update" on tbl_exercises
  for update
  using (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from tbl_patients p
      where p.id = tbl_exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- ── AUTOMATIC PATIENT LINKING TRIGGERS ───────────────────────

-- 1. Trigger BEFORE user insertion in auth.users to set correct metadata roles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_patient_id text;
  input_role text;
begin
  -- Check if role is already specified in signup metadata
  input_role := new.raw_user_meta_data->>>'role';
  
  -- Check if the email exists in public.tbl_patients
  select id into matching_patient_id
  from public.tbl_patients
  where patient_email = new.email
  limit 1;

  -- If they signed up with a patient code in metadata
  if new.raw_user_meta_data->>>'patient_id' is not null and new.raw_user_meta_data->>>'patient_id' <> '' then
    matching_patient_id := new.raw_user_meta_data->>>'patient_id';
  end if;

  if matching_patient_id is not null or input_role = 'patient' then
    -- It is a patient! Set role and patient_id in user_metadata
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'patient', 'patient_id', matching_patient_id);
  else
    -- Default to therapist role
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'therapist');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_before on auth.users;
create trigger on_auth_user_created_before
  before insert on auth.users
  for each row
  execute function public.handle_new_user();


-- 2. Trigger AFTER user insertion in auth.users to link patient_auth_id
create or replace function public.handle_new_user_after()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tbl_patients
  set patient_auth_id = new.id
  where patient_email = new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_after on auth.users;
create trigger on_auth_user_created_after
  after insert on auth.users
  for each row
  execute function public.handle_new_user_after();


-- 3. Trigger BEFORE INSERT or UPDATE on public.tbl_patients to auto-link if auth user already exists
create or replace function public.handle_patient_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_user_id uuid;
begin
  if new.patient_email is not null then
    -- Check if a user with this email already exists in auth.users
    select id into existing_user_id
    from auth.users
    where email = new.patient_email
    limit 1;

    if existing_user_id is not null then
      -- Link them immediately
      new.patient_auth_id := existing_user_id;

      -- Update their role in auth.users to 'patient'
      update auth.users
      set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'patient', 'patient_id', new.id)
      where id = existing_user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_patient_email_upsert on public.tbl_patients;
create trigger on_patient_email_upsert
  before insert or update of patient_email on public.tbl_patients
  for each row
  execute function public.handle_patient_email_change();
