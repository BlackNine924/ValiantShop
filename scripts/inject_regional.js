import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('tmp_regional_data.json', 'utf-8'));

  // Inject into pokemonData.ts
  let pData = fs.readFileSync('src/data/pokemonData.ts', 'utf-8');
  let injectDataStr = data.pokemonData.map(p => JSON.stringify(p, null, 2)).join(',\n');
  if (pData.includes('Darumaka de Galar')) {
    console.log('Already injected in pokemonData.ts');
  } else {
    pData = pData.replace(/(\n];\n\nexport const NATURES)/, ',\n' + injectDataStr + '$1');
    fs.writeFileSync('src/data/pokemonData.ts', pData);
    console.log('Injected pokemonData.ts');
  }

  // Inject into pokemonTypes.ts
  let pTypes = fs.readFileSync('src/data/pokemonTypes.ts', 'utf-8');
  let injectTypesStr = data.pokemonTypes.map(p => {
    let typeArr = p.types.map(t => `"${t}"`).join(', ');
    return `  { id: ${p.id}, name: "${p.name}", types: [${typeArr}] }`;
  }).join(',\n');

  if (pTypes.includes('Darumaka de Galar')) {
    console.log('Already injected in pokemonTypes.ts');
  } else {
    // pokemonTypes is structured a bit differently
    pTypes = pTypes.replace(/\n];\s*$/, ',\n' + injectTypesStr + '\n];\n');
    fs.writeFileSync('src/data/pokemonTypes.ts', pTypes);
    console.log('Injected pokemonTypes.ts');
  }
} catch (e) {
  console.error(e);
}
