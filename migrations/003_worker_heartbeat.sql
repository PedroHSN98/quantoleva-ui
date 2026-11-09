-- Workers update this every loop; the app only offers locations that have a live worker.
alter table locations add column worker_seen_at timestamptz;
