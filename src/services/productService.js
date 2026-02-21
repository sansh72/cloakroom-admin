import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PRODUCTS_COLLECTION = 'products';

export const getAllProducts = async () => {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Real-time listener for products - returns an unsubscribe function
export const subscribeToProducts = (onUpdate, onError) => {
  return onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(products);
    },
    (error) => {
      console.error('Products listener error:', error);
      if (onError) onError(error);
    }
  );
};

export const addProduct = async (product) => {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateProduct = async (productId, data) => {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
};
