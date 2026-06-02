-- ============================================================
-- PhysioTrack — Supabase Schema (IMPROVED NAMING CONVENTION)
-- Tables: Tbl_ prefix with PascalCase
-- Columns: snake_case
-- Run this in the Supabase SQL Editor for NEW installations
-- For EXISTING databases, use rename_tables_migration.sql instead
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ── TBL_PATIENTS ─────────────────────────────────────────────────
create table if not exists Tbl_Patients (
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

-- ── TBL_APPOINTMENTS ──────────────────────────────────────────────
create table if not exists Tbl_Appointments (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  patient_id    text references Tbl_Patients(id) on delete cascade,
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

-- ── TBL_SESSIONS ──────────────────────────────────────────────────
create table if not exists Tbl_Sessions (
  id                text primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  patient_id        text references Tbl_Patients(id) on delete cascade,
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

-- ── TBL_EXERCISES ─────────────────────────────────────────────────
create table if not exists Tbl_Exercises (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  patient_id    text references Tbl_Patients(id) on delete cascade default null,
  name          text not null,
  category      text not null default 'other', -- neck|shoulder|back|knee|hip|ankle|other
  reps          text,
  instructions  text,
  media         text,   -- URL to video/image
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table Tbl_Patients enable row level security;
alter table Tbl_Appointments enable row level security;
alter table Tbl_Sessions enable row level security;
alter table Tbl_Exercises enable row level security;

-- Policies: users can only see and modify their own data
create policy "Tbl_Patients_own" on Tbl_Patients
  for all using (auth.uid() = user_id);

create policy "Tbl_Appointments_own" on Tbl_Appointments
  for all using (auth.uid() = user_id);

create policy "Tbl_Sessions_own" on Tbl_Sessions
  for all using (auth.uid() = user_id);

create policy "Tbl_Exercises_own" on Tbl_Exercises
  for all using (auth.uid() = user_id);

-- ── Patient portal access ─────────────────────────────────────────
-- Patients can read their own patient row
create policy "Tbl_Patients_portal_read" on Tbl_Patients
  for select
  using (patient_auth_id = (select auth.uid()));

-- Patients can read their own appointments
create policy "Tbl_Appointments_portal_read" on Tbl_Appointments
  for select
  using (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Appointments.patient_id
        and p.patient_auth_id = (select auth.uid())
    )
  );

-- Patients can read their own sessions
create policy "Tbl_Sessions_portal_read" on Tbl_Sessions
  for select
  using (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Sessions.patient_id
        and p.patient_auth_id = (select auth.uid())
    )
  );

-- Patients can read library exercises OR their own assigned exercises
create policy "Tbl_Exercises_portal_read" on Tbl_Exercises
  for select
  using (
    exists (
      select 1
      from Tbl_Patients p
      where p.patient_auth_id = auth.uid()
        and (Tbl_Exercises.patient_id = p.id or (Tbl_Exercises.patient_id is null and Tbl_Exercises.user_id = p.user_id))
    )
  );

-- Patients can insert exercises for themselves
create policy "Tbl_Exercises_portal_insert" on Tbl_Exercises
  for insert
  with check (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- Patients can delete their own assigned exercises
create policy "Tbl_Exercises_portal_delete" on Tbl_Exercises
  for delete
  using (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- Patients can update their own assigned exercises
create policy "Tbl_Exercises_portal_update" on Tbl_Exercises
  for update
  using (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from Tbl_Patients p
      where p.id = Tbl_Exercises.patient_id
        and p.patient_auth_id = auth.uid()
    )
  );

-- ── INDEXES ───────────────────────────────────────────────────────
create index if not exists idx_Tbl_Patients_user_id on Tbl_Patients(user_id);
create unique index if not exists idx_Tbl_Patients_auth_id on Tbl_Patients(patient_auth_id);
create index if not exists idx_Tbl_Appointments_user_id on Tbl_Appointments(user_id);
create index if not exists idx_Tbl_Appointments_date on Tbl_Appointments(date);
create index if not exists idx_Tbl_Sessions_user_id on Tbl_Sessions(user_id);
create index if not exists idx_Tbl_Sessions_patient_id on Tbl_Sessions(patient_id);
create index if not exists idx_Tbl_Exercises_user_id on Tbl_Exercises(user_id);

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
  input_role := new.raw_user_meta_data->>>'role';
  
  select id into matching_patient_id
  from public.Tbl_Patients
  where patient_email = new.email
  limit 1;

  if new.raw_user_meta_data->>>'patient_id' is not null and new.raw_user_meta_data->>>'patient_id' <> '' then
    matching_patient_id := new.raw_user_meta_data->>>'patient_id';
  end if;

  if matching_patient_id is not null or input_role = 'patient' then
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'patient', 'patient_id', matching_patient_id);
  else
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

-- 2. Trigger AFTER user insertion to link patient_auth_id
create or replace function public.handle_new_user_after()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.Tbl_Patients
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

-- 3. Trigger BEFORE INSERT/UPDATE on Tbl_Patients to auto-link
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
    select id into existing_user_id
    from auth.users
    where email = new.patient_email
    limit 1;

    if existing_user_id is not null then
      new.patient_auth_id := existing_user_id;

      update auth.users
      set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'patient', 'patient_id', new.id)
      where id = existing_user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_patient_email_upsert on public.Tbl_Patients;
create trigger on_patient_email_upsert
  before insert or update of patient_email on public.Tbl_Patients
  for each row
  execute function public.handle_patient_email_change();
