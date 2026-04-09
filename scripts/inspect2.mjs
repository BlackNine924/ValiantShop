/**
 * Use Firebase Admin SDK to reset glintsAwarded and inspect profiles.
 * Requires: npm install firebase-admin
 * Run: node scripts/adminReset.mjs
 * 
 * Since we don't have a service account JSON, this reads orders with
 * the client SDK (public read access) and reports what needs changing.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDiH8y-aOBb7h8izHgz055I8IEvzKLunrs',
  projectId: 'valiantshop-1f91f',
});
const db = getFirestore(app);

async function main() {
  const MAIN_UID = 'FEelmyfacYc42kn3mcBhT7tyWYG2';
  
  console.log('=== RESKALLA PROFILE STATE ===');
  const profileSnap = await getDoc(doc(db, 'trainer_profiles', MAIN_UID));
  if (profileSnap.exists()) {
    const p = profileSnap.data();
    console.log('nick:', p.nick || p.displayName);
    console.log('glintFragments:', JSON.stringify(p.glintFragments, null, 2));
    console.log('glintCollection:', JSON.stringify(p.glintCollection?.map((g) => g.type) || []));
    console.log('ordersCompleted:', p.ordersCompletedCount);
  } else {
    console.log('Profile not found!');
  }

  console.log('\n=== WALREIN ORDERS (all) ===');
  const allOrders = await getDocs(collection(db, 'orders'));
  let found = 0;
  allOrders.forEach(d => {
    const data = d.data();
    if ((data.pokemon || '').toLowerCase().includes('walrein')) {
      const ts = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,16) : '??';
      console.log(`  ID: ${d.id}`);
      console.log(`  Date: ${ts} | Player: ${data.playerNick} | UID: ${data.playerUid}`);
      console.log(`  Status: ${data.status} | glintsAwarded: ${data.glintsAwarded}`);
      found++;
    }
  });
  if (found === 0) console.log('  None found.');

  console.log('\n=== INSTRUCTIONS ===');
  console.log('To reset glintsAwarded, go to:');
  console.log('  https://console.firebase.google.com/project/valiantshop-1f91f/firestore/data/orders');
  console.log('Find your Walrein order and set glintsAwarded = false');
  console.log('\nOR: Create a brand new Walrein order from the site (it will have glintsAwarded=undefined which is treated as false)');
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
