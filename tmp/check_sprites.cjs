const https = require('https');

function check(url, label) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, label, status: res.statusCode });
      res.resume();
    }).on('error', (e) => {
      resolve({ url, label, status: 'Error: ' + e.message });
    });
  });
}

const candidates = [
  // Shaymin Sky - 2D
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/shaymin-sky.png', label: 'Shaymin Sky - Showdown gen5' },
  { url: 'https://play.pokemonshowdown.com/sprites/ani/shaymin-sky.png', label: 'Shaymin Sky - Showdown animated' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/492-sky.png', label: 'Shaymin Sky - PokeAPI (492-sky)' },
  
  // Magearna Original - 2D
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/magearna-original.png', label: 'Magearna Original - Showdown gen5' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10147.png', label: 'Magearna Original - PokeAPI 10147' },
  
  // Urshifu Rapid Strike Gmax - 2D
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/urshifu-rapidstrike-gmax.png', label: 'Urshifu Rapid Gmax - Showdown gen5' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen6/urshifu-rapidstrike-gmax.png', label: 'Urshifu Rapid Gmax - Showdown gen6' },
  
  // Z-A Megas - 2D
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/absol-megaz.png', label: 'Absol Mega Z - Showdown gen5 absol-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/absol-mega-z.png', label: 'Absol Mega Z - Showdown gen5 absol-mega-z' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/garchomp-megaz.png', label: 'Garchomp Mega Z - Showdown gen5 garchomp-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/garchomp-mega-z.png', label: 'Garchomp Mega Z - Showdown gen5 garchomp-mega-z' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/lucario-megaz.png', label: 'Lucario Mega Z - Showdown gen5 lucario-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/lucario-mega-z.png', label: 'Lucario Mega Z - Showdown gen5 lucario-mega-z' },

  // 3D Artworks - use Serebii or PokeAPI 
  { url: 'https://raw.githubusercontent.com/jbkroner/pokeDokuSprites/main/sprites/absol-megaz.png', label: 'Absol Mega Z - jbkroner GitHub' },
  { url: 'https://raw.githubusercontent.com/jbkroner/pokeDokuSprites/main/sprites/lucario-megaz.png', label: 'Lucario Mega Z - jbkroner GitHub' },
  { url: 'https://raw.githubusercontent.com/jbkroner/pokeDokuSprites/main/sprites/garchomp-megaz.png', label: 'Garchomp Mega Z - jbkroner GitHub' },
  
  // Magearna Original - 3D artwork
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10147.png', label: 'Magearna Original Artwork - PokeAPI 10147' },
];

async function main() {
  const results = await Promise.all(candidates.map(c => check(c.url, c.label)));
  results.forEach(r => {
    const ok = r.status === 200 ? '✅' : '❌';
    console.log(`${ok} [${r.status}] ${r.label}\n   ${r.url}`);
  });
}

main();
