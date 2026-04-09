/**
 * Script to inspect ALL Walrein orders and both Reskalla profiles.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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
  console.log('=== WALREIN ORDERS ===');
  const allOrders = await getDocs(collection(db, 'orders'));
  
  let walreinOrders = [];
  for (const d of allOrders.docs) {
    const data = d.data();
    if ((data.pokemon || '').toLowerCase().includes('walrein')) {
      walreinOrders.push({ id: d.id, ...data });
    }
  }
  
  console.log(`Found ${walreinOrders.length} Walrein orders total:`);
  for (const o of walreinOrders) {
    const created = o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : 'unknown';
    console.log(`\n  ID: ${o.id}`);
    console.log(`  Player: ${o.playerNick} | uid: ${o.playerUid}`);
    console.log(`  Status: ${o.status} | glintsAwarded: ${o.glintsAwarded}`);
    console.log(`  Created: ${created}`);
  }
  
  // Reset glintsAwarded on all of them
  console.log('\n=== RESETTING glintsAwarded ===');
  for (const o of walreinOrders) {
    if (o.glintsAwarded) {
      await updateDoc(doc(db, 'orders', o.id), { glintsAwarded: false });
      console.log(`  Reset: ${o.id} (${o.playerNick})`);
    } else {
      console.log(`  Already false: ${o.id}`);
    }
  }

  // Reset the glint fragments to clean state for testing
  console.log('\n=== RESETTING Reskalla glintFragments (FEelmy... profile) ===');
  const mainProfileRef = doc(db, 'trainer_profiles', 'FEelmyfacYc42kn3mcBhT7tyWYG2');
  await updateDoc(mainProfileRef, {
    'glintFragments.fire': 0,
    'glintFragments.ice': 0,
    'glintFragments.water': 0,
  });
  console.log('  Set fire=0, ice=0, water=0 on main profile');
  
  console.log('\nDone! Now go finalize a Walrein order in the admin panel and check the console.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
