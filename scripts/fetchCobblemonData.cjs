const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'cobblemonData.json');
const DROPS_URL = 'https://docs.google.com/spreadsheets/d/1EG8-VxLukiGWonM7e9J_DH0ZAVdkWo3W64bP2jT6koo/export?format=csv&gid=0';
const SPAWNS_URL = 'https://docs.google.com/spreadsheets/d/1DJT7Hd0ldgVUjJbN0kYQFAyNBP6JGG_Clkipax98x-g/export?format=csv&gid=0';

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NodeJS' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCSV(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSVLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeName(name) {
  let n = name.toLowerCase()
    .replace(/\s*\[alolan\]/g, '_alola')
    .replace(/\s*\[galarian\]/g, '_galar')
    .replace(/\s*\[hisuian\]/g, '_hisui')
    .replace(/\s*\[paldean\]/g, '_paldea')
    .replace(/♀/g, '_f')
    .replace(/♂/g, '_m');
  
  // Clean up remaining invalid characters (keep a-z, 0-9, and underscores)
  n = n.replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return n;
}

function parseDropsString(dropsStr) {
  if (!dropsStr || dropsStr.trim() === '') return [];
  // Parse something like "Melon Seeds 0-1, Miracle Seed 5%"
  // Split by comma
  const items = dropsStr.split(',').map(s => s.trim()).filter(s => s);
  
  return items.map(itemStr => {
    // Try to extract chance (e.g. 5%)
    let chance = '100%';
    const chanceMatch = itemStr.match(/(\d+(?:\.\d+)?%)/);
    if (chanceMatch) {
      chance = chanceMatch[1];
      itemStr = itemStr.replace(chanceMatch[1], '').trim();
    }
    
    // Try to extract quantity (e.g. 0-1, 1-2)
    let quantity = '1';
    const numMatch = itemStr.match(/(\d+-\d+|\d+)$/);
    if (numMatch) {
      quantity = numMatch[1];
      itemStr = itemStr.replace(numMatch[1], '').trim();
    }
    
    return {
      item: itemStr.charAt(0).toUpperCase() + itemStr.slice(1),
      quantity: quantity,
      chance: chance
    };
  });
}

async function main() {
  console.log('Fetching official Cobblemon data from Google Sheets...');
  
  try {
    const [dropsRaw, spawnsRaw] = await Promise.all([
      fetchCSV(DROPS_URL),
      fetchCSV(SPAWNS_URL)
    ]);
    
    const dropsLines = dropsRaw.split('\n').filter(l => l.trim().length > 0);
    const spawnsLines = spawnsRaw.split('\n').filter(l => l.trim().length > 0);
    
    console.log(`Fetched ${dropsLines.length} drop entries and ${spawnsLines.length} spawn entries.`);
    
    const db = {};
    
    // Create DB structure mapping everything
    const ensureEntry = (name) => {
      const norm = normalizeName(name);
      if (!db[norm]) {
        db[norm] = { spawns: [], drops: [] };
      }
      return norm;
    };
    
    // Parse Spawns
    // Headers: No.,Pokémon,Entry,Bucket,Weight,Lv. Min,Lv. Max,Biome,Time,Condition,Weather,Tags,Light Min,Light Max,Sky Light Min,Sky Light Max,Preset,Required Block
    for (let i = 1; i < spawnsLines.length; i++) {
        const columns = parseCSVLine(spawnsLines[i]);
        if (columns.length < 11) continue;
        
        const pokemonName = columns[1];
        if (!pokemonName || pokemonName === 'Pokémon') continue;
        
        const normName = ensureEntry(pokemonName);
        
        const rarityBucket = columns[3] || 'common';
        const biomesRaw = columns[7] || '';
        const timeRaw = columns[8] || 'any';
        const weatherRaw = columns[10] || 'any';
        
        let translatedRarity = 'Comum';
        if (rarityBucket.includes('ultra-rare')) translatedRarity = 'Ultra Raro';
        else if (rarityBucket.includes('rare')) translatedRarity = 'Raro';
        else if (rarityBucket.includes('uncommon')) translatedRarity = 'Incomum';
        
        const biomesList = biomesRaw.split(',').map(s => s.trim()).filter(s => s);
        
        db[normName].spawns.push({
            rarity: translatedRarity,
            biomes: biomesList,
            time: timeRaw.toLowerCase() === 'any' ? '' : timeRaw,
            weather: weatherRaw.toLowerCase() === 'any' ? '' : weatherRaw,
            isCustom: false
        });
    }

    // Parse Drops
    // Headers: No.,Pokémon,Drops,Spawn Specific Drops
    for (let i = 1; i < dropsLines.length; i++) {
        const columns = parseCSVLine(dropsLines[i]);
        if (columns.length < 3) continue;
        
        const pokemonName = columns[1];
        if (!pokemonName || pokemonName === 'Pokémon') continue;
        
        const normName = ensureEntry(pokemonName);
        const dropsStr = columns[2] || '';
        
        // Sometimes missing drop info but listed in sheet
        if (dropsStr && dropsStr !== 'None') {
            const parsedDrops = parseDropsString(dropsStr);
            db[normName].drops.push(...parsedDrops);
        }
    }
    
    // Save output
    const outDir = path.dirname(OUT_FILE);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.writeFileSync(OUT_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log(`Successfully generated cobblemonData.json with ${Object.keys(db).length} entries!`);
    console.log('Saved to:', OUT_FILE);

  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

main();
