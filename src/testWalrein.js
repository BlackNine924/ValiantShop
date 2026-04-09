const fs = require('fs');

const pTypes = fs.readFileSync('./data/pokemonTypes.ts', 'utf8');
const pData = fs.readFileSync('./data/pokemonData.ts', 'utf8');

const matchType = pTypes.match(/\{ id: 365,.*?\}/);
console.log("TYPES FILE:", matchType ? matchType[0] : 'not found');
