// DB Config
export const DB_PORT = "5432";
export const DB_NAME = "parade-db";
export const DB_USER = "parade-db-user";
export const DB_PASS = "wang930331";

// For running in cloud run connecting to cloud sql
export const INSTANCE_UNIX_SOCKET =
  "/cloudsql/parade-cloud:us-west1:parade-data-1";

// For running locally connecting to cloud auth proxy
export const INSTANCE_HOST = "127.0.0.1";
export const PORT = "8081";
