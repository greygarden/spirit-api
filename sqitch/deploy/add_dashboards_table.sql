-- Deploy spirit-api:add_dashboards_table to pg

BEGIN;

-- XXX Add DDLs here.
CREATE TABLE dashboards (
    identifier      serial primary key,
    user_identifier integer REFERENCES users(identifier),
    title           text
);

COMMIT;
