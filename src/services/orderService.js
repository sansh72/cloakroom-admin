import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ORDERS_COLLECTION = 'orders';
const TRACKING_COLLECTION = 'orderTracking';
const CUSTOM_ORDERS_COLLECTION = 'customOrders';

// ─── Fetch all orders ───
export const getAllOrders = async () => {
  const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    };
  });
};

// ─── Fetch all order tracking docs ───
export const getAllOrderTracking = async () => {
  const snapshot = await getDocs(collection(db, TRACKING_COLLECTION));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    };
  });
};

// ─── Fetch all custom orders ───
export const getAllCustomOrders = async () => {
  const snapshot = await getDocs(collection(db, CUSTOM_ORDERS_COLLECTION));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

// ─── Merge orders + tracking into a single list ───
export const getMergedOrders = async () => {
  const [orders, tracking, customOrders] = await Promise.all([
    getAllOrders(),
    getAllOrderTracking(),
    getAllCustomOrders(),
  ]);

  // Build a map of tracking by orderId
  const trackingMap = {};
  tracking.forEach((t) => {
    trackingMap[t.orderId || t.id] = t;
  });

  // Build a map of custom orders by orderId
  const customMap = {};
  customOrders.forEach((c) => {
    customMap[c.orderId || c.id] = c;
  });

  // Merge: each order gets its tracking + custom data attached
  const merged = orders.map((order) => ({
    ...order,
    tracking: trackingMap[order.id] || null,
    customOrder: customMap[order.id] || null,
  }));

  // Sort newest first
  merged.sort((a, b) => b.createdAt - a.createdAt);

  return merged;
};

// ─── Update order tracking status ───
export const updateOrderTrackingStatus = async (orderId, newStatus, notes, additionalData = {}) => {
  const trackingRef = doc(db, TRACKING_COLLECTION, orderId);

  const historyEntry = {
    status: newStatus,
    timestamp: new Date(),
    notes: notes || undefined,
  };

  const updateData = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion(historyEntry),
    ...additionalData,
  };

  await updateDoc(trackingRef, updateData);

  // Also update the legacy status field in the orders collection
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    status: newStatus.toLowerCase(),
    updatedAt: serverTimestamp(),
  });
};

// ─── Get single order tracking ───
export const getOrderTracking = async (orderId) => {
  const trackingRef = doc(db, TRACKING_COLLECTION, orderId);
  const snap = await getDoc(trackingRef);
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};
