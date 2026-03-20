const https = require('https');

function check(url, label) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({ url, label, status: res.statusCode });
      res.resume();
    });
    req.on('error', (e) => {
      resolve({ url, label, status: 'Error: ' + e.message });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ url, label, status: 'Timeout' });
    });
  });
}

const candidates = [
  // Shaymin Sky
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/shaymin-sky.png', label: 'Shaymin Sky 2D - Showdown gen5' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/492-sky.png', label: 'Shaymin Sky 2D - PokeAPI 492-sky' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10007.png', label: 'Shaymin Sky artwork - PokeAPI 10007' },
  
  // Magearna Original
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/magearna-original.png', label: 'Magearna Original 2D - Showdown gen5' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10147.png', label: 'Magearna Original artwork - PokeAPI 10147' },
  
  // Urshifu Gmax
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/urshifu-rapidstrike-gmax.png', label: 'Urshifu RS Gmax 2D - Showdown rapid-gmax' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/urshifu-gmax.png', label: 'Urshifu Gmax 2D - Showdown gmax' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10191.png', label: 'Urshifu RS Gmax 2D - PokeAPI 10191' },
  
  // Z-A Mega Absol Z alternatives
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/absol-megaz.png', label: 'Absol Mega Z 2D - Showdown absol-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/absol-mega.png', label: 'Absol Mega 2D - Showdown absol-mega' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10057.png', label: 'Absol Mega 2D - PokeAPI 10057' },
  
  // Z-A Mega Garchomp Z
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/garchomp-megaz.png', label: 'Garchomp Mega Z 2D - Showdown garchomp-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/garchomp-mega.png', label: 'Garchomp Mega 2D - Showdown garchomp-mega' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10058.png', label: 'Garchomp Mega 2D - PokeAPI 10058' },
  
  // Z-A Mega Lucario Z
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/lucario-megaz.png', label: 'Lucario Mega Z 2D - Showdown lucario-megaz' },
  { url: 'https://play.pokemonshowdown.com/sprites/gen5/lucario-mega.png', label: 'Lucario Mega 2D - Showdown lucario-mega' },
  { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10059.png', label: 'Lucario Mega 2D - PokeAPI 10059' },
];

async function main() {
  const results = await Promise.all(candidates.map(c => check(c.url, c.label)));
  results.forEach(r => {
    const ok = r.status === 200 ? '✅ 200' : `❌ ${r.status}`;
    console.log(`${ok} | ${r.label}`);
    console.log(`       ${r.url}`);
  });
}

main();
