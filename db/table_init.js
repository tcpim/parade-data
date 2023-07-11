import { localDbCon, prodDbCon } from "./db-config.js";

const isProd = process.env.environment == "PROD";
const db = isProd ? prodDbCon : localDbCon;

export const ensureSchema = async () => {
  const hasClubCollectionTable = await db.schema.hasTable("club_collection");
  if (!hasClubCollectionTable) {
    await db.schema.createTable("club_collection", (table) => {
      table.string("club_id");
      table.string("canister_id");
      table.string("club_name");
      table.string("collection_name");
      table.string("minter_principal");
      table.string("royalty_account");
      table.string("icon_url");
      table.string("twitter");
      table.string("discord");
      table.string("website");
      table.bigint("total_volume");
      table.bigint("highest_txn");
      table.bigint("lowest_txn");
      table.bigint("total_txn_count");
      table.bigint("floor");
      table.bigint("listings");
      table.bigint("supply");
      table.string("description");
      table.string("standard");
      table.string("thumbnail");
      table.string("image_type");
      table.double("image_height_width_ratio");
      table.primary(["club_id", "canister_id"]);
    });
  }

  const hasCollectionTokenTable = await db.schema.hasTable("collection_token");
  if (!hasCollectionTokenTable) {
    await db.schema.createTable("collection_token", (table) => {
      table.string("canister_id");
      table.integer("token_index");
      table.string("token_identifier");
      table.string("image_url");
      table.string("image_url_onchain");
      table.string("thum_image_url");
      table.double("nri");
      table.json("attributes");
      table.json("transaction_hisotry");
      table.primary(["canister_id", "token_index"]);
    });
  }

  const hasTokenOwnershipTable = await db.schema.hasTable("token_ownership");
  if (!hasTokenOwnershipTable) {
    await db.schema.createTable("token_ownership", (table) => {
      table.string("owner_account");
      table.string("canister_id");
      table.integer("token_index");
      table.primary(["owner_account", "canister_id", "token_index"]);
    });
  }
};
