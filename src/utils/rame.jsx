import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// სატესტო ფუნქცია პაციენტების მასიური დამატებისთვის
export const bulkAddPatients = async () => {
  const user = auth.currentUser;
  if (!user) return alert("ავტორიზაცია საჭიროა!");

  console.log("დაიწყო პაციენტების გენერაცია...");

  try {
    for (let i = 1; i <= 48; i++) {
      await addDoc(collection(db, "patients"), {
        fullName: `სატესტო პაციენტი #${i}`,
        personalId: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        phone: `595${Math.floor(100000 + Math.random() * 900000)}`,
        email: `test${i}@example.com`,
        birthDate: "1990-01-01",
        gender: "not_specified",
        clinicId: user.uid, // შენი კლინიკის ID
        createdAt: serverTimestamp(),
        status: 'active',
        teethStatus: {} // ცარიელი ფორმულა
      });
      console.log(`დაემატა პაციენტი: ${i}`);
    }
    alert("48 სატესტო პაციენტი წარმატებით დაემატა!");
  } catch (error) {
    console.error("Error during bulk add:", error);
  }
};