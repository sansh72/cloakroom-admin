import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Owner — always has access even if the collection is deleted
const OWNER_EMAIL = 'sanshraysinghlangeh@gmail.com';

let cachedEmails = null;

// Fetch allowed admin emails from Firestore 'allowedUsers' collection
export const getAdminEmails = async () => {
  if (cachedEmails) return cachedEmails;

  try {
    const snapshot = await getDocs(collection(db, 'allowedUsers'));
    const firestoreEmails = snapshot.docs.map((doc) => {
      const data = doc.data();
      return (data.email || '').toLowerCase();
    }).filter(Boolean);

    // Merge owner + Firestore emails (deduplicated)
    cachedEmails = [...new Set([OWNER_EMAIL, ...firestoreEmails])];
  } catch {
    // If Firestore fails, owner still gets in
    cachedEmails = [OWNER_EMAIL];
  }

  return cachedEmails;
};

// Clear cache (useful if you want to force re-fetch)
export const clearAdminCache = () => {
  cachedEmails = null;
};

export const isAdminEmail = async (email) => {
  if (!email) return false;
  // Fast path — skip Firestore call for owner
  if (email.toLowerCase() === OWNER_EMAIL) return true;
  const emails = await getAdminEmails();
  return emails.includes(email.toLowerCase());
};
