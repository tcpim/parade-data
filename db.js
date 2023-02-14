const knex = require('knex');

const knexfile = require('./knexfile');

const configOptions = knexfile['dbConfig'];

module.exports = knex(configOptions);