const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'cobblemonData.json'), 'utf8'));
const keys = Object.keys(data).filter(k => k.includes('sandshrew') || k.includes('wooper') || k.includes('vulpix') || k.includes('nidoran'));
console.log(keys);
