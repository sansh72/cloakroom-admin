import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from '../services/cloudinaryService';
import {
  Plus, Trash2, Pencil, X, ArrowUp, ArrowDown, Database, GraduationCap, ImagePlus, Loader2,
} from 'lucide-react';

const COLLECTION = 'institutions';

// Seed data — logos hosted on Cloudinary (uploaded via upload-institutions.mjs).
// Absolute URLs so they render in both the admin app and the storefront;
// local /Carousel/* paths only exist in the storefront's public folder.
const SEED = [
  { name: 'AIIMS Raipur',      image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056591/institutions/aiims-raipur.jpg',    order: 1 },
  { name: 'IIM Udaipur',       image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056593/institutions/iim-udaipur.jpg',     order: 2 },
  { name: 'IIT Gandhinagar',   image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056595/institutions/iit-gandhinagar.png', order: 3 },
  { name: 'IIT Mandi',         image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056599/institutions/iit-mandi.jpg',       order: 4 },
  { name: 'IIT Roorkee',       image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056603/institutions/iit-roorkee.jpg',     order: 5 },
  { name: 'IIT Ropar',         image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056605/institutions/iit-ropar.jpg',       order: 6 },
  { name: 'NIT Raipur',        image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056607/institutions/nit-raipur.png',      order: 7 },
  { name: 'IIT Bhilai',        image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056609/institutions/iit-bhilai.png',      order: 8 },
  { name: 'IIT Madras',        image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056612/institutions/iit-madras.png',      order: 9 },
  { name: 'NIT Jalandhar',     image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782056614/institutions/nit-jalandhar.png',   order: 10 },
];

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setInstitutions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
    setInstitutions((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    showToast('Institution deleted');
  };

  const move = async (id, dir) => {
    const sorted = [...institutions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTION, sorted[idx].id), { order: sorted[swapIdx].order });
    batch.update(doc(db, COLLECTION, sorted[swapIdx].id), { order: sorted[idx].order });
    await batch.commit();
    await load();
  };

  const seedDefaults = async () => {
    if (!window.confirm('Seed / refresh default institutions?\n\nExisting ones (matched by name) get their logo updated to the Cloudinary URL; any missing ones are added. No duplicates.')) return;
    setSeeding(true);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const byName = new Map(
        snap.docs.map((d) => [(d.data().name || '').trim().toLowerCase(), { id: d.id, ...d.data() }])
      );
      let added = 0, updated = 0;
      for (const inst of SEED) {
        const match = byName.get(inst.name.trim().toLowerCase());
        if (match) {
          await updateDoc(doc(db, COLLECTION, match.id), {
            image: inst.image,
            order: inst.order,
            updatedAt: serverTimestamp(),
          });
          updated++;
        } else {
          await addDoc(collection(db, COLLECTION), { ...inst, createdAt: serverTimestamp() });
          added++;
        }
      }
      await load();
      showToast(`Seed done — ${updated} updated, ${added} added`);
    } catch (err) {
      console.error(err);
      showToast('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
          <p className="text-sm text-gray-500 mt-1">Logos in the "Institutions We Served So Far!" carousel on the home page.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
          >
            <Database size={16} />
            {seeding ? 'Seeding…' : 'Seed Defaults'}
          </button>
          <button
            onClick={() => { setEditing({ name: '', image: '', order: (institutions.at(-1)?.order || 0) + 1 }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 cursor-pointer"
          >
            <Plus size={16} />
            Add Institution
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12 text-sm">Loading…</div>
      ) : institutions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <GraduationCap className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-500 text-sm">No institutions yet.</p>
          <p className="text-gray-400 text-xs mt-1">Click "Seed Defaults" to load the starter set, or "Add Institution" to start fresh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst, idx) => (
            <div key={inst.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="aspect-[7/5] rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                {inst.image ? (
                  <img src={inst.image} alt={inst.name} className="max-h-full max-w-full object-contain p-3" />
                ) : (
                  <GraduationCap className="text-gray-300" size={32} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 leading-tight">{inst.name || '(no name)'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Order: {inst.order}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => move(inst.id, 'up')}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(inst.id, 'down')}
                  disabled={idx === institutions.length - 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => { setEditing(inst); setShowForm(true); }}
                  className="ml-auto p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ id: inst.id, name: inst.name })}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && editing && (
        <InstitutionForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await load();
            showToast(editing.id ? 'Updated' : 'Added');
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Delete "{deleteConfirm.name}"?</h3>
            <p className="text-sm text-gray-600 mb-4">This institution will be removed from the home page carousel.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstitutionForm({ initial, onClose, onSaved }) {
  const [data, setData] = useState({
    name: initial.name || '',
    image: initial.image || '',
    order: initial.order ?? 0,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Pick an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB'); return; }
    setUploading(true);
    try {
      const url = await uploadImage(file, 'institutions');
      setData((d) => ({ ...d, image: url }));
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!data.name.trim()) { alert('Name is required'); return; }
    setSaving(true);
    try {
      if (initial.id) {
        await updateDoc(doc(db, COLLECTION, initial.id), { ...data, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{initial.id ? 'Edit Institution' : 'New Institution'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">Name *</label>
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g. IIT Roorkee"
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">Display order</label>
            <input
              type="number"
              value={data.order}
              onChange={(e) => setData({ ...data, order: parseInt(e.target.value) || 0 })}
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">Logo *</label>
            {data.image ? (
              <div className="relative inline-block">
                <div className="w-48 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-3">
                  <img src={data.image} alt="logo" className="max-h-full max-w-full object-contain" />
                </div>
                <button
                  onClick={() => setData({ ...data, image: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-600 cursor-pointer"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="w-48 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 transition-colors">
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                ) : (
                  <>
                    <ImagePlus size={20} className="text-gray-400" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Upload logo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
            )}
            <p className="text-xs text-gray-400 mt-1.5">PNG with transparent background recommended. Max 5 MB.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
