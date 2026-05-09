const fs = require('fs');

async function run() {
  console.log("Fetching all moves from REST API...");
  let res = await fetch('https://pokeapi.co/api/v2/move?limit=1000');
  let data = await res.json();
  const urls = data.results.map(r => r.url);
  
  console.log(`Found ${urls.length} moves. Fetching details...`);
  
  const uniqueEffects = new Set();
  
  const BATCH = 50;
  for(let i=0; i < urls.length; i+=BATCH) {
    const chunk = urls.slice(i, i+BATCH);
    await Promise.all(chunk.map(async url => {
      try {
        const r = await fetch(url);
        const d = await r.json();
        const enDesc = d.effect_entries?.find(e => e.language.name === 'en')?.short_effect;
        if (enDesc) {
          uniqueEffects.add(enDesc.replace(/\n/g, ' ').replace(/\r/g, ''));
        }
      } catch(e) {}
    }));
  }
  
  const effectsArray = Array.from(uniqueEffects);
  console.log(`Found ${effectsArray.length} unique REST effects to translate.`);
  
  const translations = {};
  
  const TR_BATCH = 15;
  for (let i = 0; i < effectsArray.length; i += TR_BATCH) {
    const batch = effectsArray.slice(i, i + TR_BATCH);
    console.log(`Translating batch ${Math.floor(i/TR_BATCH) + 1} of ${Math.ceil(effectsArray.length / TR_BATCH)}`);
    
    await Promise.all(batch.map(async (text) => {
      try {
        const trRes = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' + encodeURIComponent(text));
        if (!trRes.ok) throw new Error("Status " + trRes.status);
        const trData = await trRes.json();
        const ptText = trData[0].map(chunk => chunk[0]).join('');
        translations[text] = ptText;
      } catch (e) {
        console.error("Translation failed for:", text);
        translations[text] = text; 
      }
    }));
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(
    'c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/data/moveTranslations.json', 
    JSON.stringify(translations, null, 2)
  );

  console.log("REST API Translations saved!");
}

run();
