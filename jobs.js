"use strict";

import { populateClubCollectionTable } from "./db/db-population.js";

// TODO: for each Cloud task, deal with each club
const main = async () => {
  // await ensureSchema();
  await populateClubCollectionTable();
  //await populateTokenOwnerTable();

  process.exit(0);
};

// Start script
main().catch((err) => {
  console.error(err);
  // [START cloudrun_jobs_exit_process]
  process.exit(1); // Retry Job Task by exiting the process
  // [END cloudrun_jobs_exit_process]
});
// [END cloudrun_jobs_quickstart]
