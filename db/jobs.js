'use strict';

const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_ATTEMPT = 0, CLOUD_RUN_TASK_TOTAL = 0 } = process.env;
const { getStats, getMinter, getRegistry } = require('./nft-canister-connector.js')
const { Principal } = require('@dfinity/principal');
const dbConnections = require("./db-config.js");
const isProd = process.env.environment == 'PROD';
const db = isProd ? dbConnections.prodDBCon : dbConnections.localDBCon;

const btcFlowerCanister = 'pk6rk-6aaaa-aaaae-qaazq-cai'

// initiate an array of objects with name and address
const canistersIds = [
    { cid: 'pk6rk-6aaaa-aaaae-qaazq-cai', name: 'BTC Flower' },
    // { cid: '2tvxo-eqaaa-aaaai-acjla-cai', name: 'IC Dream Whale' },
    // { cid: 'ugdkf-taaaa-aaaak-acoia-cai', name: 'ICP Flower' },
    // { cid: 'skjpp-haaaa-aaaae-qac7q-cai', name: 'Pineapple Punks' },
    // { cid: 'ahl3d-xqaaa-aaaaj-qacca-cai', name: 'ICTuts' },
    // { cid: 'oeee4-qaaaa-aaaak-qaaeq-cai', name: 'Motoko Ghost' },
    // { cid: 'bzsui-sqaaa-aaaah-qce2a-cai', name: 'Poked Bots' },
    // { cid: 't2mog-myaaa-aaaal-aas7q-cai', name: 'pet bots' },
    // { cid: 'e3izy-jiaaa-aaaah-qacbq-cai', name: 'Cronic Critters' },
    // { cid: '4ggk4-mqaaa-aaaae-qad6q-cai', name: 'ICP Flower' },
    // { cid: 'nbg4r-saaaa-aaaah-qap7a-cai', name: 'Starverse' },
    // { cid: 'o6lzt-kiaaa-aaaag-qbdza-cai', name: 'PC Heads' },
    // { cid: '7cpyk-jyaaa-aaaag-qa5na-cai', name: 'BOX ON BLOCK' },
]

const getCanistersForTask = () => {
    if (!isProd || CLOUD_RUN_TASK_TOTAL < 1) {
        return canistersIds;
    }

    const num = canistersIds.length;
    const numCanistersPerTask = Math.ceil(num / CLOUD_RUN_TASK_TOTAL);
    const start = CLOUD_RUN_TASK_INDEX * numCanistersPerTask;
    const end = start + numCanistersPerTask > num.length ? num.length : start + numCanistersPerTask;
    return canistersIds.slice(start, end);
}
// Define main script
const main = async () => {
    await ensureSchema();
    const canistersForTask = getCanistersForTask();

    if (isProd) {
        console.log(
            `Starting Task #${CLOUD_RUN_TASK_INDEX}, Attempt #${CLOUD_RUN_TASK_ATTEMPT}...`
        );

        try {
            for (const canister in canistersForTask) {
                console.log("Start collection table for canister: " + canister.cid + " for task: " + CLOUD_RUN_TASK_INDEX)
                await populateCollectionTable(canister, 'collection')
                console.log("Start token_owner table for canister: " + canister.cid + " for task: " + CLOUD_RUN_TASK_INDEX)
                await populateTokenOwnerTable(canister, 'collection_token', 'token_ownership')
            }
        } catch (err) {
            console.log(`Error ${err}`);
            throw err;
        }

        console.log(`Completed Task #${CLOUD_RUN_TASK_INDEX}.`);
    } else {
        // Local development
        try {
            for (const canister of canistersForTask) {
                console.log("Start collection table for canister: " + canister.cid)
                await populateCollectionTable(canister, 'collection')
                console.log("Start token_owner table for canister: " + canister.cid)
                await populateTokenOwnerTable(canister, 'collection_token', 'token_ownership')
            }
        } catch (err) {
            console.log(`Error ${err}`);
            throw err;
        }
    }
    process.exit(0);
};


const populateTokenOwnerTable = async (canister, collectionTokenTable, tokenOwnershipTable) => {
    const registryRes = await getRegistry(canister.cid)
    for (let tokenOwner of registryRes) {
        const tokenIndex = tokenOwner[0];
        const ownerAccount = tokenOwner[1];
        const tokenIdentifier = getTokenIdentifier(canister.cid, tokenIndex)
        const fullSizeImageUrl = "https://" + canister.cid + ".raw.ic0.app/?tokenid=" + tokenIdentifier;
        const smallSizeImageUrl = canister.cid == btcFlowerCanister ?
            "https://7budn-wqaaa-aaaah-qcsba-cai.raw.ic0.app/?tokenid=" + tokenIdentifier : fullSizeImageUrl + '&type=thumbnail'


        await db(collectionTokenTable)
            .insert({
                canister_id: canister.cid,
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
                canister_id: canister.cid,
                token_index: tokenIndex
            })
            .onConflict(['owner_account', 'canister_id', 'token_index'])
            .merge()
    }
}


const populateCollectionTable = async (canister, tableName) => {
    const statsRes = await getStats(canister.cid)
    const minterRes = await getMinter(canister.cid)

    await db(tableName)
        .insert({
            canister_id: canister.cid,
            collection_name: canister.name,
            minter_principal: minterRes.toString(),
            total_volume: statsRes[0],
            highest_txn: statsRes[1],
            lowest_txn: statsRes[2],
            floor: statsRes[3],
            listings: statsRes[4],
            supply: statsRes[5],
            total_txn_count: statsRes[6],
        })
        .onConflict('canister_id')
        .ignore()
}

// const populateAllCollections = async (tableName) => {
//     const nfts = await getAllNFTs()
//     for (let nft of nfts) {
//         const cid = nft.principal_id.toString()
//         const name = nft.name
//         const standard = nft.standard
//         const icon = nft.icon
//         const description = nft.description.substring(0, Math.min(1000, nft.description.length))

//         console.log("Inserting collection info: " + name + " canisterId: " + cid)
//         await db(tableName)
//             .insert({
//                 canister_id: cid,
//                 collection_name: name,
//                 description: description,
//                 standard: standard,
//                 thumbnail: icon
//             })
//             .onConflict('canister_id')
//             .merge()
//         console.log("Finish inserting collection: " + name + " canisterId: " + cid)

//     }
// }

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