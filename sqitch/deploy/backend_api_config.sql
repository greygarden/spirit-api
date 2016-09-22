-- Deploy spirit-api:backend_api_config to pg

BEGIN;

-- XXX Add DDLs here.
    CREATE TABLE backend_api_config (
        web_client_url text -- The URL that the frontend app will be on, used for CORS
    );

COMMIT;

COMMIT;
