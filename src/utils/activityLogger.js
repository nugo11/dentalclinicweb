import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * logs an activity to the clinic's activity collection
 */
export const logActivity = async (clinicId, userObject, action, details, metadata = {}) => {
  const effectiveClinicId = clinicId || userObject?.clinicId;
  const effectiveUserId = userObject?.uid || userObject?.id || auth.currentUser?.uid;
  
  if (!effectiveClinicId || !effectiveUserId) {
    console.warn("Activity logger skipped: Missing clinicId or userId", { effectiveClinicId, effectiveUserId });
    return;
  }

  try {
    await addDoc(collection(db, "activity"), {
      clinicId: effectiveClinicId,
      userId: effectiveUserId,
      userName: userObject?.fullName || 'Unknown User',
      userRole: userObject?.role || 'unknown',
      action,
      details,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
