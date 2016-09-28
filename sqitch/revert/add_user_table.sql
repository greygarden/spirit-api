-- Revert spirit-api:add_user_table from pg

BEGIN;

-- XXX Add DDLs here.

DROP TABLE users;

COMMIT;
