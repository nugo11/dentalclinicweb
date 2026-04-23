import { db } from './src/firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function checkFinance() {
  const clinicId = "v6P2Q5M9m1f8R3N7k4L0"; // This is a placeholder, I should get it from context if possible, but I'll search all finance docs first to see structure.
  
  const q = query(collection(db, "finance"));
  const snapshot = await getDocs(q);
  
  console.log("Finance Documents:");
  snapshot.docs.forEach(doc => {
    console.log(JSON.stringify({id: doc.id, ...doc.data()}, null, 2));
  });
}

checkFinance();
