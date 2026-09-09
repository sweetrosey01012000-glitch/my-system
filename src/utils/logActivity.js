import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const logActivity = async ({ action, performedBy, performedById, details }) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      performedBy,
      performedById,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};