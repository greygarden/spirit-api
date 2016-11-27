-- Revert spirit-api:add_dashboard_components_table from pg

BEGIN;

-- XXX Add DDLs here.
DROP TABLE dashboard_components;

COMMIT;
