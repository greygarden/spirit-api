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
const crypto    = require('crypto');


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

router.post(
    '/auth/login',
    function *(next) {
        const response = {
            success: false,
            errors: [],
            user: null
        };

        const body = this.request.body || {};
        const email = body.email;
        const password = body.password;

        // Get the user's salt from the database
        const userResult = yield database.queryPromise(database.SQL`SELECT identifier, email, salt FROM users WHERE email = ${email} LIMIT 1`);
        // If there were no matches for the email, just return failed
        let success;
        if (userResult.rows.length === 0) {
            success = false;
        } else {
            const salt = userResult.rows[0].salt;

            const keyBuffer = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
            const keyString = keyBuffer.toString('hex');
            const loginResult = yield database.queryPromise(database.SQL`SELECT NULL FROM users WHERE email = ${email} AND password = ${keyString} LIMIT 1`);

            success = loginResult.rowCount === 1;
        }

        if (success !== true) {
            response.errors.push('Email or password is incorrect.');
            this.body = response;
            yield next;
            return;
        }

        if (success && response.errors.length === 0) {
            response.success = true;
            this.session = { 'userIdentifier': userResult.rows[0].identifier };
            response.user = { email: userResult.rows[0].email }
        }

        this.body = response;
        yield next;
    }
);

router.post(
    '/auth/logout',
    function *(next) {
        this.session = null;
        this.body = { 'success': true, 'errors': [] };
        yield next;
    }
);

// Get all graphs
router.get(
    '/graphs',
    function *(next) {
        const graphs = yield database.queryPromise('SELECT * from graphs');
        this.body = {
            errors: [],
            graphs: graphs.rows.map((graph) => {
                return { 
                    identifier: graph.identifier,
                    type: graph.type,
                    title: graph.title,
                    workerIdentifier: graph.worker_identifier,
                    metricName: graph.metric_name,
                    units: graph.units
                }
            })
        }
    }
);

// Create a new graph
router.post(
    '/create_graph',
    function *(next) {
        // Grab the json from the request body
        const body = this.request.body || {};
        const graph = yield database.queryPromise(`
            INSERT INTO graphs (type, title, worker_identifier, metric_name)
            VALUES ('${body.type}', '${body.title}', '${body.workerIdentifier}', '${body.metricName}')
            RETURNING (identifier, type, title, worker_identifier, metric_name)`
        );
        this.body = {
            errors: [],
            graph: graph.rows[0]
        }
        yield next;
    }
);

// Delete a graph
router.post(
    '/delete_graph',
    function *(next) {
        // Grab the json from the request body
        const body = this.request.body || {};
        yield database.queryPromise(`
            DELETE FROM graphs WHERE identifier = ${body.identifier}
        `);
        this.body = {
            errors: []
        }
        yield next;
    }
);

// List available workers
router.get(
    '/workers',
    function *(next) {
        const workers = yield database.queryPromise('SELECT worker_identifier, name FROM altar_workers');
        this.body = {
            errors: [],
            workers: workers.rows.map((worker) => { return { workerIdentifier: worker.worker_identifier, name: worker.name }})
        }
    }
);

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
        io.emit(`metric-${body.workerIdentifier}-${body.metricName}`, {
            value: body.metricValue,
            units: body.metrivUnits
        });
        yield next;
    }
);

// List available metrics for a specific worker
router.get(
    '/metrics_list',
    function *(next) {
        const workerIdentifier = this.request.query.workerIdentifier;
        const metrics = yield database.queryPromise(database.SQL`
            SELECT metrics.name
            FROM metrics
            INNER JOIN altar_workers
            ON metrics.worker_identifier = altar_workers.worker_identifier
            GROUP BY metrics.name
            WHERE altar_workers.worker_identifier = ${workerIdentifier}`);
        this.body = {
            errors: [],
            metrics: metrics.rows
        }
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

// Authentication
app.use(function *(next){
    // // Only allow login, signup and OPTIONS calls if the request is unauthenticated
    // if (this.request.url === '/auth/login' || this.request.url === '/auth/signup' || this.request.method === 'OPTIONS') {
    //     yield next;
    //     return;
    // }

    // // If there is a session and a user ID found, allow the request to continue
    // if (this.session) {
    //     if (this.session.userIdentifier) {
    //         yield next;
    //         return;
    //     }
    // }

    // // Otherwise 401 with Unauthorized
    // this.response.status = 401;
    // this.response.body = 'Unauthorized';
    yield next;
    return;
});


// Use the routes defined earlier
app.use(router.routes());
app.use(router.allowedMethods());

// Listen on the pre defined port.
console.log('info', { message: 'Spirit API started and listening on port ' + port });

app.listen(port, '0.0.0.0');
