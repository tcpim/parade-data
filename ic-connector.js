const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('./candid/btcflower.did.js')
const fetch = require('isomorphic-fetch')

const httpAgent = new HttpAgent({
    host: 'https://ic0.app/',
    fetch: fetch
})

// 'stats' EXT
const getStats = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }
    const actor = Actor.createActor(idlFactory, actorConfig)
    const statsRes = await actor.stats()
    return statsRes
}

// 'getMinter' EXT
const getMinter = async (canisterId) => {
    const actorConfig = {
        canisterId,
        agent: httpAgent
    }

    const actor = Actor.createActor(idlFactory, actorConfig)
    const minterRes = await actor.getMinter()
    return minterRes
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
    const res = await actor.getRegistry()
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

module.exports = { getStats, getMinter, getExtension, getRegistry, getTokens }