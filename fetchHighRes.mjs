import fs from 'fs';
import path from 'path';
import https from 'https';

const typesContent = fs.readFileSync(path.join(process.cwd(), 'src/data/pokemonTypes.ts'), 'utf-8');

const megaMatch = typesContent.match(/MEGA_NAME_MAP:\s*Record<number,\s*string>\s*=\s*{([^}]+)}/);
const dynamaxMatch = typesContent.match(/DYNAMAX_NAME_MAP:\s*Record<number,\s*string>\s*=\s*{([^}]+)}/);

const megasObj = {};
if (megaMatch) {
  const lines = megaMatch[1].split('\n');
  lines.forEach(line => {
    const m = line.match(/"?(\d+)"?\s*:\s*"([^"]+)"/);
    if (m) megasObj[Number(m[1])] = m[2];
  });
}

const dynamaxObj = {};
if (dynamaxMatch) {
  const lines = dynamaxMatch[1].split('\n');
  lines.forEach(line => {
    const m = line.match(/"?(\d+)"?\s*:\s*"([^"]+)"/);
    if (m) dynamaxObj[Number(m[1])] = m[2];
  });
}

const variationsObj = {
  892: 'urshifu-single-strike',
  10892: 'urshifu-rapid-strike',
  492: 'shaymin-land',
  10492: 'shaymin-sky'
};

const allIdsAndNames = { ...megasObj, ...dynamaxObj, ...variationsObj };

const publicDir = path.join(process.cwd(), 'public', 'assets');
const DIRS = {
    artwork_mega: path.join(publicDir, 'artwork', 'mega'),
    artwork_dynamax: path.join(publicDir, 'artwork', 'dynamax'),
    artwork_variations: path.join(publicDir, 'artwork', 'variations'),
};

function download(url, dest) {
    return new Promise((resolve) => {
        // We want to overwrite the low quality ones, so we don't check for fs.existsSync(dest) and abort anymore.
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                file.close();
                fs.unlink(dest, () => {});
                resolve(false);
            }
        }).on('error', err => {
            fs.unlink(dest, () => {});
            resolve(false);
        });
    });
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'ValiantShop-Script' } }, (res) => {
            if (res.statusCode !== 200) {
                return resolve(null);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

function getFolderType(id) {
    if (id >= 20000 && id < 30000) return 'mega';
    if (id >= 30000 && id < 40000) return 'dynamax';
    return 'variations';
}

function normalizePokeApiName(name) {
    let n = name;
    if (n.endsWith('megax') && n !== 'megax') n = n.replace('megax', 'mega-x');
    if (n.endsWith('megay') && n !== 'megay') n = n.replace('megay', 'mega-y');
    if (n === 'absol-megaz') return null; // Doesn't exist officially
    if (n === 'garchomp-megaz') return null;
    if (n === 'lucario-megaz') return null;
    if (n === 'tatsugiri-droopy-mega') return null; // Doesn't have official mega
    if (n === 'tatsugiri-curly-mega') return null;
    return n;
}

async function fetchHighResArtworks() {
    let successCount = 0;
    
    // We fetch official-artwork for now, as it is consistent with the standard pokedex.
    // If we prefer 3D Home renders, URL is ...pokemon/other/home/{id}.png

    console.log('Fetching high-res artworks via PokeAPI...');
    
    // Concurrency limit to avoid hitting PokeAPI rate limits too hard
    for (const [idStr, name] of Object.entries(allIdsAndNames)) {
        const id = Number(idStr);
        const folderType = getFolderType(id);
        const pokeApiName = normalizePokeApiName(name);
        
        if (!pokeApiName) {
            console.log(`[!] Skipping ${name} (Custom/Unofficial)`);
            continue;
        }

        // Fetch ID from PokeAPI
        const pokeApiData = await getJson(`https://pokeapi.co/api/v2/pokemon/${pokeApiName}`);
        
        if (!pokeApiData || !pokeApiData.id) {
            console.log(`[-] Failed to find PokeAPI ID for: ${pokeApiName}`);
            continue;
        }

        const pokeId = pokeApiData.id;
        
        // Official Artwork URLs
        const artUrlNormal = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`;
        const artUrlShiny = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokeId}.png`;
        
        let artPathNormal = path.join(DIRS[`artwork_${folderType}`], `${id}.png`);
        let artPathShiny = path.join(DIRS[`artwork_${folderType}`], `${id}-shiny.png`);
        
        let aDl = await download(artUrlNormal, artPathNormal);
        if (aDl) {
            console.log(`[+] High-Res Artwork (Normal): ${id} (${pokeApiName}) from ID ${pokeId}`);
            successCount++;
        }
        
        let aDlShiny = await download(artUrlShiny, artPathShiny);
        if (aDlShiny) {
            console.log(`[+] High-Res Artwork (Shiny):  ${id} (${pokeApiName}) from ID ${pokeId}`);
            successCount++;
        }
    }
    
    console.log(`\nFinished downloading high-res artworks. Total downloaded: ${successCount}`);
}

fetchHighResArtworks();
