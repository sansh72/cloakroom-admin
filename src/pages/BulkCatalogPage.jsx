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
import { Plus, Trash2, Pencil, X, ArrowUp, ArrowDown, Database, Layers, ImagePlus, Loader2 } from 'lucide-react';

const COLLECTION = 'bulkCatalog';
const OPTIONS_COLLECTION = 'bulkCategoryOptions';

// Default category names per audience — always shown in the dropdown.
// Admin can add more via the "Manage Categories" dialog (stored in bulkCategoryOptions).
const DEFAULT_CATEGORIES = {
  'men-women': ['T-Shirts (Round Neck)', 'Polo T-Shirts', 'Jackets & Hoodies'],
  'kids': ['T-Shirts (Round Neck)', 'Sweatshirts', 'Hoodies & Track Suits', 'Polo T-Shirts (Schools & NGOs)'],
};

// ─── Fabric assets (Cloudinary) ──────────────────────────────────────────────
// Static fabric images/descriptions uploaded via upload-fabrics.mjs. Merged onto
// each seed fabric by name so "Seed Defaults" lands real images + copy, not just
// names. Absolute URLs so they render in both the admin app and the storefront.
const FABRIC_ASSETS = {
  'Cotton 100%':               { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057321/bulk-catalog/fabrics/cotton-100.jpg',          wikiLink: 'https://en.wikipedia.org/wiki/Cotton',     description: "Pure cotton fabric is made from natural cotton fibers, offering exceptional breathability and comfort. It's hypoallergenic, soft against the skin, and perfect for everyday wear. Cotton absorbs moisture well, making it ideal for warm weather and active lifestyles." },
  'Cotton Lycra':              { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057324/bulk-catalog/fabrics/cotton-lycra-fabric.jpg', wikiLink: 'https://en.wikipedia.org/wiki/Spandex',    description: 'A blend of cotton with 5% Lycra (spandex) creates a fabric that combines the natural comfort of cotton with added stretch and flexibility. This material maintains its shape even after repeated wear and washing, making it perfect for activewear and fitted garments.' },
  'Oversized / Down Shoulder': { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057327/bulk-catalog/fabrics/oversized.jpg',          wikiLink: 'https://knitfabric.com/cotton-lycra-fabric-101', description: 'Experience unmatched comfort and durability with our premium heavy-GSM fabric, crafted specially for oversized tees. Made from high-quality cotton with a touch of Lycra, this fabric offers a perfect balance of structure, breathability, and stretch.' },
  'Oversized':                 { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057327/bulk-catalog/fabrics/oversized.jpg',          wikiLink: 'https://knitfabric.com/cotton-lycra-fabric-101', description: 'Experience unmatched comfort and durability with our premium heavy-GSM fabric, crafted specially for oversized tees. Made from high-quality cotton with a touch of Lycra, this fabric offers a perfect balance of structure, breathability, and stretch.' },
  'PC Matte':                  { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057328/bulk-catalog/fabrics/pc.jpg',                 wikiLink: 'https://en.wikipedia.org/wiki/Polyester',  description: 'Poly-Cotton Matte is a premium blend of 60% cotton and 40% polyester, offering the best of both worlds. It provides the softness and breathability of cotton with the durability and wrinkle-resistance of polyester. Perfect for professional wear and uniforms.' },
  'Cotton Matte Lycra':        { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057330/bulk-catalog/fabrics/matte.jpg',              wikiLink: 'https://en.wikipedia.org/wiki/Lycra',      description: 'This premium fabric combines cotton matte with 5% Lycra for a luxurious feel with added stretch. It offers a refined matte finish while maintaining flexibility and comfort, ideal for high-quality polo shirts and professional apparel.' },
  'Spun Matty':                { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057331/bulk-catalog/fabrics/spun-matte.jpg',         wikiLink: 'https://en.wikipedia.org/wiki/Textile',    description: "Spun Matty is a high-quality polyester-cotton blend fabric with a distinctive texture. It's durable, affordable, and perfect for bulk orders like school uniforms and corporate wear. The fabric resists pilling and maintains its appearance over time." },
  'Sap Matty':                 { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057334/bulk-catalog/fabrics/sap.jpg',                wikiLink: 'https://en.wikipedia.org/wiki/Textile',    description: "Sap Matty is a poly-blend cotton fabric known for its smooth texture and excellent color fastness. It's highly durable and long-lasting, making it ideal for professional uniforms and corporate wear. The fabric maintains its appearance even after repeated washing." },
  'Cotton Fleece':             { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057338/bulk-catalog/fabrics/cotton.jpg',             wikiLink: 'https://en.wikipedia.org/wiki/Flannel',    description: 'Flannel is a soft woven fabric, of varying fineness. Flannel was originally made from carded wool or worsted yarn, but is now often made from either wool, cotton, or synthetic fiber.' },
  'PC Fleece':                 { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057339/bulk-catalog/fabrics/polyfleece.webp',        wikiLink: 'https://en.wikipedia.org/wiki/Polar_fleece', description: 'Polyester-Cotton Fleece is a warm, lightweight fabric perfect for hoodies and sweatshirts. It provides excellent insulation while remaining breathable. The blend makes it durable, easy to care for, and resistant to shrinking.' },
  'Cotton Terry':              { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057340/bulk-catalog/fabrics/terry.jpg',              wikiLink: 'https://en.wikipedia.org/wiki/Terrycloth', description: "Terry cotton features loops of thread that create a highly absorbent, ultra-soft fabric. Originally used for towels, it's now popular for comfortable hoodies and loungewear. The loops trap air, providing warmth and a plush feel." },
  'N/S':                       { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057342/bulk-catalog/fabrics/ns.jpg',                 wikiLink: 'https://en.wikipedia.org/wiki/Textile',    description: 'Non-Shrink (N/S) fabric is specially treated to maintain its original size and shape even after multiple washes. This premium fabric is ideal for professional uniforms and garments that require consistent fit. The advanced manufacturing process ensures dimensional stability while maintaining softness and breathability.' },
  'Spun Fleece':               { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057344/bulk-catalog/fabrics/spun-fleece.jpg',        wikiLink: 'https://madhusudanfabrics.com/product/spun-fleece-fabric/', description: 'Spun Fleece Fabric is a type of polyester fleece fabric that is made using a combination of polyester yarns and a special processing technique. This gives the fabric its soft, warm, and comfortable feel.' },
  'Terry Cotton':              { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057346/bulk-catalog/fabrics/terrycot.jpg',           wikiLink: 'https://en.wikipedia.org/wiki/Terrycloth', description: "Terry Cotton is ultra-soft and warm, making it perfect for kids' hoodies and loungewear. The looped texture provides excellent warmth and comfort. Highly absorbent and gentle on children's delicate skin." },
  'Spun Matte':                { image: 'https://res.cloudinary.com/dlxv7oikk/image/upload/v1782057347/bulk-catalog/fabrics/spunm.jpg',              wikiLink: 'https://en.wikipedia.org/wiki/Textile',    description: 'Spun Matte is an affordable, durable fabric perfect for school uniforms. It maintains its appearance through repeated washing and daily wear. The matte finish gives a professional look suitable for educational institutions and NGOs.' },
};

// Merge Cloudinary image/description/wikiLink onto a seed category's fabrics by name.
const withFabricAssets = (cat) => ({
  ...cat,
  items: (cat.items || []).map((it) => ({
    ...it,
    fabrics: (it.fabrics || []).map((f) => ({ ...f, ...(FABRIC_ASSETS[f.name] || {}) })),
  })),
});

// ─── Seed data (matches the original hardcoded BulkOrders.tsx) ────────────────
const SEED_CATEGORIES = [
  {
    audience: 'men-women',
    category: 'T-Shirts (Round Neck)',
    subCategory: 'Full/ Half Sleeves',
    price: '₹250 onwards',
    order: 1,
    items: [{
      name: 'Round Neck T-Shirts',
      fabrics: [
        { name: 'Cotton 100%', composition: 'Pure Cotton', features: ['Breathable', 'Soft', 'Durable'] },
        { name: 'Cotton Lycra', composition: 'Cotton + 5% Lycra', features: ['Stretchable', 'Comfortable', 'Shape Retention'] },
        { name: 'Oversized / Down Shoulder', composition: 'Cotton/ Cotton Lycra', features: ['Trendy Fit', 'Relaxed Style', 'Modern Look', '(210-280) GSM'] },
      ],
    }],
  },
  {
    audience: 'men-women',
    category: 'Polo T-Shirts',
    price: '₹350 onwards',
    order: 2,
    items: [{
      name: 'Polo T-Shirts',
      fabrics: [
        { name: 'PC Matte', composition: '60% Cotton / 40% Polyester', features: ['Professional Look', 'Easy Care', 'Wrinkle Resistant'] },
        { name: 'Cotton Matte Lycra', composition: 'Cotton Matte + 5% Lycra', features: ['Premium Quality', 'Soft Finish', 'Stretchable'] },
        { name: 'Spun Matty', composition: 'High Polyester + Cotton blend', features: ['Durable', 'Quick Dry', 'Affordable'] },
        { name: 'Sap Matty', composition: 'Poly blend Cotton', features: ['Smooth Texture', 'Color Fast', 'Long Lasting'] },
      ],
      customization: ['Different collar colors', 'Different sleeve colors', 'Custom pocket designs'],
    }],
  },
  {
    audience: 'men-women',
    category: 'Jackets & Hoodies',
    price: '₹650 onwards',
    order: 3,
    items: [{
      name: 'Hoodies & Jackets',
      fabrics: [
        { name: 'Cotton Fleece', composition: 'Fleece Cotton', features: ['Soft', 'Warm', 'Natural'] },
        { name: 'PC Fleece', composition: 'Polyester Cotton Fleece', features: ['Warm', 'Lightweight', 'Durable'] },
        { name: 'Cotton Terry', composition: 'Terry Cotton', features: ['Ultra Soft', 'Absorbent', 'Cozy'] },
        { name: 'N/S', composition: 'Non-Shrink Fabric', features: ['Shape Retention', 'Wash Stable', 'Professional'] },
      ],
    }],
  },
  {
    audience: 'kids',
    category: 'T-Shirts (Round Neck)',
    subCategory: 'Full/ Half Sleeves',
    price: '₹180 onwards',
    order: 1,
    items: [{
      name: 'Round Neck T-Shirts',
      fabrics: [
        { name: 'Cotton 100%', composition: 'Pure Cotton', features: ['Skin Friendly', 'Soft', 'Safe for Kids'] },
        { name: 'Cotton Lycra', composition: 'Cotton + 5% Lycra', features: ['Stretchable', 'Active Wear', 'Comfortable'] },
        { name: 'Oversized', composition: 'Cotton/ Cotton Lycra ', features: ['Trendy', 'Comfortable', 'Stylish', '(210-280) GSM'] },
      ],
    }],
  },
  {
    audience: 'kids',
    category: 'Sweatshirts',
    price: '₹450 onwards',
    order: 2,
    items: [{
      name: 'Sweatshirts',
      fabrics: [
        { name: 'Cotton Fleece', composition: 'Pure Cotton', features: ['Warm', 'Soft', 'Breathable'] },
        { name: 'PC Fleece', composition: 'Polyester Cotton Fleece', features: ['Cozy', 'Lightweight', 'Easy Care'] },
      ],
    }],
  },
  {
    audience: 'kids',
    category: 'Hoodies & Track Suits',
    price: '₹550 onwards',
    order: 3,
    items: [{
      name: 'Hoodies & Track Suits',
      fabrics: [
        { name: 'Spun Fleece', composition: 'Spun Fabric', features: ['Durable', 'Active Wear', 'Comfortable'] },
        { name: 'Cotton Fleece', composition: 'Pure Cotton', features: ['Natural', 'Soft', 'Breathable'] },
        { name: 'Terry Cotton', composition: 'Cotton Terry', features: ['Ultra Soft', 'Warm', 'Absorbent'] },
        { name: 'PC Fleece', composition: 'Polyester Cotton', features: ['Easy Care', 'Durable', 'Quick Dry'] },
      ],
    }],
  },
  {
    audience: 'kids',
    category: 'Polo T-Shirts (Schools & NGOs)',
    price: '₹220 onwards',
    order: 4,
    items: [{
      name: 'Polo T-Shirts',
      fabrics: [
        { name: 'Spun Matte', composition: 'Spun Fabric', features: ['Affordable', 'Durable', 'School Uniform'] },
        { name: 'PC Matte', composition: '60% Cotton / 40% Polyester', features: ['Easy Maintenance', 'Professional', 'Long Lasting'] },
      ],
      customization: ['Solid colors', 'Different collar colors', 'Different sleeve colors', 'School logos', 'Custom designs'],
    }],
  },
];

const emptyCategory = (audience = 'men-women') => ({
  audience,
  category: '',
  subCategory: '',
  price: '',
  order: 0,
  items: [{ name: '', fabrics: [{ name: '', composition: '', features: [] }], customization: [] }],
});

export default function BulkCatalogPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState('men-women');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);
  // Managed list of category names that populate the dropdown in the Add/Edit form
  const [categoryOptions, setCategoryOptions] = useState([]); // [{ id, name }]
  const [showOptionsManager, setShowOptionsManager] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadCategories = async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load bulk catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryOptions = async () => {
    try {
      const snap = await getDocs(collection(db, OPTIONS_COLLECTION));
      const list = snap.docs
        .map((d) => ({ id: d.id, name: d.data().name || '', audience: d.data().audience || 'men-women' }))
        .filter((o) => o.name.trim());
      setCategoryOptions(list);
    } catch (err) {
      console.error('Failed to load category options:', err);
    }
  };

  // Merge defaults + admin-added options for a given audience (dedupes by name)
  const optionsForAudience = (audience) => {
    const defaults = DEFAULT_CATEGORIES[audience] || [];
    const added = categoryOptions.filter((o) => o.audience === audience).map((o) => o.name);
    return Array.from(new Set([...defaults, ...added])).sort();
  };

  useEffect(() => {
    loadCategories();
    loadCategoryOptions();
  }, []);

  const filtered = categories.filter((c) => c.audience === audienceFilter);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    showToast('Category deleted');
  };

  const moveCategory = async (id, dir) => {
    const audienceList = categories
      .filter((c) => c.audience === audienceFilter)
      .sort((a, b) => a.order - b.order);
    const idx = audienceList.findIndex((c) => c.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= audienceList.length) return;
    const a = audienceList[idx];
    const b = audienceList[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTION, a.id), { order: b.order });
    batch.update(doc(db, COLLECTION, b.id), { order: a.order });
    await batch.commit();
    await loadCategories();
  };

  const seedDefaults = async () => {
    if (!window.confirm('Seed / refresh default categories?\n\nExisting ones (matched by audience + category) get refreshed with fabric images & details; missing ones are added. No duplicates.')) return;
    setSeeding(true);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const keyOf = (c) => `${(c.audience || '').trim()}|${(c.category || '').trim().toLowerCase()}`;
      const byKey = new Map(snap.docs.map((d) => [keyOf(d.data()), { id: d.id, ...d.data() }]));
      let added = 0, updated = 0;
      for (const raw of SEED_CATEGORIES) {
        const c = withFabricAssets(raw); // attach Cloudinary images + descriptions
        const match = byKey.get(keyOf(c));
        if (match) {
          await updateDoc(doc(db, COLLECTION, match.id), { ...c, updatedAt: serverTimestamp() });
          updated++;
        } else {
          await addDoc(collection(db, COLLECTION), { ...c, createdAt: serverTimestamp() });
          added++;
        }
      }
      await loadCategories();
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
          <h1 className="text-2xl font-bold text-gray-900">Bulk Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories, prices, and fabric types shown on the Bulk Orders page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowOptionsManager(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            title="Manage the list of category names shown in the dropdown"
          >
            <Layers size={16} />
            Manage Categories ({categoryOptions.length})
          </button>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Database size={16} />
            {seeding ? 'Seeding…' : 'Seed Defaults'}
          </button>
          <button
            onClick={() => { setEditing({ ...emptyCategory(audienceFilter), order: (filtered.at(-1)?.order || 0) + 1 }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* Audience tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'men-women', label: 'Men & Women' },
          { key: 'kids', label: 'Kids (Schools & NGOs)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAudienceFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              audienceFilter === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Layers className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-500 text-sm">No categories for {audienceFilter === 'men-women' ? 'Men & Women' : 'Kids'} yet.</p>
          <p className="text-gray-400 text-xs mt-1">Click "Seed Defaults" to load the starter set, or "Add Category" to start fresh.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cat, idx) => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{cat.category || '(untitled)'}</h3>
                  </div>
                  {cat.subCategory && <p className="text-xs text-gray-500 mb-2">{cat.subCategory}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(cat.items?.[0]?.fabrics || []).map((f, i) => (
                      <span key={i} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{f.name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => moveCategory(cat.id, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveCategory(cat.id, 'down')}
                    disabled={idx === filtered.length - 1}
                    title="Move down"
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => { setEditing(cat); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: cat.id, name: cat.category })}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add form modal */}
      {showForm && editing && (
        <CategoryForm
          initial={editing}
          optionsForAudience={optionsForAudience}
          onOpenManager={() => setShowOptionsManager(true)}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await loadCategories();
            showToast(editing.id ? 'Category updated' : 'Category added');
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">Delete "{deleteConfirm.name}"?</h3>
            <p className="text-sm text-gray-600 mb-4">This category will be permanently removed from the Bulk Orders page.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories dialog */}
      {showOptionsManager && (
        <CategoryOptionsManager
          options={categoryOptions}
          onClose={() => setShowOptionsManager(false)}
          onChanged={loadCategoryOptions}
          showToast={showToast}
        />
      )}

    </div>
  );
}

// ─── Edit/Add form ────────────────────────────────────────────────────────────
function CategoryForm({ initial, optionsForAudience, onOpenManager, onClose, onSaved }) {
  const isEditing = !!initial.id;
  const [data, setData] = useState(() => ({
    // For new categories, audience starts EMPTY so the user must explicitly pick (step 1).
    audience: isEditing ? (initial.audience || 'men-women') : '',
    category: initial.category || '',
    subCategory: initial.subCategory || '',
    price: initial.price || '',
    order: initial.order ?? 0,
    items: initial.items?.length
      ? initial.items
      : [{ name: '', fabrics: [{ name: '', composition: '', features: [] }], customization: [] }],
  }));
  const [saving, setSaving] = useState(false);

  // Progressive disclosure: step 1 = pick audience, step 2 = pick category, step 3 = the rest
  const audiencePicked = !!data.audience;
  const categoryPicked = audiencePicked && !!data.category;

  // Options for the currently-selected audience (defaults + admin-added)
  const audienceOptions = audiencePicked && optionsForAudience ? optionsForAudience(data.audience) : [];

  // When picking a category that matches a built-in default (and the form is otherwise blank),
  // pre-fill the rest of the form so admin can tweak instead of typing everything from scratch.
  const pickCategory = (cat) => {
    if (!cat) {
      setData((d) => ({ ...d, category: '' }));
      return;
    }
    const defaultMatch = SEED_CATEGORIES.find(
      (s) => s.audience === data.audience && s.category === cat
    );
    // Detect whether the user has typed anything in step 3 — if so, don't clobber it
    const hasUserContent =
      data.subCategory?.trim() ||
      data.price?.trim() ||
      item.name?.trim() ||
      (item.fabrics || []).some(
        (f) => f.name?.trim() || f.image || f.description?.trim() || f.composition?.trim()
      ) ||
      (item.customization || []).some((c) => c?.trim());

    if (defaultMatch && !hasUserContent && !isEditing) {
      // Deep-clone the default so future edits don't mutate the seed
      const cloned = JSON.parse(JSON.stringify(defaultMatch));
      setData((d) => ({
        ...d,
        category: cat,
        subCategory: cloned.subCategory || '',
        price: cloned.price || '',
        order: cloned.order ?? d.order,
        items: cloned.items?.length
          ? cloned.items
          : [{ name: '', fabrics: [{ name: '', composition: '', features: [] }], customization: [] }],
      }));
    } else {
      setData((d) => ({ ...d, category: cat }));
    }
  };

  const item = data.items[0] || { name: '', fabrics: [], customization: [] };

  const setItem = (patch) => {
    setData((d) => ({ ...d, items: [{ ...item, ...patch }] }));
  };

  const addFabric = () => {
    setItem({ fabrics: [...item.fabrics, { name: '', composition: '', features: [], price: '', image: '', description: '', wikiLink: '' }] });
  };

  // Per-fabric upload state: { [fabricIdx]: true/false }
  const [uploadingIdx, setUploadingIdx] = useState({});

  const handleFabricImageUpload = async (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please pick an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    setUploadingIdx((m) => ({ ...m, [idx]: true }));
    try {
      const url = await uploadImage(file, 'bulk-catalog/fabrics');
      updateFabric(idx, { image: url });
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    } finally {
      setUploadingIdx((m) => ({ ...m, [idx]: false }));
    }
  };

  const updateFabric = (idx, patch) => {
    const fabrics = item.fabrics.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setItem({ fabrics });
  };

  const removeFabric = (idx) => {
    setItem({ fabrics: item.fabrics.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    if (!data.category.trim()) {
      alert('Category title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((it) => ({
          ...it,
          fabrics: it.fabrics
            // Keep any fabric that has at least one meaningful field. Only fully-empty rows get dropped.
            .filter(
              (f) =>
                (f.name && f.name.trim()) ||
                (f.image && f.image.trim()) ||
                (f.composition && f.composition.trim()) ||
                (f.description && f.description.trim()) ||
                (f.price && f.price.trim()) ||
                (Array.isArray(f.features) && f.features.some((x) => x && x.trim()))
            )
            .map((f) => ({
              ...f,
              features: Array.isArray(f.features) ? f.features.filter((x) => x && x.trim()) : [],
            })),
          customization: (it.customization || []).filter(Boolean),
        })),
      };
      if (initial.id) {
        await updateDoc(doc(db, COLLECTION, initial.id), { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, COLLECTION), { ...payload, createdAt: serverTimestamp() });
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
      <div className="bg-white rounded-xl max-w-3xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{initial.id ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Step 1: Audience ──────────────────────────────────────────── */}
          <Field label={<>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">1</span>
              Audience *
            </span>
          </>}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'men-women', label: 'Men & Women' },
                { key: 'kids', label: 'Kids (Schools & NGOs)' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setData({ ...data, audience: opt.key, category: '' })}
                  className={`h-11 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    data.audience === opt.key
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* ── Step 2: Category ──────────────────────────────────────────── */}
          <Field
            label={<>
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${audiencePicked ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                <span className={audiencePicked ? '' : 'text-gray-400'}>Category *</span>
              </span>
            </>}
          >
            <div className="flex items-center gap-2">
              <select
                value={audienceOptions.includes(data.category) ? data.category : (data.category && audiencePicked ? '__custom__' : '')}
                onChange={(e) => {
                  if (e.target.value === '__custom__') return;
                  pickCategory(e.target.value);
                }}
                disabled={!audiencePicked}
                className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">{audiencePicked ? 'Pick a category…' : 'Pick audience first'}</option>
                {audienceOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {data.category && !audienceOptions.includes(data.category) && (
                  <option value="__custom__">(custom) {data.category}</option>
                )}
              </select>
              {audiencePicked && onOpenManager && (
                <button
                  type="button"
                  onClick={onOpenManager}
                  title="Add or remove categories from this dropdown"
                  className="text-xs text-gray-500 hover:text-gray-900 underline whitespace-nowrap cursor-pointer"
                >
                  Manage
                </button>
              )}
            </div>
          </Field>

          {/* ── Step 3: Details (locked until audience + category picked) ──── */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${categoryPicked ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
            <span className={`text-xs uppercase tracking-wider font-medium ${categoryPicked ? 'text-gray-700' : 'text-gray-400'}`}>
              Details
            </span>
            {!categoryPicked && (
              <span className="text-xs text-gray-400">— pick audience and category first</span>
            )}
          </div>

          <fieldset
            disabled={!categoryPicked}
            className={`space-y-5 ${categoryPicked ? '' : 'opacity-50 pointer-events-none select-none'}`}
          >
          <Field label="Subcategory (optional)">
            <input
              value={data.subCategory}
              onChange={(e) => setData({ ...data, subCategory: e.target.value })}
              placeholder="e.g. Full/ Half Sleeves"
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
            />
          </Field>

          <Field label="Display order">
            <input
              type="number"
              value={data.order}
              onChange={(e) => setData({ ...data, order: parseInt(e.target.value) || 0 })}
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
            />
          </Field>

          <Field label="Product line name (used internally)">
            <input
              value={item.name}
              onChange={(e) => setItem({ name: e.target.value })}
              placeholder="e.g. Round Neck T-Shirts"
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
            />
          </Field>

          {/* Fabrics editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Fabrics</label>
              <button onClick={addFabric} className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 cursor-pointer">
                <Plus size={12} /> Add fabric
              </button>
            </div>
            <div className="space-y-3">
              {item.fabrics.map((f, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    {/* Left: image upload thumbnail */}
                    <div className="flex-shrink-0">
                      {f.image ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img src={f.image} alt={f.name || 'fabric'} className="w-full h-full object-cover" />
                          <button
                            onClick={() => updateFabric(idx, { image: '' })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-600 cursor-pointer"
                            title="Remove image"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 transition-colors"
                          title="Upload fabric image"
                        >
                          {uploadingIdx[idx] ? (
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                          ) : (
                            <>
                              <ImagePlus size={16} className="text-gray-400" />
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Image</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFabricImageUpload(idx, e.target.files?.[0])}
                          />
                        </label>
                      )}
                    </div>

                    {/* Right: text fields */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          value={f.name}
                          onChange={(e) => updateFabric(idx, { name: e.target.value })}
                          placeholder="Fabric name (e.g. Cotton 100%)"
                          className="flex-1 h-8 px-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                        />
                        <input
                          value={f.price || ''}
                          onChange={(e) => updateFabric(idx, { price: e.target.value })}
                          placeholder="Price"
                          className="w-28 h-8 px-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                          title="Estimated price (e.g. ₹250 or ₹250 onwards). Shown next to the fabric name on Bulk Orders."
                        />
                      </div>
                      <input
                        value={f.composition}
                        onChange={(e) => updateFabric(idx, { composition: e.target.value })}
                        placeholder="Composition (e.g. Pure Cotton)"
                        className="w-full h-8 px-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                      <input
                        value={(f.features || []).join(', ')}
                        onChange={(e) => updateFabric(idx, { features: e.target.value.split(',').map((s) => s.trim()) })}
                        placeholder="Features (comma-separated): Breathable, Soft, Durable"
                        className="w-full h-8 px-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                      <textarea
                        value={f.description || ''}
                        onChange={(e) => updateFabric(idx, { description: e.target.value })}
                        placeholder="Long description (shown in the &quot;About this material&quot; dialog)"
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white resize-none leading-snug"
                      />
                      <input
                        value={f.wikiLink || ''}
                        onChange={(e) => updateFabric(idx, { wikiLink: e.target.value })}
                        placeholder='"Learn more" link (e.g. https://en.wikipedia.org/wiki/Cotton)'
                        className="w-full h-8 px-2.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeFabric(idx)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 cursor-pointer flex-shrink-0"
                      title="Remove fabric"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {item.fabrics.length === 0 && (
                <p className="text-xs text-gray-400 italic">No fabrics yet — click "Add fabric" above.</p>
              )}
            </div>
          </div>

          <Field label="Customization options (one per line)">
            <textarea
              value={(item.customization || []).join('\n')}
              onChange={(e) => setItem({ customization: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
              placeholder={'Different collar colors\nDifferent sleeve colors\nCustom pocket designs'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none disabled:bg-gray-50"
            />
          </Field>
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !categoryPicked}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Manage Categories dialog ────────────────────────────────────────────────
// Edits the bulkCategoryOptions collection. Defaults (DEFAULT_CATEGORIES) are
// always shown in the dropdown and can't be deleted from here.
function CategoryOptionsManager({ options, onClose, onChanged, showToast }) {
  const [tab, setTab] = useState('men-women');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const defaultsForTab = DEFAULT_CATEGORIES[tab] || [];
  const addedForTab = options.filter((o) => o.audience === tab);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (defaultsForTab.includes(name) || addedForTab.some((o) => o.name === name)) {
      alert('That category is already in the list');
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, OPTIONS_COLLECTION), { name, audience: tab, createdAt: serverTimestamp() });
      setNewName('');
      await onChanged();
      showToast?.('Category added');
    } catch (err) {
      console.error(err);
      alert('Add failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this category from the dropdown? Existing bulk-catalog docs using it will keep working.')) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, OPTIONS_COLLECTION, id));
      await onChanged();
      showToast?.('Removed');
    } catch (err) {
      console.error(err);
      alert('Remove failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Manage Categories</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Categories shown in the dropdown when adding a new Bulk Catalog entry. Defaults are always included and can't be removed.
          </p>

          {/* Audience tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { key: 'men-women', label: 'Men & Women' },
              { key: 'kids', label: 'Kids' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Defaults (read-only) */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2">Defaults (always shown)</p>
            <div className="space-y-1.5">
              {defaultsForTab.map((name) => (
                <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700">
                  <span className="flex-1">{name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">built-in</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom additions */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2">Your additions</p>
            {addedForTab.length === 0 ? (
              <p className="text-xs text-gray-400 italic px-3 py-2">None yet — add one below.</p>
            ) : (
              <div className="space-y-1.5">
                {addedForTab.map((o) => (
                  <div key={o.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <span className="flex-1">{o.name}</span>
                    <button
                      onClick={() => handleRemove(o.id)}
                      disabled={busy}
                      className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2">Add a new category for {tab === 'men-women' ? 'Men & Women' : 'Kids'}</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="e.g. Tracksuits"
                className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                onClick={handleAdd}
                disabled={busy || !newName.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 cursor-pointer">Done</button>
        </div>
      </div>
    </div>
  );
}
