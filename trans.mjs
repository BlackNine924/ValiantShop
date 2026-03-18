import fs from 'fs';
import translate from 'translate';
import https from 'https';

// Configure translate to use google (free)
translate.engine = 'google';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPokeAPI = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'ValiantShopTranslator' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

async function runTranslator() {
  console.log("Iniciando varredura massiva da PokeAPI (1 a 1025)...");
  const maxPokemon = 1025; // Todos os Pokémon reais
  const descriptions = {};

  for (let i = 1; i <= maxPokemon; i++) {
    try {
      const data = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
      const enEntry = data.flavor_text_entries.find(e => e.language.name === 'en');
      
      if (enEntry) {
        // Limpar \f e \n como pedido na limpeza original
        const cleanEnglish = enEntry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ');
        
        // Traduz palavra por palavra via motor Google
        const translated = await translate(cleanEnglish, "pt");
        
        descriptions[i] = translated;
        console.log(`[${i}/100] Traduzido: ${data.name.charAt(0).toUpperCase() + data.name.slice(1)}`);
      }
      
      // Delay pequeno para não tomar rate limit The PokeAPI
      await sleep(150);
      
    } catch (e) {
      console.error(`Falha no ID ${i}:`, e.message);
    }
  }

  // Gera o arquivo final
  let fileContent = `export const MANUAL_DESCRIPTIONS: Record<number, string> = {\n`;
  for (const [id, desc] of Object.entries(descriptions)) {
    // Escapa aspas para não quebrar o código
    const safeDesc = desc.replace(/"/g, '\\"');
    fileContent += `  ${id}: "${safeDesc}",\n`;
  }
  fileContent += `};\n`;

  fs.writeFileSync('src/data/manualDescriptions.ts', fileContent, 'utf-8');
  console.log("Finalizado! Arquivo src/data/manualDescriptions.ts atualizado com as traduções literais.");
}

runTranslator();
