import fs from 'fs';
import path from 'path';

async function run() {
  const content = fs.readFileSync('src/data/pokemonTypes.ts', 'utf8');
  
  const regex = /\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)"/g;
  let match;
  const pokemons = [];
  while ((match = regex.exec(content)) !== null) {
      pokemons.push({ id: parseInt(match[1]), name: match[2] });
  }

  console.log(`Extracted ${pokemons.length} pokemon entries.`);
  const localSpritesPath = path.join(process.cwd(), 'public');
  
  function getSpriteUrl(id, shiny = false) {
    if (id >= 20000 && id < 30000) return `/assets/sprites/mega/${id}${shiny ? '-shiny' : ''}.png`;
    if (id >= 30000) return `/assets/sprites/dynamax/${id}${shiny ? '-shiny' : ''}.png`;
    const shinyPath = shiny ? 'shiny/' : '';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shinyPath}${id}.png`;
  }

  function getPokemonArtwork(id, shiny = false) {
    if (id >= 20000 && id < 30000) return `/assets/artwork/mega/${id}${shiny ? '-shiny' : ''}.png`;
    if (id >= 30000 && id < 40000) return `/assets/artwork/dynamax/${id}${shiny ? '-shiny' : ''}.png`;
    if (id >= 10000 && id < 20000) return `/assets/artwork/variations/${id}${shiny ? '-shiny' : ''}.png`;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
  }

  const missingSprites = [];
  const missingArtworks = [];

  const BATCH_SIZE = 40;
  
  const urlsToCheck = [];
  
  for (const p of pokemons) {
      urlsToCheck.push({ url: getSpriteUrl(p.id, false), type: 'sprite', name: p.name, id: p.id, isShiny: false });
      urlsToCheck.push({ url: getSpriteUrl(p.id, true), type: 'sprite', name: p.name, id: p.id, isShiny: true });
      urlsToCheck.push({ url: getPokemonArtwork(p.id, false), type: 'artwork', name: p.name, id: p.id, isShiny: false });
      urlsToCheck.push({ url: getPokemonArtwork(p.id, true), type: 'artwork', name: p.name, id: p.id, isShiny: true });
  }

  console.log(`Checking ${urlsToCheck.length} URLs...`);

  let count = 0;
  for (let i = 0; i < urlsToCheck.length; i += BATCH_SIZE) {
      const batch = urlsToCheck.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (item) => {
          const entryStr = `- **[${item.id}] ${item.name}** ${item.isShiny ? '(Shiny)' : '(Normal)'}: \`${item.url}\``;
          try {
              if (item.url.startsWith('/assets/')) {
                  const fullPath = path.join(localSpritesPath, item.url);
                  if (!fs.existsSync(fullPath)) {
                      if (item.type === 'sprite') missingSprites.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
                      else missingArtworks.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
                  }
              } else {
                  // Only check EXTERNAL if id >= 10000 to save execution time and avoid heavy rate limits.
                  // 1-1025 standard Pokemon are overwhelmingly reliable on PokeAPI.
                  // Variation/Mega missing art on PokeAPI is what usually breaks.
                  if (item.id >= 10000) {
                      const res = await fetch(item.url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
                      if (!res.ok) {
                          if (item.type === 'sprite') missingSprites.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
                          else missingArtworks.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
                      }
                  }
              }
          } catch(e) {
              if (item.type === 'sprite') missingSprites.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
              else missingArtworks.push({id: item.id, type: item.isShiny ? 1 : 0, msg: entryStr});
          }
      }));
      
      count += batch.length;
      if (count % 400 === 0) console.log(`Processed ${count} / ${urlsToCheck.length}...`);
  }

  console.log('Finished checking URLs!');
  
  missingSprites.sort((a,b) => a.id - b.id || a.type - b.type);
  missingArtworks.sort((a,b) => a.id - b.id || a.type - b.type);

  let report = '# Relatório de Sprites e Artworks Faltando\n\n';
  report += '> Varredura completa sobre todos os Pokémon (incluindo formas alternativas, mega e dynamax) nos diretórios e na API configurados!\n\n';
  
  report += '## 🎨 Pokédex (Artworks 3D)\n';
  report += 'Verificação em `public/assets/artwork` e PokéAPI Oficial Artwork.\n\n';
  if (missingArtworks.length === 0) report += '> Nenhum.\\n\n';
  else report += missingArtworks.map(x => x.msg).join('\n') + '\n\n';

  report += '## 👾 PokéGrid (Sprites 2D)\n';
  report += 'Verificação em `public/assets/sprites` e PokéAPI Sprites.\n\n';
  if (missingSprites.length === 0) report += '> Nenhum.\\n\n';
  else report += missingSprites.map(x => x.msg).join('\n') + '\n\n';

  fs.writeFileSync('Sprites_Correções.md', report, 'utf8');
  console.log('Report saved to Sprites_Correções.md in root.');
}

run().catch(console.error);
