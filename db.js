const knex = require('knex');

const knexfile = require('./knexfile');

const localConfig = knexfile['development'];
const prodConfig = knexfile['production'];

module.exports = {
    prodDBCon: knex(prodConfig),
    localDBCon: knex(localConfig)
}