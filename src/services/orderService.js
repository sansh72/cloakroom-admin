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
const USERS_COLLECTION = 'users';

// Human-readable identity for an order. Older orders placed by phone-auth
// users carry an empty userEmail, so fall back to phone → name → address name.
export const getOrderCustomerLabel = (order) =>
  order.userEmail ||
  order.userPhone ||
  order.userName ||
  order.shippingAddress?.fullName ||
  'Unknown';

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

// ─── Fetch all users, keyed by uid (for order identity fallback) ───
const getUsersByUid = async () => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  const map = {};
  snapshot.docs.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
};

// ─── Merge orders + tracking into a single list ───
export const getMergedOrders = async () => {
  const [orders, tracking, customOrders, usersByUid] = await Promise.all([
    getAllOrders(),
    getAllOrderTracking(),
    getAllCustomOrders(),
    getUsersByUid().catch(() => ({})),
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

  // Merge: each order gets its tracking + custom data attached.
  // Orders placed by phone-auth users have an empty userEmail — recover
  // identity (phone/name) from the users collection via userId.
  const merged = orders.map((order) => {
    const user = usersByUid[order.userId] || {};
    return {
      ...order,
      userEmail: order.userEmail || user.email || '',
      userPhone: order.userPhone || user.phoneNumber || '',
      userName: order.userName || user.displayName || '',
      tracking: trackingMap[order.id] || null,
      customOrder: customMap[order.id] || null,
    };
  });

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

// ─── Upload/replace a per-product invoice on an order ───
// itemKey is the product id (or `item_<index>` fallback) so each line item
// can carry its own invoice. Stored on the order doc under `invoices.<itemKey>`.
export const setOrderInvoice = async (orderId, itemKey, invoice) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    [`invoices.${itemKey}`]: {
      url: invoice.url,
      fileName: invoice.fileName || '',
      uploadedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
};

// ─── Update order price (for custom orders) ───
export const updateOrderPrice = async (orderId, newPrice) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    total: newPrice,
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
