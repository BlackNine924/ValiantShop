const fs = require('fs');
const path = require('path');
const https = require('https');

const POKEMON_TYPES_FILE = path.join(__dirname, '..', 'src', 'data', 'pokemonTypes.ts');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Minimal mock/capture of the logic from pokemonTypes.ts
const MEGA_NAME_MAP = {};
const DYNAMAX_NAME_MAP = {};
const ARTWORK_ONLY_IDS = new Set([21359, 21445, 21448, 210147]);

function getSpriteUrl(id, shiny = false) {
  if (ARTWORK_ONLY_IDS.has(id)) {
    return `/assets/artwork/mega/${id}${shiny ? '-shiny' : ''}.png`;
  }
  if (id >= 20000 && id < 30000) {
    return `/assets/sprites/mega/${id}${shiny ? '-shiny' : ''}.png`;
  }
  if (id >= 30000 && id < 40000) {
    return `/assets/sprites/dynamax/${id}${shiny ? '-shiny' : ''}.png`;
  }
  if (MEGA_NAME_MAP[String(id)]) {
    return `/assets/artwork/mega/${id}${shiny ? '-shiny' : ''}.png`;
  }
  const shinyPath = shiny ? 'shiny/' : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shinyPath}${id}.png`;
}

function getPokemonArtwork(id, shiny = false) {
  if (MEGA_NAME_MAP[String(id)]) {
    return `/assets/artwork/mega/${id}${shiny ? '-shiny' : ''}.png`;
  }
  if (id >= 30000 && id < 40000) {
    return `/assets/artwork/dynamax/${id}${shiny ? '-shiny' : ''}.png`;
  }
  if (id >= 10000 && id < 20000) {
      return `/assets/artwork/variations/${id}${shiny ? '-shiny' : ''}.png`;
  }
  const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
  if (shiny) {
    return `${baseUrl}/shiny/${id}.png`;
  }
  return `${baseUrl}/${id}.png`;
}

async function checkUrl(url) {
  if (url.startsWith('/')) {
    const localPath = path.join(PUBLIC_DIR, url);
    if (!fs.existsSync(localPath)) return 404;
    const stats = fs.statSync(localPath);
    if (stats.size < 100) return 204; // Too small to be a real image
    return 200;
  }
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode);
      res.resume();
    }).on('error', () => resolve(500));
    req.on('timeout', () => {
      req.destroy();
      resolve(408);
    });
  });
}

async function audit() {
  const content = fs.readFileSync(POKEMON_TYPES_FILE, 'utf-8');
  
  // Extract MEGA_NAME_MAP
  const megaMatches = content.match(/const MEGA_NAME_MAP: Record<string, string> = \{([\s\S]+?)\};/);
  if (megaMatches) {
    megaMatches[1].split('\n').forEach(line => {
      const m = line.match(/"(\d+)":\s*"([^"]+)"/);
      if (m) MEGA_NAME_MAP[m[1]] = m[2];
    });
  }

  // Extract DYNAMAX_NAME_MAP
  const dyMatches = content.match(/const DYNAMAX_NAME_MAP: Record<number, string> = \{([\s\S]+?)\};/);
  if (dyMatches) {
    dyMatches[1].split('\n').forEach(line => {
      const m = line.match(/(\d+):\s*"([^"]+)"/);
      if (m) DYNAMAX_NAME_MAP[Number(m[1])] = m[2];
    });
  }

  // Extract POKEMON_TYPE_DATA - more flexible regex
  const dataMatches = content.match(/export const POKEMON_TYPE_DATA: [^=]+ = \[([\s\S]+?)\];/);
  if (!dataMatches) {
    console.error("Could not find POKEMON_TYPE_DATA");
    return;
  }

  const pokemonList = [];
  const entries = dataMatches[1].split('},');
  for (const entry of entries) {
    const idMatch = entry.match(/id:\s*(\d+)/);
    const nameMatch = entry.match(/name:\s*"([^"]+)"/);
    if (idMatch && nameMatch) {
      pokemonList.push({ id: Number(idMatch[1]), name: nameMatch[1] });
    }
  }

  console.log(`Auditing ${pokemonList.length} Pokemon...`);
  
  const results = [];
  // Limit concurrency to avoid overloading
  const batchSize = 10;
  for (let i = 0; i < pokemonList.length; i += batchSize) {
    const batch = pokemonList.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} / ${Math.ceil(pokemonList.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (p) => {
      const spriteNormal = getSpriteUrl(p.id, false);
      const spriteShiny = getSpriteUrl(p.id, true);
      const artworkNormal = getPokemonArtwork(p.id, false);
      const artworkShiny = getPokemonArtwork(p.id, true);

      const [sn, ss, an, as] = await Promise.all([
        checkUrl(spriteNormal),
        checkUrl(spriteShiny),
        checkUrl(artworkNormal),
        checkUrl(artworkShiny)
      ]);

      if (sn !== 200 || ss !== 200 || an !== 200 || as !== 200) {
        results.push({
          id: p.id,
          name: p.name,
          sn: { url: spriteNormal, status: sn },
          ss: { url: spriteShiny, status: ss },
          an: { url: artworkNormal, status: an },
          as: { url: artworkShiny, status: as }
        });
      }
    }));
  }

  let report = "# Relatório de Sprites e Artworks Faltando ou Quebrados\n\n";
  report += `Data da varredura: ${new Date().toLocaleString()}\n`;
  report += `Total de Pokémon analisados: ${pokemonList.length}\n`;
  report += `Problemas encontrados: ${results.length}\n\n`;
  
  report += "## Legenda de Erros\n";
  report += "- **404**: Arquivo não encontrado.\n";
  report += "- **204**: Arquivo encontrado, mas está vazio ou corrompido (tamanho insuficiente).\n";
  report += "- **408/500**: Erro de conexão com a API externa.\n\n";

  report += "## Resumo de Problemas\n\n";
  
  if (results.length === 0) {
    report += "✅ Nenhuma imagem quebrada encontrada nas fontes atuais!\n";
  } else {
    results.sort((a,b) => a.id - b.id).forEach(r => {
      report += `### [${r.id}] ${r.name}\n`;
      if (r.sn.status !== 200) report += `- Sprite Normal: ❌ ${r.sn.status} (${r.sn.url})\n`;
      if (r.ss.status !== 200) report += `- Sprite Shiny: ❌ ${r.ss.status} (${r.ss.url})\n`;
      if (r.an.status !== 200) report += `- Artwork Normal: ❌ ${r.an.status} (${r.an.url})\n`;
      if (r.as.status !== 200) report += `- Artwork Shiny: ❌ ${r.as.status} (${r.as.url})\n`;
      report += "\n";
    });
  }

  fs.writeFileSync(path.join(__dirname, '..', 'Coisas extras', 'Sprites_Correções.md'), report);
  console.log("Audit complete. Report saved to Coisas extras/Sprites_Correções.md");
}

audit();
