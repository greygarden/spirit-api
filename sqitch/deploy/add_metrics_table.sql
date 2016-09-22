-- Deploy spirit-api:add_metrics_table to pg

BEGIN;

-- XXX Add DDLs here.
    CREATE TABLE metrics (
        identifier          serial primary key,
        worker_identifier   text REFERENCES altar_workers(worker_identifier),
        metric_timestamp    timestamp with time zone DEFAULT now(),
        name                text,
        value               decimal,
        units               text -- e.g mL, lumens, litres / hour
    );

COMMIT;
