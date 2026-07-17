import { ref, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';

export const logActivity = async (action, userId, details, ip = 'N/A') => {
  try {
    const logsRef = ref(db, 'FuelGuardAI/Logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      action,
      userId,
      details,
      timestamp: serverTimestamp(),
      ip
    });
  } catch (error) {
    console.error("Failed to write activity logs:", error);
  }
};
