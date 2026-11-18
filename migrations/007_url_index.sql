-- Speeds up the "Evolução" history lookup: past tests of the same URL+location.
create index if not exists tests_url_location_idx on tests (url, location_id, created_at desc);
