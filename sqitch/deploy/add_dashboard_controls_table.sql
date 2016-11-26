-- Deploy spirit-api:add_dashboard_controls_table to pg

BEGIN;

-- XXX Add DDLs here.
CREATE TABLE dashboard_controls (
    identifier                      serial primary key,
    dashboard_identifier            integer REFERENCES dashboards(identifier) NOT NULL,
    altar_worker_control_identifier integer REFERENCES altar_worker_controls(identifier),
    title                           text,
    type                            text -- 'input', 'boolean', etc
);

COMMIT;
