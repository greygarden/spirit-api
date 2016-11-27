-- Deploy spirit-api:create_dashboard_table to pg

BEGIN;

-- XXX Add DDLs here.

CREATE TABLE graphs (
    identifier              serial primary key,
    title                   text,
    worker_identifier       text references altar_workers(worker_identifier),
    metric_name             text,
    type                    text, -- line, bar, stackedLine etc.
    units                   text -- degreesCelcius, rpm, percent etc.
);

COMMIT;
