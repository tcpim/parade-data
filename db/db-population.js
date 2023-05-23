import { getStats, getMinter, getRegistry } from "../nft-canister-connector.js";
import { getTokenIdentifier, getCollections } from "../helpers.js";
import fs from "fs";
import { prodDbCon, localDbCon } from "./db-config.js";

const isProd = process.env.environment === "PROD";
const db = isProd ? prodDbCon : localDbCon;
const clubInfoJsonFile = "./club-info.json";

export const populateClubCollectionTable = async () => {
  const jsonData = JSON.parse(fs.readFileSync(clubInfoJsonFile, "utf-8"));
  // Note! need to use for...of because forEach/map doesn't work with async/await
  for (const club of jsonData.clubs) {
    for (const collection of club.nft_collections) {
      await db("club_collection")
        .insert({
          club_id: club.id,
          canister_id: collection.canister_id,
          club_name: club.name,
          twitter: club.twitter,
          discord: club.discord,
        })
        .onConflict(["club_id", "canister_id"]) // assuming the combination of club_id and canister_id is unique
        .merge();
    }
  }
};

// Find all canister ids from the club-info.json file
// Get stats and infos from the canisters
// Populate the "collection" table
export const populateCollectionTable = async () => {
  const collections = getCollections(clubInfoJsonFile);

  // Note! need to use for...of because forEach/map doesn't work with async/await
  for (const collection of collections) {
    const statsRes = await getStats(collection.canister_id);
    const minterRes = await getMinter(collection.canister_id);

    console.log("pupulating collection table...for: " + collection.name);

    await db("collection")
      .insert({
        canister_id: collection.canister_id,
        collection_name: collection.name,
        minter_principal: minterRes.toString(),
        total_volume: statsRes[0],
        highest_txn: statsRes[1],
        lowest_txn: statsRes[2],
        floor: statsRes[3],
        listings: statsRes[4],
        supply: statsRes[5],
        total_txn_count: statsRes[6],
      })
      .onConflict("canister_id")
      .merge();
  }
};

// Populate the "collection_token" table and "token_ownership" table
export const populateTokenOwnerTable = async () => {
  const collections = getCollections(clubInfoJsonFile);

  // Note! need to use for...of because forEach/map doesn't work with async/await
  for (const collection of collections) {
    const registryRes = await getRegistry(collection.canister_id);
    console.log(
      "pupulating collection_token and token_ownership table...for: " +
        collection.name
    );

    for (let tokenOwner of registryRes) {
      const tokenIndex = tokenOwner[0];
      const ownerAccount = tokenOwner[1];
      const tokenIdentifier = getTokenIdentifier(
        collection.canister_id,
        tokenIndex
      );
      const fullSizeImageUrl =
        "https://" +
        collection.canister_id +
        ".raw.ic0.app/?tokenid=" +
        tokenIdentifier;
      const smallSizeImageUrl = fullSizeImageUrl + "&type=thumbnail";

      await db("collection_token")
        .insert({
          canister_id: collection.canister_id,
          token_index: tokenIndex,
          token_identifier: tokenIdentifier,
          original_image_url: fullSizeImageUrl,
          thum_image_url: smallSizeImageUrl,
        })
        .onConflict(["canister_id", "token_index"])
        .merge();

      await db("token_ownership")
        .insert({
          owner_account: ownerAccount,
          canister_id: collection.canister_id,
          token_index: tokenIndex,
        })
        .onConflict(["owner_account", "canister_id", "token_index"])
        .merge();
    }
  }
};
