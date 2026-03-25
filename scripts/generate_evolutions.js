import fs from 'fs';

async function main() {
  const evolutionMap = {};
  console.log("Fetching evolution chains from PokeAPI...");
  const limit = 600; 
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain?limit=${limit}`);
    const data = await response.json();
    let chainsFetched = 0;
    
    // Process in batches
    const batchSize = 25;
    for (let i = 0; i < data.results.length; i += batchSize) {
      const batch = data.results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (chainResult) => {
        try {
          const res = await fetch(chainResult.url);
          if (!res.ok) return;
          const chainData = await res.json();
          
          const getNames = (node) => {
            let names = [node.species.name];
            node.evolves_to.forEach(child => {
              names = names.concat(getNames(child));
            });
            return names;
          };
          
          if (chainData && chainData.chain) {
            const names = getNames(chainData.chain).map(n => n.toLowerCase());
            if (names.length > 0) {
              names.forEach(n => {
                evolutionMap[n] = names;
              });
            }
          }
        } catch (e) {}
      }));
      chainsFetched += batch.length;
      console.log(`Fetched ${chainsFetched}/${data.results.length}`);
    }

    const fileContent = `export const EVOLUTION_LINES: Record<string, string[]> = ${JSON.stringify(evolutionMap, null, 2)};\n`;
    fs.writeFileSync('./src/data/evolutionLines.ts', fileContent);
    console.log("Successfully generated src/data/evolutionLines.ts with " + Object.keys(evolutionMap).length + " entries.");
  } catch (err) {
    console.error("Error generating evolution lines:", err);
  }
}
main();
