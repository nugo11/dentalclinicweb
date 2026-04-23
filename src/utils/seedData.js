import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from "firebase/firestore";

export const seedTestData = async (clinicId) => {
  if (!clinicId) return { success: false, error: "No clinicId provided" };

  try {
    const now = new Date().toISOString();
    const collectionsToClear = ["services", "patients", "inventory", "appointments"];

    // 0. ძველი მონაცემების გასუფთავება (გარდა მომხმარებლებისა)
    for (const colName of collectionsToClear) {
      const q = query(collection(db, colName), where("clinicId", "==", clinicId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          batch.delete(doc(db, colName, d.id));
        });
        await batch.commit();
      }
    }

    // 0.1 პერსონალის გასუფთავება (გარდა ადმინისა)
    const qUsers = query(collection(db, "users"), where("clinicId", "==", clinicId));
    const userSnapshot = await getDocs(qUsers);
    if (!userSnapshot.empty) {
      const userBatch = writeBatch(db);
      userSnapshot.docs.forEach((d) => {
        // არ წავშალოთ ადმინი
        if (d.data().role !== "admin") {
          userBatch.delete(doc(db, "users", d.id));
        }
      });
      await userBatch.commit();
    }

    // 1. დავამატოთ პერსონალი (ექიმები და რეგისტრატორი) - ვიყენებთ "users" კოლექციას
    const staffMembers = [
      { fullName: "ექიმი გიორგი", role: "doctor", pin: "1111", clinicId, status: "active", createdAt: now },
      { fullName: "ექიმი ნინო", role: "doctor", pin: "2222", clinicId, status: "active", createdAt: now },
      { fullName: "ექიმი დავითი", role: "doctor", pin: "3333", clinicId, status: "active", createdAt: now },
      { fullName: "რეგისტრატორი ანა", role: "receptionist", pin: "4444", clinicId, status: "active", createdAt: now },
    ];

    const staffIds = [];
    for (const staff of staffMembers) {
      const docRef = await addDoc(collection(db, "users"), staff);
      staffIds.push({ id: docRef.id, name: staff.fullName, role: staff.role });
    }

    // 2. დავამატოთ სერვისები
    const services = [
      { name: "კონსულტაცია", price: 20, duration: 30, clinicId },
      { name: "თერაპია - ბჟენი", price: 80, duration: 60, clinicId },
      { name: "ჰიგიენური წმენდა", price: 100, duration: 45, clinicId },
      { name: "იმპლანტაცია", price: 1200, duration: 90, clinicId },
      { name: "რენტგენი", price: 15, duration: 15, clinicId },
    ];

    for (const service of services) {
      await addDoc(collection(db, "services"), service);
    }

    // 3. დავამატოთ პაციენტები
    const patients = [
      { fullName: "გიორგი მახარაძე", phone: "555123456", email: "giorgi@example.com", address: "თბილისი", clinicId, createdAt: now },
      { fullName: "ნინო ტაბატაძე", phone: "555987654", email: "nino@example.com", address: "ქუთაისი", clinicId, createdAt: now },
      { fullName: "დავით ბერიძე", phone: "555111222", email: "daviti@example.com", address: "ბათუმი", clinicId, createdAt: now },
      { fullName: "ანა კაპანაძე", phone: "555333444", email: "ana@example.com", address: "თბილისი", clinicId, createdAt: now },
      { fullName: "ლევან კაპანაძე", phone: "555555666", email: "levani@example.com", address: "თბილისი", clinicId, createdAt: now },
    ];

    const patientIds = [];
    for (const patient of patients) {
      const docRef = await addDoc(collection(db, "patients"), patient);
      patientIds.push({ id: docRef.id, name: patient.fullName });
    }

    // 4. დავამატოთ ინვენტარი
    const inventory = [
      { name: "ადჰეზივი", quantity: 5, unit: "ცალი", minThreshold: 2, pricePerUnit: 15, category: "consumable", clinicId, createdAt: now },
      { name: "ბჟენი მასალა (A2)", quantity: 1, unit: "ცალი", minThreshold: 3, pricePerUnit: 45, category: "consumable", clinicId, createdAt: now },
      { name: "ხელთათმანი (M)", quantity: 10, unit: "კოლოფი", minThreshold: 5, pricePerUnit: 12, category: "consumable", clinicId, createdAt: now },
      { name: "პირბადე", quantity: 2, unit: "კოლოფი", minThreshold: 4, pricePerUnit: 8, category: "consumable", clinicId, createdAt: now },
      { name: "ანესთეზია", quantity: 50, unit: "ამპულა", minThreshold: 10, pricePerUnit: 2.5, category: "medicine", clinicId, createdAt: now },
    ];

    for (const item of inventory) {
      await addDoc(collection(db, "inventory"), item);
    }

    // 5. დავამატოთ ვიზიტები დღეისთვის
    const appointments = [
      { 
        patientName: patientIds[0].name, 
        patientId: patientIds[0].id, 
        service: "კონსულტაცია", 
        doctorId: staffIds[0].id,
        doctorName: staffIds[0].name,
        start: new Date(new Date().setHours(10, 0, 0)).toISOString(), 
        end: new Date(new Date().setHours(10, 30, 0)).toISOString(), 
        clinicId, 
        status: "confirmed",
        createdAt: now 
      },
      { 
        patientName: patientIds[1].name, 
        patientId: patientIds[1].id, 
        service: "ჰიგიენური წმენდა", 
        doctorId: staffIds[1].id,
        doctorName: staffIds[1].name,
        start: new Date(new Date().setHours(11, 0, 0)).toISOString(), 
        end: new Date(new Date().setHours(11, 45, 0)).toISOString(), 
        clinicId, 
        status: "confirmed",
        createdAt: now 
      },
      { 
        patientName: patientIds[2].name, 
        patientId: patientIds[2].id, 
        service: "თერაპია - ბჟენი", 
        doctorId: staffIds[2].id,
        doctorName: staffIds[2].name,
        start: new Date(new Date().setHours(13, 0, 0)).toISOString(), 
        end: new Date(new Date().setHours(14, 0, 0)).toISOString(), 
        clinicId, 
        status: "confirmed",
        createdAt: now 
      },
      { 
        patientName: patientIds[4].name, 
        patientId: patientIds[4].id, 
        service: "იმპლანტაცია", 
        doctorId: staffIds[0].id,
        doctorName: staffIds[0].name,
        start: new Date(new Date().setHours(15, 30, 0)).toISOString(), 
        end: new Date(new Date().setHours(17, 0, 0)).toISOString(), 
        clinicId, 
        status: "confirmed",
        createdAt: now 
      }
    ];

    for (const app of appointments) {
      await addDoc(collection(db, "appointments"), app);
    }

    return { success: true };
  } catch (error) {
    console.error("Error seeding data:", error);
    return { success: false, error: error.message };
  }
};
