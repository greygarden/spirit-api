-- Verify spirit-api:add_dashboard_components_table on pg

BEGIN;

-- XXX Add verifications here.
SELECT true FROM dashboard_components;

ROLLBACK;
