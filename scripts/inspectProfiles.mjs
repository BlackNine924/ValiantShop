/**
 * Merge duplicate Reskalla profiles into the main auth UID profile.
 * The main auth UID (FEelmyfacYc42kn3mcBhT7tyWYG2) is kept.
 * The old reskalla UID (VuLEs8GAftUG2n1JC0QkYFuDpue2) data is merged into it.
 * Requires running with a service account. 
 * 
 * Since we can't use Admin SDK here directly, the approach is:
 * Read both, show what would be merged.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDiH8y-aOBb7h8izHgz055I8IEvzKLunrs',
  authDomain: 'valiantshop-1f91f.firebaseapp.com',
  projectId: 'valiantshop-1f91f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const MAIN_UID = 'FEelmyfacYc42kn3mcBhT7tyWYG2'; // Arthur Reskalla - actual Google Auth UID
  const OLD_UID  = 'VuLEs8GAftUG2n1JC0QkYFuDpue2'; // reskalla - old profile

  const mainDoc = await getDoc(doc(db, 'trainer_profiles', MAIN_UID));
  const oldDoc  = await getDoc(doc(db, 'trainer_profiles', OLD_UID));

  console.log('=== MAIN PROFILE (FEelmy - Google Auth UID) ===');
  if (mainDoc.exists()) {
    const d = mainDoc.data();
    console.log('nick:', d.nick || d.displayName);
    console.log('glintFragments:', JSON.stringify(d.glintFragments));
    console.log('glintCollection.length:', (d.glintCollection || []).length);
    console.log('totalSpent:', d.totalSpent);
    console.log('ordersCompletedCount:', d.ordersCompletedCount);
  } else {
    console.log('Not found');
  }
  
  console.log('\n=== OLD PROFILE (VuLEs8 - old reskalla) ===');
  if (oldDoc.exists()) {
    const d = oldDoc.data();
    console.log('nick:', d.nick || d.displayName);
    console.log('glintFragments:', JSON.stringify(d.glintFragments));
    console.log('glintCollection:', JSON.stringify(d.glintCollection));
    console.log('totalSpent:', d.totalSpent);
    console.log('ordersCompletedCount:', d.ordersCompletedCount);
  } else {
    console.log('Not found');
  }

  // Check which UID recent orders point to
  console.log('\n=== RECENT ORDERS with playerUid ===');
  const ordersSnap = await getDocs(collection(db, 'orders'));
  let mainCount = 0, oldCount = 0;
  ordersSnap.forEach(d => {
    const data = d.data();
    if (data.playerUid === MAIN_UID) mainCount++;
    if (data.playerUid === OLD_UID) oldCount++;
  });
  console.log(`Orders with main UID (FEelmy): ${mainCount}`);
  console.log(`Orders with old UID (VuLEs8): ${oldCount}`);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
