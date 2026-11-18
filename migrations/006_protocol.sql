-- Network protocol per request (e.g. 'h2', 'h3', 'http/1.1'), from CDP response.protocol.
-- Null for tests measured before this column existed; the protocol diagnostic only runs when present.
alter table requests add column protocol text;
