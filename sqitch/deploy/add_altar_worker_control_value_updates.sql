-- Deploy spirit-api:add_altar_worker_control_value_updates to pg

BEGIN;

-- XXX Add DDLs here.
CREATE TABLE altar_worker_control_value_updates (
    identifier                          serial primary key,
    altar_worker_control_identifier     integer REFERENCES altar_worker_controls(identifier),
    control_value                       text,
    update_time                         timestamp with time zone,
    acknowledged                        boolean -- Whether or not the manager / worker has responded saying the value was succesfully updated
);

COMMIT;
