import knex from "knex";
import {
  DB_NAME,
  DB_PASS,
  DB_PORT,
  DB_USER,
  INSTANCE_HOST,
  INSTANCE_UNIX_SOCKET,
} from "./constants.js";

const localDbConfig = {
  client: "pg",
  connection: {
    host: INSTANCE_HOST, // e.g. '127.0.0.1'
    port: DB_PORT, // e.g. '5432'
    user: DB_USER, // e.g. 'my-user'
    password: DB_PASS, // e.g. 'my-user-password'
    database: DB_NAME, // e.g. 'my-database'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    createRetryIntervalMillis: 200,
  },
};

const prodDbConfig = {
  client: "pg",
  connection: {
    host: INSTANCE_UNIX_SOCKET, // e.g. '/cloudsql/project:region:instance'
    user: DB_USER, // e.g. 'my-user'
    password: DB_PASS, // e.g. 'my-user-password'
    database: DB_NAME, // e.g. 'my-database'
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    createRetryIntervalMillis: 200,
  },
};

export const prodDbCon = knex(prodDbConfig);
export const localDbCon = knex(localDbConfig);
