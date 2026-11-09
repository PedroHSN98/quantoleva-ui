-- Speed test clone schema (Postgres). Anonymous use for MVP; user_id nullable for later accounts.
create extension if not exists pgcrypto;

create table locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,            -- short id for permalink /result/{public_id}
  user_id uuid,                              -- null = anonymous (future auth)
  url text not null,
  final_url text,                            -- after redirects
  location_id uuid not null references locations(id) on delete restrict,
  status text not null default 'queued'
    check (status in ('queued','running','done','failed')),
  error_code text check (error_code in ('invalid_url','blocked_target','unreachable','timeout','internal')),
  grade text check (grade in ('A','B','C','D','E','F')),
  score smallint check (score between 0 and 100),
  load_ms integer,
  page_bytes bigint,
  request_count integer,
  client_ip_hash text,                       -- for rate limiting, hashed
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on tests (status, created_at);
create index on tests (location_id);
create index on tests (user_id, created_at desc);
create index on tests (client_ip_hash, created_at);

create table requests (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  seq integer not null,
  url text not null,
  domain text not null,
  content_type text not null default 'other'
    check (content_type in ('html','js','css','image','text','font','other')),
  status_code smallint,
  size_bytes bigint,
  start_ms integer not null,
  blocked_ms integer, dns_ms integer, connect_ms integer, ssl_ms integer,
  send_ms integer, wait_ms integer, receive_ms integer,
  is_redirect boolean not null default false,
  cacheable boolean,
  req_headers jsonb not null default '{}',
  res_headers jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (test_id, seq)
);
create index on requests (test_id, start_ms);
create index on requests (test_id, domain);
create index on requests (test_id, content_type);

create table rule_results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  rule_key text not null,                    -- e.g. 'compress_text', 'cache_headers'
  score smallint not null check (score between 0 and 100),
  advice text,
  created_at timestamptz not null default now(),
  unique (test_id, rule_key)
);
create index on rule_results (test_id);

-- Job queue (Postgres-backed, workers claim with FOR UPDATE SKIP LOCKED)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null unique references tests(id) on delete cascade,
  location_id uuid not null references locations(id) on delete restrict,
  attempts smallint not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on jobs (location_id, locked_at, created_at);

-- Access rules: no RLS while anonymous. Reads by public_id only; writes via server (service role).
-- When accounts arrive: enable RLS on tests (user_id = auth.uid()), keep public_id link reads via server.
