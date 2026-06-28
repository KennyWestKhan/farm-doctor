-- Farm Doctor Ghana — Supabase schema
-- Run in the Supabase SQL editor once the project exists.
-- The disease/treatment/supplier content ships in the frontend bundle for offline
-- use; these tables capture FARMER-GENERATED data (reports + validations) plus
-- optional server copies of reference data for the dashboard.

create extension if not exists "pgcrypto";

create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text,
  twi_name text
);

create table if not exists diseases (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  crop_slug text,
  name text,
  twi_name text,
  symptoms text,
  regional_prevalence jsonb,
  seasonal_months int[],
  peak_month int
);

create table if not exists treatments (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  disease_slug text,
  name text,
  price_range text,
  technical_instruction text,
  farmer_instruction_english jsonb,
  farmer_instruction_twi jsonb,
  video_url text
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text,
  region text,
  town text,
  lat double precision,
  lng double precision,
  whatsapp text,
  products_sold text[],
  price_range text
);

create table if not exists farmer_reports (
  id uuid primary key default gen_random_uuid(),
  farmer_phone_hash text,
  crop_slug text,
  disease_slug text,
  region text,
  confidence real,
  status text,           -- confident | uncertain | no_match
  offline boolean,
  created_at timestamptz default now()
);

create table if not exists validations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid,
  treatment_id text,     -- treatment slug from the local DB
  region text,
  treatment_worked boolean,
  outcome text,          -- worked | partial | failed
  notes text,
  created_at timestamptz default now()
);

-- User preferences (synced from device for logged-in users).
-- Currently stored in IndexedDB on-device; this table receives synced copies for
-- logged-in users so preferences survive device changes. Wiring is planned.
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id),
  region text,
  lang text default 'en',
  crop_ids text[] default '{}',
  favourite_suppliers jsonb default '[]',
  default_supplier_id text,
  updated_at timestamptz default now()
);

-- Supplier notes (per user). Planned: farmers can leave private notes about
-- suppliers (e.g. "good prices", "out of stock last time"). Stored locally via
-- IndexedDB; this table syncs notes for logged-in users.
create table if not exists supplier_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  supplier_id text not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, supplier_id)
);

-- App reviews / ratings (unique per device fingerprint or user)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  user_id uuid references auth.users(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Shop submissions from farmers, pending admin approval.
create table if not exists shop_submissions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  name text not null,
  region text not null,
  town text,
  whatsapp text,
  phone text,
  products text,
  note text,
  approved boolean default false,
  created_at timestamptz default now()
);

-- Convenience view: success rate by treatment + region for the dashboard.
create or replace view treatment_success_rates as
select
  treatment_id,
  region,
  count(*) as total,
  count(*) filter (where outcome = 'worked')  as success,
  count(*) filter (where outcome = 'partial') as partial,
  count(*) filter (where outcome = 'failed')  as failed,
  round(100.0 * count(*) filter (where outcome = 'worked') / nullif(count(*),0)) as success_percent
from validations
group by treatment_id, region;
