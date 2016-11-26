-- Verify spirit-api:add_dashboards_table on pg

BEGIN;

-- XXX Add verifications here.
SELECT true FROM dashboards LIMIT 1;

ROLLBACK;
