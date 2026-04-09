import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDiH8y-aOBb7h8izHgz055I8IEvzKLunrs',
  authDomain: 'valiantshop-1f91f.firebaseapp.com',
  projectId: 'valiantshop-1f91f',
  storageBucket: 'valiantshop-1f91f.firebasestorage.app',
  messagingSenderId: '1090923420485',
  appId: '1:1090923420485:web:b9fb656c62cabc5cc0fc2c'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log('Last 20 orders:');
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(20)));
  snap.forEach(d => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,16) : '??';
    console.log(`[${ts}] ${d.id.slice(0,8)} | "${data.pokemon}" | ${data.playerNick} | status:${data.status} | glintsAwarded:${data.glintsAwarded}`);
  });
  
  console.log('\n\nAll trainer profiles:');
  const pSnap = await getDocs(collection(db, 'trainer_profiles'));
  pSnap.forEach(d => {
    const p = d.data();
    console.log(`  UID: ${d.id.slice(0,10)} | nick: "${p.nick || p.displayName}" | glints: ${JSON.stringify(p.glintFragments || {})}`);
  });
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
