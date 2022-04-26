const fs = require('fs');

const rawdata = fs.readFileSync('./model/states.json');
const statesArray = JSON.parse(rawdata);

module.exports = {statesArray, rawdata};