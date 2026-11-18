-- Core Web Vitals and a loading filmstrip. All nullable: tests measured before this stay valid,
-- and the UI shows these sections only when the data is present.
alter table tests
  add column fcp_ms integer,
  add column lcp_ms integer,
  add column cls numeric(6,3),
  add column tbt_ms integer,
  add column ttfb_ms integer;

-- A handful of downscaled JPEG frames (stored as data: URLs) showing the page appearing over time.
create table test_frames (
  test_id uuid not null references tests(id) on delete cascade,
  at_ms integer not null,
  image text not null,
  primary key (test_id, at_ms)
);
