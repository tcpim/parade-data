import axios from "axios";
import fs from "fs";
import { JSDOM } from "jsdom";
import { getRegistry } from "../canisters/nft-canister-connector.js";
import { getCollectionsForClub, getTokenIdentifier } from "../helpers.js";
import { localDbCon, prodDbCon } from "./db-config.js";

const isProd = process.env.environment === "PROD";
const db = isProd ? prodDbCon : localDbCon;
const clubInfoJsonFile = "./club-info.json";

export const addClub = async (club_id) => {
  const jsonData = JSON.parse(fs.readFileSync(clubInfoJsonFile, "utf-8"));
  for (const club of jsonData.clubs) {
    if (club.id !== club_id) {
      continue;
    }
    for (const collection of club.nft_collections) {
      console.log(
        "pupulating club_collection table...for: " +
          club.name +
          ": " +
          collection.name
      );

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
          image_height_width_ratio: collection.image_height_width_ratio,
          image_type: collection.image_type,
        })
        .onConflict(["club_id", "canister_id"]) // assuming the combination of club_id and canister_id is unique
        .merge();
    }
  }
};

export const addCollectionToClub = async (club_id) => {
  const collections = getCollectionsForClub(clubInfoJsonFile, club_id);

  for (const collection of collections) {
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
      // !!!! special case to extract image url from svg html
      if (collection.need_extract_image === true) {
        if (club_id === "ic-punks") {
          // special treatment for wrapper ic punks
          if (collection.canister_id === "bxdf4-baaaa-aaaah-qaruq-cai") {
            imageUrl = "https://cache.icpunks.com/icpunks//Token/" + tokenIndex;
          } else if (collection.canister_id === "y3b7h-siaaa-aaaah-qcnwa-cai") {
            imageUrl =
              "https://cache.icpunks.com/icats//Token/1330" + tokenIndex;
          }
        } else {
          imageUrl = await getImageUrlFromSvgHtml(onChainImageUrl);
        }
      }

      console.log(
        "pupulating image url for -- " +
          collection.name +
          ": " +
          tokenIndex +
          ": " +
          imageUrl
      );

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

export const getImageUrlFromSvgHtml = async (url) => {
  const axiosConfig = {
    timeout: 50000, // Set a timeout value in milliseconds
  };

  const maxRetries = 3;
  let delayMs = 1000;
  let html = "";
  for (let retry = 1; retry <= maxRetries; retry++) {
    try {
      const response = await axios.get(url, axiosConfig);
      html = response.data; // Successful response, exit the loop
      break;
    } catch (error) {
      console.error(`Attempt ${retry} failed: ${error.message}`);
      if (retry <= maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff: double the delay for each retry
      } else {
        console.error(`Max retries reached. Request failed.`);
        throw error; // Re-throw the error after retries
      }
    }
  }

  const dom = new JSDOM(html);
  const image = dom.window.document.querySelector("image");
  return image?.getAttribute("href") || "";
};

export const generatePokedBotsImgUrl = async () => {
  const pokedbotsCanister = "bzsui-sqaaa-aaaah-qce2a-cai";
  const registryRes = await getRegistry(pokedbotsCanister);
  for (let tokenOwner of registryRes) {
    const tokenIndex = tokenOwner[0];
    const tokenIdentifier = getTokenIdentifier(pokedbotsCanister, tokenIndex);
    const onChainImageUrl =
      "https://" +
      pokedbotsCanister +
      ".raw.icp0.io/?tokenid=" +
      tokenIdentifier;
    const smallSizeImageUrl = onChainImageUrl + "&type=thumbnail";

    // special case for poked bots canister
    const imageUrl = await getImageUrlFromSvgHtml(onChainImageUrl);

    await db("collection_token")
      .insert({
        canister_id: pokedbotsCanister,
        token_index: tokenIndex,
        token_identifier: tokenIdentifier,
        image_url: imageUrl,
        image_url_onchain: onChainImageUrl,
        thum_image_url: smallSizeImageUrl,
      })
      .onConflict(["canister_id", "token_index"])
      .merge();

    console.log(
      "upadted token: " + tokenIndex + " with image url: " + imageUrl
    );
  }
};
