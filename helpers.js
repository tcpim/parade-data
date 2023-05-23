import { Principal } from "@dfinity/principal";
import fs from "fs";

export const getTokenIdentifier = (canisterId, tokenIndex) => {
  const padding = Buffer.from("\x0Atid");
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(canisterId).toUint8Array(),
    ...to32bits(tokenIndex),
  ]);
  return Principal.fromUint8Array(array).toText();
};

export const to32bits = (num) => {
  let b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

export const getCollections = (file) => {
  const jsonData = JSON.parse(fs.readFileSync(file, "utf-8"));
  let collections = [];
  jsonData.clubs.forEach((club) => {
    club.nft_collections.forEach((collection) => {
      collections.push({
        canister_id: collection.canister_id,
        name: collection.name,
      });
    });
  });
  return collections;
};
