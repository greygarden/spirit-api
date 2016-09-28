-- Verify spirit-api:backend_api_config on pg

BEGIN;

-- XXX Add verifications here.

SELECT true FROM backend_api_config;

ROLLBACK;
