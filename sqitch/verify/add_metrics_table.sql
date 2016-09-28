-- Verify spirit-api:add_metrics_table on pg

BEGIN;

-- XXX Add verifications here.

SELECT true FROM metrics;

ROLLBACK;
