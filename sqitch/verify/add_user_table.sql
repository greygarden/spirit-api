-- Verify spirit-api:add_user_table on pg

BEGIN;

-- XXX Add verifications here.

SELECT true FROM users;

ROLLBACK;
