-- Verify spirit-api:add_altar_workers_table on pg

BEGIN;

-- XXX Add verifications here.
    SELECT true FROM altar_workers;

ROLLBACK;
