import fs from "fs";
import { getRegistry, getStats } from "../canisters/nft-canister-connector.js";
import { getCollections, getTokenIdentifier } from "../helpers.js";
import { localDbCon, prodDbCon } from "./db-config.js";
import { getImageUrlFromSvgHtml } from "./onetime-job.js";

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
          collection_rank: collection.rank,
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

export const populateCollectionTokenTable = async () => {
  const collections = getCollections(clubInfoJsonFile);

  for (const collection of collections) {
    if (collection.canister_id !== "t3drq-7iaaa-aaaae-qac2a-cai") {
      continue;
    }
    const registryRes = await getRegistry(collection.canister_id);
    console.log("pupulating collection_token table ...for: " + collection.name);

    for (let tokenOwner of registryRes) {
      const tokenIndex = tokenOwner[0];
      const tokenIdentifier = getTokenIdentifier(
        collection.canister_id,
        tokenIndex
      );
      const onChainImageUrl =
        "https://" +
        collection.canister_id +
        ".raw.icp0.io/?tokenid=" +
        tokenIdentifier;
      const smallSizeImageUrl = onChainImageUrl + "&type=thumbnail";

      let imageUrl = onChainImageUrl;
      // special case for poked bots canister
      if (collection.canister_id === "bzsui-sqaaa-aaaah-qce2a-cai") {
        imageUrl = getImageUrlFromSvgHtml(onChainImageUrl);
      }
      await db("collection_token")
        .insert({
          canister_id: collection.canister_id,
          token_index: tokenIndex,
          token_identifier: tokenIdentifier,
          image_url: imageUrl,
          image_url_onchain: onChainImageUrl,
          thum_image_url: smallSizeImageUrl,
        })
        .onConflict(["canister_id", "token_index"])
        .merge();
    }
  }
};

export const populateTokenOwnerTable = async () => {
  const collections = getCollections(clubInfoJsonFile);

  for (const collection of collections) {
    const registryRes = await getRegistry(collection.canister_id);
    console.log("pupulating token_ownership table...for: " + collection.name);

    for (let tokenOwner of registryRes) {
      const tokenIndex = tokenOwner[0];
      const ownerAccount = tokenOwner[1];
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
