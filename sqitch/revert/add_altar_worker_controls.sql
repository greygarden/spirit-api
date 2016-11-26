-- Revert spirit-api:add_altar_worker_controls from pg

BEGIN;

-- XXX Add DDLs here.
DROP TABLE dashboard_controls;

COMMIT;
