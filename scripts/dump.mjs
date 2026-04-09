import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: 'AIzaSyDiH8y-aOBb7h8izHgz055I8IEvzKLunrs',
  authDomain: 'valiantshop-1f91f.firebaseapp.com',
  projectId: 'valiantshop-1f91f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const lines = [];

  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)));
  let i = 0;
  snap.forEach(d => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,16) : '??';
    lines.push(`[${ts}] ${data.pokemon} | ${data.playerNick} | ${data.status} | glintsAwarded:${data.glintsAwarded} | uid:${data.playerUid}`);
    i++;
  });
  lines.push(`\n== TOTAL: ${i} orders ==`);
  
  // Get Reskalla profile specifically
  const reskallaProfileDoc = await getDoc(doc(db, 'trainer_profiles', 'FEelmyfacYc42kn3mcBhT7tyWYG2'));
  if (reskallaProfileDoc.exists()) {
    const p = reskallaProfileDoc.data();
    lines.push(`\n== Reskalla Profile (FEelmy) ==`);
    lines.push(`nick: ${p.nick || p.displayName}`);
    lines.push(`glintFragments: ${JSON.stringify(p.glintFragments)}`);
    lines.push(`glintCollection: ${JSON.stringify(p.glintCollection)}`);
  }

  const pSnap = await getDocs(collection(db, 'trainer_profiles'));
  lines.push('\n== ALL PROFILES ==');
  pSnap.forEach(d => {
    const p = d.data();
    lines.push(`  ${d.id} | "${p.nick || p.displayName}" | ${JSON.stringify(p.glintFragments)}`);
  });
  
  const output = lines.join('\n');
  fs.writeFileSync('scripts/dump.txt', output, 'utf8');
  console.log('Written to dump.txt');
  process.exit(0);
}
main().catch(e => { fs.writeFileSync('scripts/dump.txt', e.message, 'utf8'); process.exit(1); });
