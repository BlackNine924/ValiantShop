/**
 * RESET SCRIPT - run before each glint test to start from scratch.
 * Resets glintFragments on main Reskalla profile and unsets glintsAwarded on last 5 orders.
 * 
 * Run: node scripts/resetForTest.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDiH8y-aOBb7h8izHgz055I8IEvzKLunrs',
  authDomain: 'valiantshop-1f91f.firebaseapp.com',
  projectId: 'valiantshop-1f91f',
});
const db = getFirestore(app);

// The main authenticated UID (from Google login)
const MAIN_UID = 'FEelmyfacYc42kn3mcBhT7tyWYG2';

async function main() {
  // 1. Show current state
  const profileRef = doc(db, 'trainer_profiles', MAIN_UID);
  const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(30)));
  
  console.log('=== Last 10 orders (most recent) ===');
  let count = 0;
  const walreinOrders = [];
  ordersSnap.forEach(d => {
    const data = d.data();
    if (count < 10) {
      const ts = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,16) : '??';
      console.log(`  [${ts}] "${data.pokemon}" | ${data.playerNick} | ${data.status} | glintsAwarded:${data.glintsAwarded}`);
      count++;
    }
    if ((data.pokemon || '').toLowerCase().includes('walrein')) {
      walreinOrders.push({ id: d.id, ...data });
    }
  });
  
  console.log(`\nFound ${walreinOrders.length} Walrein orders.`);
  
  // 2. Reset glintsAwarded on all Walrein orders
  if (walreinOrders.length > 0) {
    for (const o of walreinOrders) {
      await updateDoc(doc(db, 'orders', o.id), { glintsAwarded: false });
      console.log(`  Reset glintsAwarded: ${o.id} (${o.playerNick})`);
    }
  }
  
  console.log('\nDone! Now:');
  console.log('1. Go to admin panel at localhost:5173/admin');
  console.log('2. Find the Walrein order and change status to Finalizado');
  console.log('3. Check the browser CONSOLE (F12) for [GLINT] lines');
  console.log('4. Then check your Trainer Profile for ice AND water fragments');
  
  process.exit(0);
}

main().catch(e => { 
  console.error('Error:', e.code || e.message); 
  if (e.code === 'permission-denied') {
    console.error('Permission denied - this profile/order can only be written by authenticated users.');
    console.error('You can reset glintsAwarded manually in Firestore Console:');
    console.error('  https://console.firebase.google.com/project/valiantshop-1f91f/firestore');
  }
  process.exit(1); 
});
