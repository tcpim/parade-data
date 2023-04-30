// Update with your config settings.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // use absolute path for npm command to work

const knex = require('knex');

console.log(`password: ${__dirname}`)

const localDbConfig = {
  client: 'pg',
  connection: {
    host: process.env.INSTANCE_HOST, // e.g. '127.0.0.1'
    port: process.env.DB_PORT, // e.g. '5432'
    user: process.env.DB_USER, // e.g. 'my-user'
    password: process.env.DB_PASS, // e.g. 'my-user-password'
    database: process.env.DB_NAME, // e.g. 'my-database'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    createRetryIntervalMillis: 200
  }
}

const prodDbConfig = {
  client: 'pg',
  connection: {
    host: process.env.INSTANCE_UNIX_SOCKET, // e.g. '/cloudsql/project:region:instance'
    user: process.env.DB_USER, // e.g. 'my-user'
    password: process.env.DB_PASS, // e.g. 'my-user-password'
    database: process.env.DB_NAME, // e.g. 'my-database'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    createRetryIntervalMillis: 200
  }
}

module.exports = {
  prodDBCon: knex(prodDbConfig),
  localDBCon: knex(localDbConfig)
}