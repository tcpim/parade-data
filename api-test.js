const express = require("express");

const dbConnections = require("./db.js");

const app = express();

const port = process.env.PORT || 8081;
const isProd = process.env.environment == 'PROD';
const db = isProd ? dbConnections.prodDBCon : dbConnections.localDBCon;

const { getRegistry } = require('./ic-connector.js')


app.post("/insert", async (req, res) => {
    await ensureSchema();

    const timestamp = new Date();
    try {
        await db('ts-test').insert({ last_ts: timestamp });
    } catch (err) {
        logger.error(`Error ${err}`);
        res
            .status(500)
            .send('Unable to insert timestamp')
            .end();
    }
    res.status(200).send(`Successfully inserted ${timestamp}`).end();
});

app.get('/registry/:canisterId', async (req, res) => {
    const registry = await getRegistry(req.params.canisterId)
    var resJson = []
    for (tuple of registry) {
        resJson.push({ index: tuple[0], account: tuple[1] })
    }
    res.json({ registry: resJson })
})


const ensureSchema = async () => {
    const hasTable = await db.schema.hasTable('ts-test');
    if (!hasTable) {
        return db.schema.createTable('ts-test', table => {
            table.increments('ts_id').primary();
            table.timestamp('last_ts', 30).notNullable();
        });
    }
}

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})