-- Revert spirit-api:add_worker_name from pg

BEGIN;

-- XXX Add DDLs here

ALTER TABLE altar_workers DROP COLUMN name;

COMMIT;
