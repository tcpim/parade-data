'use strict';

const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_ATTEMPT = 0 } = process.env;

const dbConnections = require("./db.js");
const isProd = process.env.environment == 'PROD';
const db = isProd ? dbConnections.prodDBCon : dbConnections.localDBCon;

// Define main script
const main = async () => {
    console.log(
        `Starting Task #${CLOUD_RUN_TASK_INDEX}, Attempt #${CLOUD_RUN_TASK_ATTEMPT}...`
    );

    await ensureSchema();
    const timestamp = new Date();
    try {
        await db('ts-test').insert({ last_ts: timestamp });
    } catch (err) {
        logger.error(`Error ${err}`);
        throw err;
    }

    console.log(`Completed Task #${CLOUD_RUN_TASK_INDEX}.`);
    process.exit(0);
};

const ensureSchema = async () => {
    const hasTable = await db.schema.hasTable('ts-test');
    if (!hasTable) {
        return db.schema.createTable('ts-test', table => {
            table.increments('ts_id').primary();
            table.timestamp('last_ts', 30).notNullable();
        });
    }
}

// Start script
main().catch(err => {
    console.error(err);
    // [START cloudrun_jobs_exit_process]
    process.exit(1); // Retry Job Task by exiting the process
    // [END cloudrun_jobs_exit_process]
});
// [END cloudrun_jobs_quickstart]