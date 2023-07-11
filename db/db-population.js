import fs from "fs";
import { getRegistry, getStats } from "../canisters/nft-canister-connector.js";
import { getCollections, getTokenIdentifier } from "../helpers.js";
import { localDbCon, prodDbCon } from "./db-config.js";

const isProd = process.env.environment === "PROD";
const db = isProd ? prodDbCon : localDbCon;
const clubInfoJsonFile = "./club-info.json";

export const populateClubCollectionTable = async () => {
  const jsonData = JSON.parse(fs.readFileSync(clubInfoJsonFile, "utf-8"));
  for (const club of jsonData.clubs) {
    for (const collection of club.nft_collections) {
      console.log(
        "pupulating club_collection table...for: " +
          club.name +
          " " +
          collection.name
      );

      const statsRes = await getStats(collection.canister_id);

      await db("club_collection")
        .insert({
          club_id: club.id,
          canister_id: collection.canister_id,
          club_name: club.name,
          collection_name: collection.name,

          royalty_account: "",
          icon_url: "",
          twitter: club.twitter,
          discord: club.discord,
          website: "",
          total_volume: statsRes[0],
          highest_txn: statsRes[1],
          lowest_txn: statsRes[2],
          total_txn_count: statsRes[6],
          floor: statsRes[3],
          listings: statsRes[4],
          supply: statsRes[5],
          image_height_width_ratio: collection.image_height_width_ratio,
          image_type: collection.image_type,
        })
        .onConflict(["club_id", "canister_id"]) // assuming the combination of club_id and canister_id is unique
        .merge();
    }
  }
};

export const populateTokenOwnerTable = async () => {
  const collections = getCollections(clubInfoJsonFile);

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
        ".raw.icp0.io/?tokenid=" +
        tokenIdentifier;
      const smallSizeImageUrl = fullSizeImageUrl + "&type=thumbnail";

      await db("collection_token")
        .insert({
          canister_id: collection.canister_id,
          token_index: tokenIndex,
          token_identifier: tokenIdentifier,
          image_url: fullSizeImageUrl,
          image_url_onchain: fullSizeImageUrl,
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
