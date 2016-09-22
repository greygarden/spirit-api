// -------------------------------------------------------------
// This file contains the config and endpoints for the nodejs backend
// server.
// -------------------------------------------------------------
'use strict';

const koa       = require('koa');
const router    = require('koa-router')();
const body      = require('koa-parse-json')();
const session   = require('koa-session');
const database  = require('./libs/database');


// Grab the port number to use for the server from the runtime environment
const port = parseInt(process.env.NODEJS_LISTEN_PORT, 10) || 8080;

// -------------------------------------------------------------
// Initialize the app and middleware
// -------------------------------------------------------------

// Initialize the koa app
const app = koa();

app.keys = [process.env.NODE_ENV === 'production' ? process.env.SESSION_KEY : 'fake dev key'];
app.use(body);

// Use the cookie session middleware
app.use(session(app));

// Catch errors in the app
app.use(function *(next) {
    try {
        yield next;
    } catch (error) {
        if (error) {
            console.log('error', { message: error.message, stack: error.stack });
            this.status = error.status || 500;
            this.body = error.message;
        }
    }
});

// -------------------------------------------------------------
// Define the routes for the API
// -------------------------------------------------------------

// Debug route at / for outputting server information
router.get('/', function *(next) {
    this.body = `Spirit by Kakushin Labs.`;
    yield next;
});

// Accept a metric for storage
router.post(
    '/metrics',
    function *(next) {
        // Grab the json from the request body
        const body = this.request.body || {};
        this.body = { success: true };
        // Create a new row for the worker if we haven't seen it before
        yield database.queryPromise(database.SQL`INSERT INTO altar_workers (worker_identifier) VALUES (${body.workerIdentifier}) ON CONFLICT (worker_identifier) DO NOTHING`);
        // Insert the metric
        yield database.queryPromise(database.SQL`INSERT INTO metrics (worker_identifier, name, value, units) VALUES (${body.workerIdentifier}, ${body.metricName}, ${body.metricValue}, ${body.metricUnits})`);
        yield next;
    }
);

// Returns the last 24 hours of metrics
router.get(
    '/metrics',
    function *(next) {
        const metricName = this.request.query.metricName;
        const workerIdentifier = this.request.query.workerIdentifier;
        const startTimestamp = this.request.query.startTimestamp;
        const endTimestamp = this.request.query.endTimestamp;
        const metrics = yield database.queryPromise(database.SQL`SELECT * FROM metrics WHERE worker_identifier = ${workerIdentifier} AND name = ${metricName} AND metric_timestamp > ${startTimestamp} AND metric_timestamp < ${endTimestamp}`);
        console.log(database.SQL`SELECT * FROM metrics WHERE worker_identifier = ${workerIdentifier} AND name = ${metricName} AND metric_timestamp > ${startTimestamp} AND metric_timestamp < ${endTimestamp}`);
        this.body = {
            metrics: metrics.rows
        }
        yield next;
    }
);


// Use the routes defined earlier
app.use(router.routes());
app.use(router.allowedMethods());

// Listen on the pre defined port.
console.log('info', { message: 'Spirit API started and listening on port ' + port });

app.listen(port, '0.0.0.0');
