import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { Search, Plus, Trash2, X, MapPin } from 'lucide-react';

const settingsRef = doc(db, 'settings', 'deliverySettings');

// Verbose logger that surfaces auth state + Firebase error details so we can
// diagnose rules / permission failures from the browser console.
function logFirebaseError(label, err) {
  const auth = getAuth();
  const user = auth.currentUser;
  console.group(`[PincodesPage] ${label}`);
  console.log('Auth user:', user ? { email: user.email, uid: user.uid, emailVerified: user.emailVerified } : 'NO USER');
  console.log('Error code:', err?.code);
  console.log('Error message:', err?.message);
  console.log('Error name:', err?.name);
  console.log('Full error:', err);
  console.groupEnd();
}

export default function PincodesPage() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newPincode, setNewPincode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPincodes = async () => {
    try {
      setLoading(true);
      const snap = await getDoc(settingsRef);
      console.log('[PincodesPage] fetched settings/deliverySettings, exists:', snap.exists(), 'data:', snap.data());
      const list = snap.exists() ? snap.data().blockedPincodes || [] : [];
      list.sort();
      setPincodes(list);
    } catch (err) {
      logFirebaseError('fetchPincodes failed', err);
      showToast(`Fetch failed: ${err?.code || err?.message || 'unknown'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPincodes(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const pincode = newPincode.trim();

    if (!pincode) return;
    if (!/^\d{6}$/.test(pincode)) {
      showToast('Enter a valid 6-digit pincode', 'error');
      return;
    }
    if (pincodes.includes(pincode)) {
      showToast('Pincode is already blocked', 'error');
      return;
    }

    try {
      setSaving(true);
      const snap = await getDoc(settingsRef);
      console.log('[PincodesPage] handleAdd — exists:', snap.exists(), 'data:', snap.data());

      if (!snap.exists()) {
        console.log('[PincodesPage] handleAdd — creating settings/deliverySettings via setDoc');
        await setDoc(settingsRef, { blockedPincodes: [pincode] });
      } else {
        console.log('[PincodesPage] handleAdd — updating settings/deliverySettings via updateDoc arrayUnion', pincode);
        await updateDoc(settingsRef, { blockedPincodes: arrayUnion(pincode) });
      }
      console.log('[PincodesPage] handleAdd — write succeeded for', pincode);
      setPincodes((prev) => [...prev, pincode].sort());
      setNewPincode('');
      setShowAdd(false);
      showToast(`${pincode} added to blocked list`);
    } catch (err) {
      logFirebaseError('handleAdd failed', err);
      showToast(`Add failed: ${err?.code || err?.message || 'unknown'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pincode) => {
    try {
      console.log('[PincodesPage] handleDelete — removing', pincode);
      await updateDoc(settingsRef, { blockedPincodes: arrayRemove(pincode) });
      console.log('[PincodesPage] handleDelete — write succeeded for', pincode);
      setPincodes((prev) => prev.filter((p) => p !== pincode));
      setDeleteConfirm(null);
      showToast(`${pincode} unblocked`);
    } catch (err) {
      logFirebaseError('handleDelete failed', err);
      showToast(`Remove failed: ${err?.code || err?.message || 'unknown'}`, 'error');
    }
  };

  const filtered = pincodes.filter((p) => p.includes(search.trim()));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Undeliverable Pincodes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pincodes.length} {pincodes.length === 1 ? 'pincode' : 'pincodes'} blocked at checkout
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Pincode
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search pincodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Pincode List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? 'No pincodes match your search' : 'No pincodes blocked yet. Add the first one!'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((pincode) => (
            <div
              key={pincode}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-gray-500" />
                </div>
                <span className="font-mono text-sm font-medium text-gray-900">{pincode}</span>
              </div>
              <button
                onClick={() => setDeleteConfirm(pincode)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Pincode Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Block a Pincode</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-digit Pincode
              </label>
              <input
                type="text"
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 400001"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
              />
              <p className="text-xs text-gray-400 mb-4">
                Customers entering this pincode at checkout will see a "we don't deliver here" message and won't be able to place the order.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newPincode.trim()}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Adding...' : 'Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unblock {deleteConfirm}?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Customers in this pincode will be able to order again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer"
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
