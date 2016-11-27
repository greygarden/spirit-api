-- Deploy spirit-api:add_dashboard_components_table to pg

BEGIN;

-- XXX Add DDLs here.
CREATE TABLE dashboard_components (
    identifier              serial primary key,
    dashboard_identifier    integer REFERENCES dashboards(identifier),
    graph_identifier        integer REFERENCES graphs(identifier),
    control_identifier      integer REFERENCES dashboard_controls(identifier),
    component_order         integer -- Allows storage of the order of components on a dashboard
);

COMMIT;
