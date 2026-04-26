import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImages } from '../services/cloudinaryService';
import { Plus, Trash2, Pencil, X, Upload, ImageIcon, Building2 } from 'lucide-react';

const CDN = 'https://res.cloudinary.com/dlxv7oikk/image/upload/q_auto,f_auto/clients';

const SEED_CLIENTS = [
  {
    name: 'IIM Udaipur', location: 'Udaipur, Rajasthan', founded: '2011',
    tagline: 'Excellence in Management Education',
    fullDescription: 'Indian Institute of Management Udaipur (IIMU) is one of India\'s premier management institutes, established in 2011. Known for academic excellence and innovative pedagogy, IIMU fosters leadership and entrepreneurial spirit among students, preparing them for global business challenges.',
    logo: `${CDN}/iimu-logo.jpg`,
    photos: [`${CDN}/iimu-photo1.jpg`, `${CDN}/iimu-photo2.jpg`],
    services: ['MBA Programs', 'Executive Education', 'Doctoral Programs', 'Research Initiatives', 'Corporate Training'],
    achievements: ['Ranked among top IIMs in India', 'Strong industry partnerships', 'Global academic collaborations'],
    impact: ['1000+ alumni across industries', 'Top placement records', 'Research publications in leading journals'],
    order: 1,
  },
  {
    name: 'E3 Events', location: 'Qatar', founded: '',
    tagline: 'Premier Event Management',
    fullDescription: 'E3 Events is a premier event management company based in Qatar, providing custom event merchandise and branded apparel worldwide for international events.',
    logo: `${CDN}/e3events-logo.png`,
    photos: [`${CDN}/e3events-photo1.jpg`, `${CDN}/e3events-photo2.jpg`],
    services: ['Event Management', 'Custom Event Merchandise', 'Branded Apparel', 'International Event Coordination', 'Corporate Events'],
    achievements: ['Serving international clients', 'Custom merchandise solutions', 'Premium event production'],
    impact: [],
    order: 2,
  },
  {
    name: 'AHTE Flooring LLC', location: 'Dubai, UAE', founded: '',
    tagline: 'Setting Industry Trends Through Innovation',
    fullDescription: 'AHTE Flooring LLC is a Dubai-based flooring company specializing in customized solutions such as Epoxy, PU, Terrazzo, Self-Leveling, Industrial, Sports, and Car Parking flooring.',
    logo: `${CDN}/ahte-logo.png`,
    photos: [`${CDN}/ahte-photo1.png`],
    services: ['Epoxy Flooring', 'PU Flooring Solutions', 'Terrazzo Flooring', 'Self-Leveling Flooring', 'Industrial Flooring', 'Sports Flooring', 'Car Parking Flooring'],
    achievements: ['Authorized flooring applicator', 'Developed innovative Terrazzo flooring'],
    impact: [],
    order: 3,
  },
  {
    name: 'Mechartés', location: 'India', founded: '',
    tagline: 'Leading Simulation and Engineering Services Provider',
    fullDescription: 'Mechartés is a leading simulation and engineering services provider with 19 years of expertise in CFD modelling, FEA, piping stress, acoustics, vibration, FIV/AIV, flow assurance, and surge analysis.',
    logo: `${CDN}/mechartes-logo.png`,
    photos: [`${CDN}/mechartes-photo1.jpg`],
    services: ['CFD Modelling', 'Finite Element Analysis (FEA)', 'Piping Stress Analysis', 'Acoustics & Vibration Analysis', 'FIV/AIV Analysis', 'Flow Assurance', 'Surge Analysis'],
    achievements: ['19 years of industry expertise', 'Trusted partner across multiple sectors'],
    impact: ['19+ years of excellence', 'Multi-sector expertise', 'Industry-trusted solutions'],
    order: 4,
  },
  {
    name: 'Sahodar Trust', location: 'Patel Nagar', founded: '',
    tagline: 'Share the Stand',
    fullDescription: 'Sahodar—meaning "sibling" in Sanskrit—is an organization dedicated to standing by others in times of need, promoting development and inclusion for all sections of society.',
    logo: `${CDN}/sahodar-logo.png`,
    photos: [`${CDN}/sahodar-photo1.png`, `${CDN}/sahodar-photo2.png`],
    services: ['Equal Opportunity Programs', 'Justice & Advocacy', 'Economic Development Support', 'Grievance Redressal', 'Community Inclusion Initiatives'],
    achievements: [],
    impact: ['Real, tangible social impact', 'Promoting equality and respect'],
    order: 5,
  },
  {
    name: 'KFR Engineers', location: 'Bareilly, Uttar Pradesh', founded: '1976',
    tagline: 'Precision Engineering Since 1976',
    fullDescription: 'Established in 1976, KFR Engineering Works began as a small-scale unit and has grown into a fully equipped engineering workshop manufacturing high-precision components.',
    logo: `${CDN}/kfr-logo.png`,
    photos: [`${CDN}/kfr-photo1.png`],
    services: ['High-precision component manufacturing', 'Stainless steel fabrication', 'Carbon steel & alloy steel components', 'Spare parts for imported machinery'],
    achievements: ['First in India to develop in-house screw compressor rotor repair expertise (1982)'],
    impact: [],
    order: 6,
  },
  {
    name: 'Samidha Welfare Foundation', location: 'Gurgaon, Haryana', founded: 'August 5, 2019',
    tagline: 'Empowering Girls Through Education',
    fullDescription: 'Samidha Welfare Foundation is an NGO dedicated to empowering underprivileged girls through education and holistic development.',
    logo: `${CDN}/samidha-logo.png`,
    photos: [],
    services: ['Quality Education Programs', 'Healthcare Services', 'Personal Development Workshops', 'Skill Development Training', 'Mentorship Programs'],
    achievements: [],
    impact: ['500+ girls educated annually', '100% healthcare coverage for students', '85% employment rate for graduates'],
    order: 7,
  },
  {
    name: 'Ali Colours', location: 'New Delhi, India', founded: '1985',
    tagline: "World's Preferred Choice for Indian Ethnic Fashion",
    fullDescription: 'The journey of Ali Colours began in 1985 with the opening of the first wholesale and retail outlet in New Delhi. Today, it is the world\'s preferred choice for Indian Ethnic Fashion.',
    logo: `${CDN}/alicolors-logo.jpg`,
    photos: [`${CDN}/alicolors-photo1.jpg`, `${CDN}/alicolors-photo2.jpg`],
    services: ['Salwar Kameez Collections', 'Ethnic Fashion Wholesale', 'Retail Ethnic Wear', 'Online Fashion Store', 'Custom Ethnic Apparel'],
    achievements: ["World's preferred choice for Indian ethnic fashion", 'Launched successful online store in 2014'],
    impact: ['39+ years in ethnic fashion', 'Global customer base'],
    order: 8,
  },
  {
    name: 'All India Chishtiya Foundation', location: 'Bareilly, Uttar Pradesh', founded: '',
    tagline: 'Inspired by Sufi Values',
    fullDescription: 'All India Chishtiya Foundation (AIC Foundation) is an NGO focused on social welfare, education, healthcare, and community support for underprivileged populations.',
    logo: `${CDN}/aic-logo.png`,
    photos: [`${CDN}/aic-photo1.png`, `${CDN}/aic-photo2.png`],
    services: ['Social Welfare Programs', 'Educational Support', 'Healthcare Initiatives', 'Community Development'],
    achievements: [],
    impact: ['Operating in Maheshpur and CB Ganj', 'Community empowerment programs'],
    order: 9,
  },
];

const EMPTY_FORM = {
  name: '', location: '', founded: '', tagline: '', fullDescription: '',
  logo: '', photos: [], services: [], achievements: [], impact: [], order: 1,
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadClients = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'clients'), orderBy('order', 'asc')));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      setClients(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
      showToast('Client deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const seedClients = async () => {
    if (clients.length > 0) {
      if (!window.confirm(`There are already ${clients.length} clients. Seed will skip duplicates by name. Continue?`)) return;
    }
    setSeeding(true);
    try {
      const existingNames = new Set(clients.map(c => c.name));
      let added = 0;
      for (const c of SEED_CLIENTS) {
        if (existingNames.has(c.name)) continue;
        await addDoc(collection(db, 'clients'), { ...c, createdAt: serverTimestamp() });
        added++;
      }
      await loadClients();
      showToast(`Seeded ${added} clients${added < SEED_CLIENTS.length ? ` (${SEED_CLIENTS.length - added} skipped)` : ''}`);
    } catch (err) {
      showToast('Seed failed: ' + err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} / 9 client slots used</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedClients}
            disabled={seeding}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Building2 size={16} className="inline mr-1.5" />
            {seeding ? 'Seeding...' : 'Seed Existing Clients'}
          </button>
          <button
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            disabled={clients.length >= 9}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40"
            title={clients.length >= 9 ? 'Maximum 9 clients reached' : ''}
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No clients yet. Click "Seed Existing Clients" to populate from the hardcoded list.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {client.logo ? (
                  <img src={client.logo} alt={client.name} className="w-14 h-14 object-contain rounded-lg border border-gray-100 p-1 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.location}</p>
                  {client.tagline && <p className="text-xs text-[#7f8f82] mt-0.5 italic truncate">"{client.tagline}"</p>}
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 flex-shrink-0">#{client.order}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{client.fullDescription}</p>
              {client.photos?.length > 0 && (
                <div className="flex gap-1">
                  {client.photos.slice(0, 3).map((p, i) => (
                    <img key={i} src={p} alt="" className="w-12 h-12 object-cover rounded" />
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setEditingClient(client); setShowForm(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(client)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-100 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClientFormModal
          client={editingClient}
          usedOrders={clients.filter(c => !editingClient || c.id !== editingClient.id).map(c => c.order)}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSaved={async () => { setShowForm(false); setEditingClient(null); await loadClients(); showToast(editingClient ? 'Client updated' : 'Client added'); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Delete Client</h3>
            <p className="text-sm text-gray-600 mb-6">Remove <strong>{deleteConfirm.name}</strong> from the bento?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFormModal({ client, usedOrders, onClose, onSaved, onError }) {
  const isEditing = !!client;
  const [form, setForm] = useState(() => client ? {
    name: client.name || '',
    location: client.location || '',
    founded: client.founded || '',
    tagline: client.tagline || '',
    fullDescription: client.fullDescription || '',
    logo: client.logo || '',
    photos: client.photos || [],
    services: (client.services || []).join('\n'),
    achievements: (client.achievements || []).join('\n'),
    impact: (client.impact || []).join('\n'),
    order: client.order || 1,
  } : { ...EMPTY_FORM, services: '', achievements: '', impact: '' });

  const [newLogoFile, setNewLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(client?.logo || '');
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState(client?.photos || []);
  const [saving, setSaving] = useState(false);

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (photoPreviews.length + files.length > 4) { onError('Max 4 photos'); return; }
    setNewPhotoFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx) => {
    const existingCount = (form.photos || []).length;
    if (idx < existingCount) {
      setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
    } else {
      setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx - existingCount));
    }
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { onError('Name is required'); return; }
    if (!form.fullDescription.trim()) { onError('Description is required'); return; }
    setSaving(true);
    try {
      let logoUrl = form.logo;
      if (newLogoFile) {
        const [url] = await uploadImages([newLogoFile], 'clients/logos');
        logoUrl = url;
      }
      let photoUrls = [...(form.photos || [])];
      if (newPhotoFiles.length > 0) {
        const uploaded = await uploadImages(newPhotoFiles, 'clients/photos');
        photoUrls = [...photoUrls, ...uploaded];
      }
      const data = {
        name: form.name.trim(),
        location: form.location.trim(),
        founded: form.founded.trim(),
        tagline: form.tagline.trim(),
        fullDescription: form.fullDescription.trim(),
        logo: logoUrl,
        photos: photoUrls,
        services: form.services.split('\n').map(s => s.trim()).filter(Boolean),
        achievements: form.achievements.split('\n').map(s => s.trim()).filter(Boolean),
        impact: form.impact.split('\n').map(s => s.trim()).filter(Boolean),
        order: Number(form.order) || 1,
      };
      if (isEditing) {
        await updateDoc(doc(db, 'clients', client.id), { ...data, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err) {
      onError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-semibold">{isEditing ? 'Edit Client' : 'Add Client'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="IIM Udaipur" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Udaipur, Rajasthan" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Founded <span className="text-gray-400">optional</span></label>
              <input value={form.founded} onChange={e => setForm(p => ({ ...p, founded: e.target.value }))} placeholder="2011" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position (1–9)</label>
              <input type="number" min={1} max={9} value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline <span className="text-gray-400">optional</span></label>
            <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Excellence in Management Education" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
            <textarea value={form.fullDescription} onChange={e => setForm(p => ({ ...p, fullDescription: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-16 h-16 object-contain rounded-lg border border-gray-200 p-1" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon size={20} className="text-gray-400" />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <Upload size={14} /> Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos <span className="text-gray-400">up to 4</span></label>
            <div className="flex flex-wrap gap-2">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 cursor-pointer"><X size={10} /></button>
                </div>
              ))}
              {photoPreviews.length < 4 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                  <Upload size={16} className="text-gray-400" />
                  <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Services <span className="text-gray-400">one per line</span></label>
            <textarea value={form.services} onChange={e => setForm(p => ({ ...p, services: e.target.value }))} rows={3} placeholder="MBA Programs&#10;Executive Education&#10;Research Initiatives" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Achievements <span className="text-gray-400">one per line</span></label>
            <textarea value={form.achievements} onChange={e => setForm(p => ({ ...p, achievements: e.target.value }))} rows={2} placeholder="Ranked among top IIMs&#10;Strong industry partnerships" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:sm focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact <span className="text-gray-400">one per line</span></label>
            <textarea value={form.impact} onChange={e => setForm(p => ({ ...p, impact: e.target.value }))} rows={2} placeholder="1000+ alumni across industries&#10;Top placement records" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : isEditing ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
