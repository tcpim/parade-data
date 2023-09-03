import { populateTokenOwnerTableWithTask } from "./db/db-population.js";
// import { addCollectionToClub } from "./db/onetime-job.js";

const { CLOUD_RUN_TASK_INDEX = 0 } = process.env;
const isProd = process.env.environment === "PROD";

// TODO: for each Cloud task, deal with each club
const main = async () => {
  // if (isProd) {
  //   // one time job to add new clubs
  //   if (CLOUD_RUN_TASK_COUNT != "1") {
  //     console.log(
  //       "CLOUD_RUN_TASK_INDEX is not 1, skipping. It is: " +
  //         CLOUD_RUN_TASK_COUNT
  //     );
  //     process.exit(1);
  //   }

  //   const clubs = ["boxy-dude"];
  //   await addCollectionToClub(clubs[parseInt(CLOUD_RUN_TASK_INDEX)]);
  // }

  // const clubs = ["boxy-dude"];
  // await addCollectionToClub(clubs[0]);

  // await ensureSchema();
  // await populateClubCollectionTable();
  // await populateCollectionTokenTable();
  // await populateTokenOwnerTable();
  // await generatePokedBotsImgUrl();

  if (isProd) {
    await populateTokenOwnerTableWithTask(CLOUD_RUN_TASK_INDEX);
  }
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
