const fs = require('fs');

async function run() {
  console.log("Fetching all moves via GraphQL...");
  const q = `query {
    pokemon_v2_move {
      name
      pokemon_v2_moveeffect {
        pokemon_v2_moveeffecteffecttexts(where: {language_id: {_eq: 9}}) {
          short_effect
        }
      }
    }
  }`;

  let data;
  try {
    const res = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    data = await res.json();
  } catch (e) {
    console.error("Failed to fetch GraphQL", e);
    return;
  }

  const moves = data.data.pokemon_v2_move;
  console.log(`Found ${moves.length} moves.`);

  const uniqueEffects = new Set();
  for (const m of moves) {
    const effects = m.pokemon_v2_moveeffect?.pokemon_v2_moveeffecteffecttexts;
    if (effects && effects.length > 0) {
      uniqueEffects.add(effects[0].short_effect.replace(/\n/g, ' ').replace(/\r/g, ''));
    }
  }

  const effectsArray = Array.from(uniqueEffects);
  console.log(`Found ${effectsArray.length} unique effects to translate.`);

  const translations = {};
  
  // Batch translation
  // To avoid hitting 429 on Google GTX, we translate in batches of 20 with a delay
  const BATCH_SIZE = 20;
  for (let i = 0; i < effectsArray.length; i += BATCH_SIZE) {
    const batch = effectsArray.slice(i, i + BATCH_SIZE);
    console.log(`Translating batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(effectsArray.length / BATCH_SIZE)}`);
    
    await Promise.all(batch.map(async (text) => {
      try {
        const trRes = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' + encodeURIComponent(text));
        if (!trRes.ok) throw new Error("Status " + trRes.status);
        const trData = await trRes.json();
        // GTX returns an array of chunks: [[["Translation chunk 1", "Source chunk 1"], ["Chunk 2", "Source 2"]]]
        const ptText = trData[0].map(chunk => chunk[0]).join('');
        translations[text] = ptText;
      } catch (e) {
        console.error("Translation failed for a string:", e.message);
        translations[text] = text; // fallback to original if failed
      }
    }));
    
    // Sleep 1 second between batches
    await new Promise(r => setTimeout(r, 1000));
  }

  // Create src/data directory if it doesn't exist
  if (!fs.existsSync('c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/data')) {
    fs.mkdirSync('c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/data', { recursive: true });
  }

  fs.writeFileSync(
    'c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/data/moveTranslations.json', 
    JSON.stringify(translations, null, 2)
  );

  console.log("Translations saved to src/data/moveTranslations.json!");
}

run();
