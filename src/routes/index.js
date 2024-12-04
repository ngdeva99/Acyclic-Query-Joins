const joins = require('./joins');
const movieTest = require('./movieTest')
module.exports = [
    ...joins,
    ...movieTest
];