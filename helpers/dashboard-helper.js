// -------------------------------------------------------------
// Helper functions related to dashboards
// -------------------------------------------------------------

const database = require('../libs/database')

module.exports = {
    // Add a new dashboard component at a particular position on the dashboard
    setComponentOrder: function *(component, newOrder) {
        // Check if the component is already on the dashboard
        const alreadyOnDashboard = yield database.queryPromise(database.SQL`
            SELECT identifier, component_order
            FROM dashboard_components
            WHERE identifier = ${component.identifier}
        `)
        if (alreadyOnDashboard.rows.length > 0) {
            // Decrement the order of all components after the one we're moving
            yield database.queryPromise(`
                UPDATE dashboard_components
                SET component_order = component_order - 1
                WHERE component_order > ${alreadyOnDashboard.rows[0].component_order}
                AND dashboard_identifier = ${component.dashboardIdentifier}
            `)
        }
        // Increment all components that have an index greater than the new order
        yield database.queryPromise(`
            UPDATE dashboard_components
            SET component_order = component_order + 1
            WHERE component_order >= ${newOrder}
            AND dashboard_identifier = ${component.dashboardIdentifier}
        `)

        // Move the component to it's new position, or create it there if it doesn't exist
        yield database.queryPromise(`
            INSERT INTO dashboard_components (dashboard_identifier, graph_identifier, control_identifier, component_order)
            VALUES (${component.dashboardIdentifier}, ${component.graphIdentifier}, ${component.controlIdentifier}, ${newOrder})
        `)
    }
}
