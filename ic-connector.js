const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('./candid/btcflower.did.js')
const originalFetch = require('isomorphic-fetch')

const fetch = require('fetch-retry')(originalFetch, {
    retries: 3,
    retryDelay: 1000
});

const httpAgent = new HttpAgent({
    host: 'https://ic0.app/',
    fetch: fetch
})

// getAllNFTs from DAB-js
// const getAllNFTs = async () => {
//     try {
//         const collections = await getAllNFTS({ agent: httpAgent })
//         return collections
//     } catch (e) {
//         console.error(e);
//         return
//     }
// }

// 'stats' EXT
const getStats = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }
    const actor = Actor.createActor(idlFactory, actorConfig)

    let statsRes = []
    try {
        statsRes = await actor.stats()
    } catch (e) {
        console.error("Failed to fetch stats for canister: " + canisterId + " error: " + e)
    }
    return statsRes
}

// 'getMinter' EXT
const getMinter = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }

    const actor = Actor.createActor(idlFactory, actorConfig)
    let minterRes = ""
    try {
        minterRes = await actor.getMinter()
    } catch (e) {
        console.error("Failed to fetch minter for canister: " + canisterId + " error: " + e)
    }

    return minterRes.toString()
}

// 'extensions' EXT
const getExtension = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }

    const actor = Actor.createActor(idlFactory, actorConfig)
    const extensionRes = await actor.extensions()
    return extensionRes
}

// 'getRegistry' EXT
const getRegistry = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }

    const actor = Actor.createActor(idlFactory, actorConfig)
    let res = []
    try {
        res = await actor.getRegistry()
    } catch (e) {
        console.log("Failed to get registry for canister: " + canisterId)
    }
    return res
}

// 'getTokens' EXT
const getTokens = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }

    const actor = Actor.createActor(idlFactory, actorConfig)
    const res = await actor.getTokens()
    return res
}

module.exports = {
    getStats,
    getMinter,
    getExtension,
    getRegistry,
    getTokens,
}