'use strict';

const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_ATTEMPT = 0 } = process.env;
const { getStats, getMinter, getRegistry, getAllNFTs } = require('./ic-connector.js')
const { Principal } = require('@dfinity/principal');
const dbConnections = require("./db.js");
const isProd = process.env.environment == 'PROD';
const db = isProd ? dbConnections.prodDBCon : dbConnections.localDBCon;

const btcFlowerCanister = 'pk6rk-6aaaa-aaaae-qaazq-cai'


const canistersIds = [
    'pk6rk-6aaaa-aaaae-qaazq-cai',
    '2tvxo-eqaaa-aaaai-acjla-cai',
    'ugdkf-taaaa-aaaak-acoia-cai',
    'skjpp-haaaa-aaaae-qac7q-cai',
    'ahl3d-xqaaa-aaaaj-qacca-cai',
    'oeee4-qaaaa-aaaak-qaaeq-cai',
    'bzsui-sqaaa-aaaah-qce2a-cai',
    't2mog-myaaa-aaaal-aas7q-cai',
    'e3izy-jiaaa-aaaah-qacbq-cai',
    '4ggk4-mqaaa-aaaae-qad6q-cai',
    'nbg4r-saaaa-aaaah-qap7a-cai',
    'o6lzt-kiaaa-aaaag-qbdza-cai',
    '7cpyk-jyaaa-aaaag-qa5na-cai',
]

// Define main script
const main = async () => {
    //await populateAllCollections('collection')
    await populateAllCollectionStats('collection')

    // if (isProd) {
    //     console.log(
    //         `Starting Task #${CLOUD_RUN_TASK_INDEX}, Attempt #${CLOUD_RUN_TASK_ATTEMPT}...`
    //     );

    //     try {
    //         const cid = canistersIds[CLOUD_RUN_TASK_INDEX]
    //         console.log("Start collection table for canister: " + cid + " for task: " + CLOUD_RUN_TASK_INDEX)
    //         await populateCollectionTable(cid, 'collection')
    //         console.log("Start token_owner table for canister: " + cid + " for task: " + CLOUD_RUN_TASK_INDEX)
    //         await populateTokenOwnerTable(cid, 'collection_token', 'token_ownership')
    //     } catch (err) {
    //         console.log(`Error ${err}`);
    //         throw err;
    //     }

    //     console.log(`Completed Task #${CLOUD_RUN_TASK_INDEX}.`);
    //     process.exit(0);
    // } else {
    //     try {
    //         for (let cid of canistersIds) {
    //             console.log("Start collection table for canister: " + cid)
    //             await populateCollectionTable(cid, 'collection')
    //             console.log("Start token_owner table for canister: " + cid)
    //             await populateTokenOwnerTable(cid, 'collection_token', 'token_ownership')
    //         }
    //     } catch (err) {
    //         console.log(`Error ${err}`);
    //         throw err;
    //     }
    //     process.exit(0);
    // }

    process.exit(0);
};


const populateTokenOwnerTable = async (canisterId, collectionTokenTable, tokenOwnershipTable) => {
    const registryRes = await getRegistry(canisterId)
    for (let tokenOwner of registryRes) {
        const tokenIndex = tokenOwner[0];
        const ownerAccount = tokenOwner[1];
        const tokenIdentifier = getTokenIdentifier(canisterId, tokenIndex)
        const fullSizeImageUrl = "https://" + canisterId + ".raw.ic0.app/?tokenid=" + tokenIdentifier;
        const smallSizeImageUrl = canisterId == btcFlowerCanister ?
            "https://7budn-wqaaa-aaaah-qcsba-cai.raw.ic0.app/?tokenid=" + tokenIdentifier : fullSizeImageUrl + '&type=thumbnail'


        await db(collectionTokenTable)
            .insert({
                canister_id: canisterId,
                token_index: tokenIndex,
                token_identifier: tokenIdentifier,
                original_image_url: fullSizeImageUrl,
                thum_image_url: smallSizeImageUrl
            })
            .onConflict(['canister_id', 'token_index'])
            .merge()

        await db(tokenOwnershipTable)
            .insert({
                owner_account: ownerAccount,
                canister_id: canisterId,
                token_index: tokenIndex
            })
            .onConflict(['owner_account', 'canister_id', 'token_index'])
            .merge()
    }
}

const populateAllCollections = async (tableName) => {
    const nfts = await getAllNFTs()
    for (let nft of nfts) {
        const cid = nft.principal_id.toString()
        const name = nft.name
        const standard = nft.standard
        const icon = nft.icon
        const description = nft.description.substring(0, Math.min(1000, nft.description.length))

        console.log("Inserting collection info: " + name + " canisterId: " + cid)
        await db(tableName)
            .insert({
                canister_id: cid,
                collection_name: name,
                description: description,
                standard: standard,
                thumbnail: icon
            })
            .onConflict('canister_id')
            .merge()
        console.log("Finish inserting collection: " + name + " canisterId: " + cid)

    }
}

const populateAllCollectionStats = async (tableName) => {
    const rows = await db(tableName).select(['canister_id', 'collection_name'])
    for (let row of rows) {
        const canisterId = row['canister_id']
        const name = row['collection_name']
        const statsRes = await getStats(canisterId)
        const minterRes = await getMinter(canisterId)

        console.log("Inserting collection stats: " + name + " canisterId: " + canisterId)
        await db(tableName)
            .insert({
                canister_id: canisterId,
                minter_principal: minterRes,
                total_volume: statsRes[0],
                highest_txn: statsRes[1],
                lowest_txn: statsRes[2],
                floor: statsRes[3],
                listings: statsRes[4],
                supply: statsRes[5],
                total_txn_count: statsRes[6],
            })
            .onConflict('canister_id')
            .merge()
    }
}

const getTokenIdentifier = (canisterId, tokenIndex) => {
    const padding = Buffer.from('\x0Atid');
    const array = new Uint8Array([
        ...padding,
        ...Principal.fromText(canisterId).toUint8Array(),
        ...to32bits(tokenIndex),
    ]);
    return Principal.fromUint8Array(array).toText();
}

const to32bits = num => {
    let b = new ArrayBuffer(4);
    new DataView(b).setUint32(0, num);
    return Array.from(new Uint8Array(b));
}

const updateTable = async () => {
    await db.schema.alterTable('collection', function (table) {
        table.string('description', 1000)

    })
}

const ensureSchema = async () => {
    const hasCollectionTable = await db.schema.hasTable('collection');
    if (!hasCollectionTable) {
        await db.schema.createTable('collection', table => {
            table.string('canister_id').primary();
            table.string('collection_name');
            table.string('minter_principal');
            table.bigint('total_volume');
            table.bigint('highest_txn');
            table.bigint('lowest_txn');
            table.bigint('total_txn_count');
            table.bigint('floor');
            table.bigint('listings');
            table.bigint('supply');
            table.string('description');
            table.string('standard');
            table.string('thumbnail');
        });
    }

    const hasCollectionTokenTable = await db.schema.hasTable('collection_token');
    if (!hasCollectionTokenTable) {
        await db.schema.createTable('collection_token', table => {
            table.string('canister_id');
            table.integer('token_index');
            table.string('token_identifier');
            table.string('original_image_url');
            table.string('thum_image_url');
            table.double('nri');
            table.json('attributes');
            table.json('transaction_hisotry');
            table.primary(['canister_id', 'token_index']);
        });
    }

    const hasTokenOwnershipTable = await db.schema.hasTable('token_ownership');
    if (!hasTokenOwnershipTable) {
        await db.schema.createTable('token_ownership', table => {
            table.string('owner_account');
            table.string('canister_id');
            table.integer('token_index');
            table.primary(['owner_account', 'canister_id', 'token_index']);
        });
    }
}

// Start script
main().catch(err => {
    console.error(err);
    // [START cloudrun_jobs_exit_process]
    process.exit(1); // Retry Job Task by exiting the process
    // [END cloudrun_jobs_exit_process]
});
// [END cloudrun_jobs_quickstart]