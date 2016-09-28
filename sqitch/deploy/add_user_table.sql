-- Deploy spirit-api:add_user_table to pg

BEGIN;

-- XXX Add DDLs here.

CREATE TABLE users (
    identifier      serial primary key,
    email           varchar(256) unique not null,
    password        varchar(256) not null,
    salt            varchar(256) not null
);

COMMIT;
