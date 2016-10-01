-- Revert spirit-api:create_dashboard_table from pg

BEGIN;

-- XXX Add DDLs here.

DROP TABLE graphs;

COMMIT;
