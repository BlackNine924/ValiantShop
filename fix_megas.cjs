const fs = require('fs');
let code = fs.readFileSync('src/data/pokemonTypes.ts', 'utf8');

// Find all base pokemon records
const baseDataRegex = /{ id: (\d+), name: "([^"]+)", types: \[[^\]]+\] }/g;
let baseData = [];
let match;
while ((match = baseDataRegex.exec(code)) !== null) {
  if (!match[2].startsWith("Mega ")) {
    baseData.push({ id: parseInt(match[1]), name: match[2].toLowerCase() });
  }
}

// Replace all Mega 20xxx IDs with their base ID
const megaRegex = /{ id: (\d+), name: "(Mega [^"]+)", types: (\[[^\]]+\]) }/g;
code = code.replace(megaRegex, (match, id, name, types) => {
  const baseNameMatch = name.match(/Mega ([A-Za-z\-]+)/);
  const baseName = baseNameMatch ? baseNameMatch[1].toLowerCase() : '';
  const baseP = baseData.find(p => p.name === baseName);
  const newId = baseP ? baseP.id : id; // fallback if not found
  console.log(name, '->', newId);
  return '{ id: ' + newId + ', name: "' + name + '", types: ' + types + ' }';
});

fs.writeFileSync('src/data/pokemonTypes.ts', code);
