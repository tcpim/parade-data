import { Actor, HttpAgent } from "@dfinity/agent";
import fetchRetry from "fetch-retry";
import originalFetch from "isomorphic-fetch";
import { idlFactory } from "./candid/btcflower.did.js";

const fetch = fetchRetry(originalFetch, {
  retries: 3,
  retryDelay: 1000,
});

const httpAgent = new HttpAgent({
  host: "https://ic0.app/",
  fetch: fetch,
});

// 'stats' EXT
export const getStats = async (canisterId) => {
  const actorConfig = {
    canisterId,
    agent: httpAgent,
  };
  const actor = Actor.createActor(idlFactory, actorConfig);

  let statsRes = [];
  try {
    statsRes = await actor.stats();
  } catch (e) {
    console.error(
      "Failed to fetch stats for canister: " + canisterId + " error: " + e
    );
  }
  return statsRes;
};

// // 'getMinter' EXT
// export const getMinter = async (canisterId) => {
//   const actorConfig = {
//     canisterId,
//     agent: httpAgent,
//   };

//   const actor = Actor.createActor(idlFactory, actorConfig);
//   let minterRes = "";
//   try {
//     minterRes = await actor.getMinter();
//   } catch (e) {
//     console.error(
//       "Failed to fetch minter for canister: " + canisterId + " error: " + e
//     );
//   }

//   console.log(`Minter for ${canisterId} is ${minterRes.toString()}`);
//   return minterRes.toString();
// };

// 'getRegistry' EXT
export const getRegistry = async (canisterId) => {
  const actorConfig = {
    canisterId,
    agent: httpAgent,
  };

  const actor = Actor.createActor(idlFactory, actorConfig);
  let res = [];
  try {
    res = await actor.getRegistry();
  } catch (e) {
    console.log("Failed to get registry for canister: " + canisterId);
  }
  return res;
};

// // 'getTokens' EXT
// const getTokens = async (canisterId) => {
//   const actorConfig = {
//     canisterId,
//     agent: httpAgent,
//   };

//   const actor = Actor.createActor(idlFactory, actorConfig);
//   const res = await actor.getTokens();
//   return res;
// };
