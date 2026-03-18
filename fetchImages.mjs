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
    sprites_mega: path.join(publicDir, 'sprites', 'mega'),
    sprites_dynamax: path.join(publicDir, 'sprites', 'dynamax'),
    sprites_variations: path.join(publicDir, 'sprites', 'variations'),
    artwork_mega: path.join(publicDir, 'artwork', 'mega'),
    artwork_dynamax: path.join(publicDir, 'artwork', 'dynamax'),
    artwork_variations: path.join(publicDir, 'artwork', 'variations'),
};

Object.values(DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function download(url, dest) {
    return new Promise((resolve) => {
        if (fs.existsSync(dest)) {
            // Already exists, skip
            return resolve(false);
        }
        
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

// Pokemon Showdown has high-res models in this path: 
// https://play.pokemonshowdown.com/sprites/dex/charizard-megax.png
// https://play.pokemonshowdown.com/sprites/dex-shiny/charizard-megax.png

// Dynamax models aren't really high res on Showdown (they just use scale in game), but they have normal gen5 sprites.
// PokeAPI has high-res for standard Pokemon but we don't have their PokeAPI IDs for GMax usually mapped perfectly, only the base species ID + varieties.
// Wait, we can use the gen5 sprites for sprites, and Pokemon Home sprites from Showdown or just `dex` folder from Showdown for Artworks as a good fallback.

function getFolderType(id) {
    if (id >= 20000 && id < 30000) return 'mega';
    if (id >= 30000 && id < 40000) return 'dynamax';
    return 'variations';
}

async function fetchAll() {
    let successCount = 0;
    
    for (const [idStr, name] of Object.entries(allIdsAndNames)) {
        const id = Number(idStr);
        const folderType = getFolderType(id);
        
        // 1. Sprites 2D (Apenas Normal)
        // Showdown Gen 5 static sprites are png. Wait, Gen 5 static are .png, Gen 5 animated are .gif
        // We want static PNGs for the grid usually. Let's try .png
        let spriteUrlNormal = `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`;
        let spritePathNormal = path.join(DIRS[`sprites_${folderType}`], `${id}.png`);
        
        let sDl = await download(spriteUrlNormal, spritePathNormal);
        if (sDl) {
            console.log(`[+] Sprite 2D: ${id} (${name})`);
            successCount++;
        }
        
        // 2. Artworks 3D (Normal + Shiny)
        // O Pokemon Showdown tem a pasta 'dex' e 'dex-shiny' que contém as artworks do Pokemon Home / alta qualidade.
        let artUrlNormal = `https://play.pokemonshowdown.com/sprites/dex/${name}.png`;
        let artPathNormal = path.join(DIRS[`artwork_${folderType}`], `${id}.png`);
        
        let artUrlShiny = `https://play.pokemonshowdown.com/sprites/dex-shiny/${name}.png`;
        let artPathShiny = path.join(DIRS[`artwork_${folderType}`], `${id}-shiny.png`);
        
        let aDl = await download(artUrlNormal, artPathNormal);
        if (aDl) {
            console.log(`[+] Artwork 3D (Normal): ${id} (${name})`);
            successCount++;
        }
        
        let aDlShiny = await download(artUrlShiny, artPathShiny);
        if (aDlShiny) {
            console.log(`[+] Artwork 3D (Shiny): ${id} (${name})`);
            successCount++;
        }
    }
    
    console.log(`\nFinished checking/downloading. Downloads completed: ${successCount}`);
}

fetchAll();
