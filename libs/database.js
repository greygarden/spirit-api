// -------------------------------------------------------------
// This file contains a method for generating Postgresql connections.
// -------------------------------------------------------------
'use strict';

const pg = require('co-pg')(require('pg'));

module.exports = {

    // Allow ES6 template strings to be used, i.e. queryPromise(SQL`INSERT INTO table VALUES (${foo}, ${bar})`)
    SQL: (parts, ...values) => {
      return {
        text: parts.reduce((prev, curr, i) => prev + "$" + i + curr),
        values
      };
    },

    queryPromise: *(queryString, queryParameters) => {
        const connection = yield pg.connectPromise(process.env.DB_CONNECTION_STRING);
        const client = connection[0];
        // The `done` method returns the connection to the pool
        const done = connection[1];
        let dbResult;
        try {
            dbResult = yield client.queryPromise(queryString, queryParameters);
        } catch (error) {
            done();
            throw error;
        }
        done();
        return dbResult;
    },

    end: function () {
        pg.end();
    }
};