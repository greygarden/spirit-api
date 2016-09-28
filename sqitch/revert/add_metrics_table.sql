-- Revert spirit-api:add_metrics_table from pg

BEGIN;

-- XXX Add DDLs here.

DROP TABLE metrics;

COMMIT;
