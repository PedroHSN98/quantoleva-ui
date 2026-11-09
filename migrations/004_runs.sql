-- Each test now runs up to 3 times. The summary and the waterfall come from the median run.
alter table tests add column runs_done smallint not null default 0;

create table test_runs (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  run_no smallint not null check (run_no between 1 and 3),
  load_ms integer not null,
  page_bytes bigint not null,
  request_count integer not null,
  is_median boolean not null default false,
  created_at timestamptz not null default now(),
  unique (test_id, run_no)
);
create index on test_runs (test_id);
