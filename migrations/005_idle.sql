-- When the page stopped downloading files, next to load_ms (time to the browser "load" event).
-- idle_reached is false when the network was still busy after the 10 s we wait; idle_ms is then "more than" that.
alter table tests add column idle_ms integer;
alter table tests add column idle_reached boolean;
