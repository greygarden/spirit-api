-- Verify spirit-api:add_altar_worker_controls on pg

BEGIN;

-- XXX Add verifications here.
SELECT true FROM dashboard_controls LIMIT 1;

ROLLBACK;
