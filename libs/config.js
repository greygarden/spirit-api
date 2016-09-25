// -------------------------------------------------------------
// This file contains a helper that gets the api config from the database.
// NOTE: The config values are cached on first load and 
// as a result changes to config require a server restart to take effect.
// -------------------------------------------------------------
'use strict';

const database    = require('./database');

let config;

module.exports = {

    getConfig: function *() {
        // Check if the config has already been loaded from the DB
        if (!config) {
            // Get the api config from the database
            const configResult = yield database.queryPromise(`SELECT * FROM backend_api_config LIMIT 1`);
            // If there were no results, throw an error
            if (configResult.rows.length === 0) {
                throw new Error('Tried to get config data from the api_config table but no results were found.');
            } else {
                config = configResult.rows[0];
            }
        }
        return config;
    }
};
