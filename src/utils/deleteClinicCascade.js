import { db } from "../firebase";
import { 
  collection, query, where, getDocs, doc, 
  deleteDoc, writeBatch 
} from "firebase/firestore";
import { logAdminAudit } from "./superAdmin";

/**
 * დამხმარე ფუნქცია: დოკუმენტების წაშლა batch-ებით (მაქსიმუმ 450 თითოეულში)
 */
const deleteQueryInBatches = async (q) => {
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  if (docs.length === 0) return 0;

  const BATCH_SIZE = 450;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
};

/**
 * კლინიკის სრული და შეუქცევადი წაშლა Firestore-დან და Firebase Auth-იდან
 * 
 * წაშლის:
 * 1. კლინიკის მთავარ დოკუმენტს (clinics)
 * 2. ყველა პერსონალს და ექიმს (users)
 * 3. მფლობელის პირად დოკუმენტს (users/{ownerId})
 * 4. ყველა პაციენტს (patients)
 * 5. პაციენტების ყველა რენტგენს (patient_xrays)
 * 6. ყველა ჯავშანს, ისტორიას და ვიზიტს (appointments)
 * 7. საწყობს და მარაგებს (inventory)
 * 8. მომსახურებებს და ფასებს (services)
 * 9. ფინანსურ ტრანზაქციებს და ხელფასებს (finance)
 * 10. აქტივობის ლოგებს (activity)
 * 11. Firebase Authentication ანგარიშს (/api/delete-clinic-auth)
 * 
 * @param {object} clinic - კლინიკის ობიექტი
 * @param {string} superAdminEmail - სუპერ ადმინის მეილი
 * @param {function} onProgress - პროგრესის ქოლბექი (სტატუსის ჩვენებისთვის)
 * @returns {Promise<{success: boolean, stats: object, authDeleted: boolean, authMessage: string}>}
 */
export const deleteClinicPermanently = async (clinic, superAdminEmail, onProgress = () => {}) => {
  if (!clinic || !clinic.id) {
    throw new Error("კლინიკის მონაცემები არასწორია");
  }

  const clinicId = clinic.id;
  const ownerId = clinic.ownerId;
  const ownerEmail = clinic.ownerEmail;
  const clinicName = clinic.clinicName || clinic.loginName || clinicId;

  const stats = {
    patients: 0,
    xrays: 0,
    appointments: 0,
    inventory: 0,
    services: 0,
    finance: 0,
    activity: 0,
    staff: 0,
  };

  try {
    // 1. პაციენტები და მათი რენტგენები
    onProgress("პაციენტებისა და რენტგენების წაშლა...");
    const patientsQ = query(collection(db, "patients"), where("clinicId", "==", clinicId));
    const patientsSnap = await getDocs(patientsQ);
    const patientIds = patientsSnap.docs.map(d => d.id);
    
    // რენტგენების წაშლა პაციენტების მიხედვით
    for (const pId of patientIds) {
      const xraysQ = query(collection(db, "patient_xrays"), where("patientId", "==", pId));
      const deletedXrays = await deleteQueryInBatches(xraysQ);
      stats.xrays += deletedXrays;
    }

    // თავად პაციენტების წაშლა
    stats.patients = await deleteQueryInBatches(patientsQ);

    // 2. ვიზიტები და ჯავშნები (appointments)
    onProgress("კალენდრისა და ვიზიტების წაშლა...");
    const appQ = query(collection(db, "appointments"), where("clinicId", "==", clinicId));
    stats.appointments = await deleteQueryInBatches(appQ);

    // 3. საწყობი და მარაგი (inventory)
    onProgress("საწყობისა და მარაგების წაშლა...");
    const invQ = query(collection(db, "inventory"), where("clinicId", "==", clinicId));
    stats.inventory = await deleteQueryInBatches(invQ);

    // 4. მომსახურებები და ტარიფები (services)
    onProgress("მომსახურებებისა და ფასების წაშლა...");
    const srvQ = query(collection(db, "services"), where("clinicId", "==", clinicId));
    stats.services = await deleteQueryInBatches(srvQ);

    // 5. ფინანსები და ხელფასები (finance)
    onProgress("ფინანსური ჩანაწერების წაშლა...");
    const finQ = query(collection(db, "finance"), where("clinicId", "==", clinicId));
    stats.finance = await deleteQueryInBatches(finQ);

    // 6. აქტივობის ლოგი (activity)
    onProgress("აქტივობის ლოგების გასუფთავება...");
    const actQ = query(collection(db, "activity"), where("clinicId", "==", clinicId));
    stats.activity = await deleteQueryInBatches(actQ);

    // 7. მომხმარებლები და პერსონალი (users)
    onProgress("პერსონალისა და ექიმების პროფილების წაშლა...");
    const usersQ = query(collection(db, "users"), where("clinicId", "==", clinicId));
    stats.staff = await deleteQueryInBatches(usersQ);

    // მფლობელის ცალკე დოკუმენტი (თუ დარჩა)
    if (ownerId) {
      try {
        await deleteDoc(doc(db, "users", ownerId));
      } catch (e) {
        // უკვე წაიშალა usersQ-ში
      }
    }

    // 8. კლინიკის მთავარი დოკუმენტის წაშლა (clinics)
    onProgress("კლინიკის ძირითადი პროფილის წაშლა...");
    await deleteDoc(doc(db, "clinics", clinicId));

    // 9. Firebase Authentication მომხმარებლის წაშლა
    onProgress("Firebase Authentication ანგარიშის წაშლა...");
    let authDeleted = false;
    let authMessage = "";

    try {
      const response = await fetch("/api/delete-clinic-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          ownerEmail,
          superAdminEmail,
        }),
      });

      if (response.ok) {
        const authData = await response.json();
        authDeleted = Boolean(authData.authDeleted);
        authMessage = authData.message || (authDeleted ? "წარმატებით წაიშალა Auth-იდან" : "");
      } else {
        const errData = await response.json().catch(() => ({}));
        authMessage = errData.message || errData.error || "Auth API-ს შეცდომა";
      }
    } catch (authErr) {
      console.warn("Auth deletion API call error:", authErr);
      authMessage = "Auth API ხელმიუწვდომელია";
    }

    // 10. სუპერ ადმინის აუდიტის ლოგირება
    await logAdminAudit({
      adminEmail: superAdminEmail,
      action: "CLINIC_PERMANENTLY_DELETED",
      targetType: "clinic",
      targetId: clinicId,
      targetName: clinicName,
      clinicId,
      clinicName,
      details: `კლინიკა "${clinicName}" (@${clinic.loginName || clinicId}) სრულად და სამუდამოდ წაიშალა სისტემიდან. წაშლილია: ${stats.patients} პაციენტი, ${stats.appointments} ვიზიტი, ${stats.inventory} მარაგი, ${stats.staff} თანამშრომელი, ${stats.finance} ფინანსური ჩანაწერი. Auth წაშლა: ${authDeleted ? 'წარმატებული' : 'ხელით დასასრულებელი'}.`,
      metadata: { stats, ownerEmail, authDeleted },
    });

    onProgress("დასრულებულია!");
    return {
      success: true,
      stats,
      authDeleted,
      authMessage,
    };
  } catch (error) {
    console.error("Cascade clinic deletion failed:", error);
    throw error;
  }
};
