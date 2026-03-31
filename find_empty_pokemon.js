const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'cobblemonData.json'), 'utf8'));
const empty = Object.entries(data).filter(([id, val]) => {
  return val.spawns.length === 0 || val.drops.length === 0;
});
console.log('Total entries with empty sections:', empty.length);
empty.slice(0, 10).forEach(([id, val]) => {
  console.log(`${id}: Spawns=${val.spawns.length}, Drops=${val.drops.length}`);
});
const variantsWithIssues = empty.filter(([id]) => id.includes('_'));
console.log('Variants with empty sections:', variantsWithIssues.length);
variantsWithIssues.slice(0, 10).forEach(([id, val]) => {
  console.log(`${id}: Spawns=${val.spawns.length}, Drops=${val.drops.length}`);
});
