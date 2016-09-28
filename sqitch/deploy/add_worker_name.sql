-- Deploy spirit-api:add_worker_name to pg

BEGIN;

-- XXX Add DDLs here.

ALTER TABLE altar_workers ADD COLUMN name varchar(256);

COMMIT;
