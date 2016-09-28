-- Revert spirit-api:add_altar_workers_table from pg

BEGIN;

-- XXX Add DDLs here.

DROP TABLE altar_workers;

COMMIT;
