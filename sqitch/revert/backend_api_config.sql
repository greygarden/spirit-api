-- Revert spirit-api:backend_api_config from pg

BEGIN;

-- XXX Add DDLs here.
    DROP TABLE backend_api_config;

COMMIT;
