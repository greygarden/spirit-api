-- Deploy spirit-api:add_altar_worker_controls to pg

BEGIN;

-- XXX Add DDLs here.
CREATE TABLE altar_worker_controls (
    identifier                  serial primary key,
    altar_worker_identifier     integer REFERENCES altar_workers(identifier),
    control_key                 text,
    UNIQUE (altar_worker_identifier, control_key)
);

COMMIT;
