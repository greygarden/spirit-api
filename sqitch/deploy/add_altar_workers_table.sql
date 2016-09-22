-- Deploy spirit-api:add_altar_workers_table to pg

BEGIN;

-- XXX Add DDLs here.
    CREATE TABLE altar_workers (
        identifier          serial primary key,
        worker_identifier   text UNIQUE NOT NULL -- This is a UUID that is written into the EEPROM of the arduino
    );

COMMIT;
