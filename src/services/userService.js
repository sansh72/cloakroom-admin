import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COLLECTION = 'users';

// Fetch all registered users
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Delete a user's Firestore document
// Note: This removes their data from Firestore. Removing them from Firebase Auth
// requires the Firebase Admin SDK (a Cloud Function). The user won't be able to
// use the app anymore since their profile data is gone, but their Auth account
// will still exist until cleaned up server-side.
export const deleteUser = async (userId) => {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
};

// Update user fields (e.g. displayName)
export const updateUser = async (userId, data) => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), data);
};
