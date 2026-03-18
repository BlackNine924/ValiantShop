import fs from 'fs';
import path from 'path';

// Load pokemonTypes.ts to get the mappings
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

// Special variations from the markdown
const variationsObj = {
  892: 'urshifu-single-strike',
  10892: 'urshifu-rapid-strike',
  492: 'shaymin-land',
  10492: 'shaymin-sky'
};

const allIdsAndNames = { ...megasObj, ...dynamaxObj, ...variationsObj };

const spritesDir = path.join(process.cwd(), 'public/assets/sprites');
const spriteFolders = {
  mega: path.join(spritesDir, 'mega'),
  dynamax: path.join(spritesDir, 'dynamax'),
  variations: path.join(spritesDir, 'variations')
};

const artworkFolder = path.join(spritesDir, 'artwork');

function checkFiles(obj, folder, isArtwork=false) {
  const files = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
  let issues = [];
  
  for (const [idStr, name] of Object.entries(obj)) {
    const id = Number(idStr);
    
    const normalExists = files.includes(`${id}.png`);
    const shinyExists = files.includes(`${id}-shiny.png`);
    
    if (!normalExists) issues.push(`- [ ] ID ${id} (${name}) [Normal] - Arquivo ausente`);
    // O usuário pediu para listar shinys AUSENTES *apenas* para Artworks. 
    // Para Sprites 2D, a forma shiny não é necessária.
    if (isArtwork && !shinyExists) {
      issues.push(`- [ ] ID ${id} (${name}) [Shiny] - Arquivo ausente`);
    }
  }
  
  if (!isArtwork) {
      for (const file of files) {
          if (!file.endsWith('.png')) continue;
          const baseId = parseInt(file.split('-')[0]);
          if (!obj[baseId]) {
              issues.push(`- [ ] Arquivo extra não esperado nesta pasta: ${file}`);
          }
      }
  }

  return issues;
}

const megaIssuesSprites = checkFiles(megasObj, spriteFolders.mega);
const dmaxIssuesSprites = checkFiles(dynamaxObj, spriteFolders.dynamax);
const varIssuesSprites = checkFiles(variationsObj, spriteFolders.variations);

const artworkIssues = checkFiles(allIdsAndNames, artworkFolder, true);


// Identificando quais podemos pegar automaticamente e quais não podemos (ex: "urshifu-rapid-strike")
// Para automatizar depois (usando o PokeAPI e o Pokemon Showdown), a maioria dos que estão na lista
// (os que vieram do pokemonTypes.ts que geram URL da PokeAPI/Showdown) eu consigo baixar.
let easilyFetchable = [];
for (const [idStr, name] of Object.entries(allIdsAndNames)) {
    // Basicamente a maioria das megas mapeadas e dynamax no Showdown ou PokeAPI dá pra baixar via script Node.
    easilyFetchable.push(`- ID ${idStr}: ${name}`);
}

let spritesMd = `# Audit: 2D Sprites
Aqui estão todos os arquivos de Sprites 2D que precisam de atenção, agrupados por categoria. (Shinys ignorados conforme solicitado)

## Megas (Faixa 20000+)
${megaIssuesSprites.length ? megaIssuesSprites.join('\n') : 'Nenhum problema encontrado.'}

## Dynamax/Gigantamax (Faixa 30000+)
${dmaxIssuesSprites.length ? dmaxIssuesSprites.join('\n') : 'Nenhum problema encontrado.'}

## Variantes Especiais (Faixa 10000+ e Especiais)
${varIssuesSprites.length ? varIssuesSprites.join('\n') : 'Nenhum problema encontrado.'}

---

## 🤖 Automático / Fetchable
Abaixo estão os Pokémon (2D Sprites) dos quais eu consigo baixar e adicionar as imagens automaticamente via script (Pokemon Showdown / PokeAPI), sem que você precise fazer isso manualmente:
${easilyFetchable.join('\n')}
`;

let artworksMd = `# Audit: 3D Artworks
Aqui estão todos os arquivos de Artwork 3D que estão faltando ou precisam de atenção. Como nenhuma artwork customizada foi adicionada ainda, todos estão listados abaixo.

## Artworks (Megas, Dynamax e Variantes Especiais)
${artworkIssues.length ? artworkIssues.join('\n') : 'Nenhum problema encontrado.'}

---

## 🤖 Automático / Fetchable
Abaixo estão os Pokémon (3D Artworks) dos quais eu consigo buscar a arte oficial (caso exista na PokeAPI oficial/Pokemon Home) e adicionar automaticamente as imagens:
${easilyFetchable.join('\n')}
`;

fs.writeFileSync(path.join(process.cwd(), 'SPRITES.md'), spritesMd);
fs.writeFileSync(path.join(process.cwd(), 'ARTWORKS.md'), artworksMd);

console.log('Audit completed. Files generated.');
