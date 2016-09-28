-- Verify spirit-api:add_worker_name on pg

BEGIN;

-- XXX Add verifications here.

SELECT name FROM altar_workers LIMIT 1;

ROLLBACK;
