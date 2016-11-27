// -------------------------------------------------------------
// Endpoints for interacting with dashboards.
// -------------------------------------------------------------

const database = require('../libs/database')

module.exports = {
    // Get all of a users dashboards
    dashboards: function *(next) {
        const dashboards = yield database.queryPromise(database.SQL`SELECT * from dashboards WHERE user_identifier = ${this.session.userIdentifier}`);
        this.body = {
            errors: [],
            dashboards: dashboards.rows.map((dashboard) => {
                return {
                    identifier: dashboard.identifier,
                    title: dashboard.title,
                }
            })
        }
        yield next
    },

    // Get a single dashboard by its id
    getDashboard: function *(next) {
        if (this.query.dashboardIdentifier) {
            const dashboard = yield database.queryPromise(database.SQL`SELECT * from dashboards WHERE identifier = ${this.query.dashboardIdentifier}`)
            this.body = {
                errors: [],
                dashboard: dashboard.rows[0]
            }
        } else {
            this.body = {
                errors: [
                    `Dashboard with identifier ${this.query.dashboardIdentifier} was not found.`
                ]
            }
        }
        yield next
    },

    // Create a new dashboard
    createDashboard: function *(next) {
        // Grab the json from the request body
        const dashboard = yield database.queryPromise(`
            INSERT INTO dashboards (user_identifier, title)
            VALUES (${this.session.userIdentifier}, 'New Dashboard')
            RETURNING identifier, title
        `);
        this.body = {
            errors: [],
            dashboard: dashboard.rows[0]
        }
        yield next;
    },

    // Update a dashboard
    updateDashboard: function *(next) {
        // Grab the json from the request body
        const body = this.request.body || {};
        const dashboardResult = yield database.queryPromise(`
            UPDATE dashboards SET
            title = '${body.dashboardProps.title}'
            WHERE identifier = ${body.identifier}
            RETURNING identifier, title
        `);

        if (dashboardResult.rows.length === 0) {
            this.body = {
                errors: [
                    `Missing parameter dashboardIdentifier`
                ]
            }
            yield next
            return
        }

        const dashboard = dashboardResult.rows[0]
        this.body = {
            errors: [],
            dashboard: {
                identifier: dashboard.identifier,
                title: dashboard.title,
            }
        }
        yield next
    },

    // Delete a dashboard
    deleteDashboard: function *(next) {
        // Grab the json from the request body
        const body = this.request.body || {};
        yield database.queryPromise(`
            DELETE FROM dashboards WHERE identifier = ${body.identifier}
        `);
        this.body = {
            errors: []
        }
        yield next;
    },

    // Gets all components associated with a dashboard (i.e graphs and controls)
    dashboardComponents: function *(next) {
        if (this.query.dashboardIdentifier) {
            const graphs = yield database.queryPromise(database.SQL`
                SELECT * FROM dashboard_components
                INNER JOIN graphs
                ON (dashboard_components.graph_identifier = graphs.identifier)
                WHERE dashboard_identifier = ${this.query.dashboardIdentifier}
            `);
            const controls = yield database.queryPromise(database.SQL`
                SELECT * FROM dashboard_components
                INNER JOIN dashboard_controls
                ON (dashboard_components.control_identifier = dashboard_controls.identifier)
                WHERE dashboard_identifier = ${this.query.dashboardIdentifier}
            `);

            // Mix the components together in their appropriate order
            let components = []
            for (let graph of graphs.rows) {
                components[graph.component_order] = {
                    identifier: graph.identifier,
                    componentType: 'graph',
                    type: graph.type,
                    title: graph.title,
                    dashboardIdentifier: graph.dashboard_identifier,
                    workerIdentifier: graph.worker_identifier,
                    metricName: graph.metric_name,
                    units: graph.units
                }
            }
            for (let control of controls.rows) {
                components[control.component_order] = {
                    identifier: control.identifier,
                    componentType: 'control',
                    type: control.type,
                    title: control.title,
                    dashboardIdentifier: control.dashboard_identifier,
                }
            }

            this.body = {
                errors: [],
                components
            }
        } else {
            this.body = {
                errors: [
                    'Missing parameter: dashboardIdentifier'
                ]
            }
        }
        yield next
    }
}
