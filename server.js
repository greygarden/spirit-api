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
const io        = require('socket.io')('8082');


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
        // Emit an event over any connected web socketes
        io.emit('metric', {
            value: body.metricValue,
            units: body.metrivUnits
        });
        yield next;
    }
);

// Returns a variable amount of metrics grouped in specified ways
router.get(
    '/metrics',
    function *(next) {
        const metricName = this.request.query.metricName;
        const workerIdentifier = this.request.query.workerIdentifier;
        const startTimestamp = this.request.query.startTimestamp;
        const endTimestamp = this.request.query.endTimestamp;
        const groupBySeconds = this.request.query.groupBySeconds;
        const metrics = yield database.queryPromise(database.SQL`
            SELECT to_timestamp(floor((extract('epoch' from metric_timestamp) / ${groupBySeconds} )) * ${groupBySeconds}) as timestamp,
            avg(value) AS value FROM metrics
            WHERE worker_identifier = ${workerIdentifier}
            AND name = ${metricName}
            AND metric_timestamp > ${startTimestamp}
            AND metric_timestamp < ${endTimestamp}
            GROUP BY timestamp
            ORDER BY timestamp ASC
        `);
        this.body = {
            metrics: metrics.rows
        }
        yield next;
    }
);

// Returns the minimum value of a metric between two timestamps
router.get(
    '/metric_min',
    function *(next) {
        const metricName = this.request.query.metricName;
        const workerIdentifier = this.request.query.workerIdentifier;
        const startTimestamp = this.request.query.startTimestamp;
        const endTimestamp = this.request.query.endTimestamp;
        const metrics = yield database.queryPromise(database.SQL`
            SELECT min(value) AS value FROM metrics
            WHERE worker_identifier = ${workerIdentifier}
            AND name = ${metricName}
            AND metric_timestamp > ${startTimestamp}
            AND metric_timestamp < ${endTimestamp}
        `);
        this.body = {
            minValue: metrics.rows.length > 0 ? metrics.rows[0].value : 0
        }
        yield next;
    }
);

// Returns the minimum value of a metric between two timestamps
router.get(
    '/metric_max',
    function *(next) {
        const metricName = this.request.query.metricName;
        const workerIdentifier = this.request.query.workerIdentifier;
        const startTimestamp = this.request.query.startTimestamp;
        const endTimestamp = this.request.query.endTimestamp;
        const metrics = yield database.queryPromise(database.SQL`
            SELECT max(value) AS value FROM metrics
            WHERE worker_identifier = ${workerIdentifier}
            AND name = ${metricName}
            AND metric_timestamp > ${startTimestamp}
            AND metric_timestamp < ${endTimestamp}
        `);
        this.body = {
            maxValue: metrics.rows.length > 0 ? metrics.rows[0].value : 0
        }
        yield next;
    }
);

// Add CORS headers
app.use(function *(next) {
    const config = yield require('./libs/config').getConfig();
    this.set('Access-Control-Allow-Origin', config.web_client_url);
    this.set('Access-Control-Allow-Credentials', 'true');
    this.set('Access-Control-Allow-Headers', 'X-Csrf-Token, X-Requested-With');
    this.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    this.set('Access-Control-Max-Age', 300);

    yield next;
});


// Use the routes defined earlier
app.use(router.routes());
app.use(router.allowedMethods());

// Listen on the pre defined port.
console.log('info', { message: 'Spirit API started and listening on port ' + port });

app.listen(port, '0.0.0.0');
