const express = require("express");

const db = require("./db.js");

const app = express();

const port = process.env.PORT || 8081;

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