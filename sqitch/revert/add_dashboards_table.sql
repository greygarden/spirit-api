-- Revert spirit-api:add_dashboards_table from pg

BEGIN;

-- XXX Add DDLs here.
DROP TABLE dashboards;

COMMIT;
