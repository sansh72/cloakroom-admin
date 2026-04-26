import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Upload, X, ImageIcon, Loader2, Plus } from 'lucide-react';

const CLOUDINARY_CLOUD = 'dlxv7oikk';
const CLOUDINARY_PRESET = 'ml_default';

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'hero');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}

export default function HeroImagesPage() {
  const [urls, setUrls] = useState([]);
  const [uploading, setUploading] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const FALLBACK_URLS = [
    'https://res.cloudinary.com/dlxv7oikk/image/upload/v1776529278/hero/cloakroom-1.png',
    'https://res.cloudinary.com/dlxv7oikk/image/upload/v1776529293/hero/cloakroom-4.png',
    'https://res.cloudinary.com/dlxv7oikk/image/upload/v1776529297/hero/cloakroom-main.png',
  ];

  useEffect(() => {
    getDoc(doc(db, 'appConfig', 'heroImages')).then(snap => {
      if (snap.exists()) {
        setUrls(snap.data().urls || FALLBACK_URLS);
      } else {
        setUrls(FALLBACK_URLS);
      }
    });
  }, []);

  const setUploadingAt = (index, value) =>
    setUploading(prev => prev.map((v, i) => i === index ? value : v));

  const handleFileChange = async (index, file) => {
    if (!file) return;
    setUploadingAt(index, true);
    try {
      const url = await uploadToCloudinary(file);
      setUrls(prev => prev.map((v, i) => i === index ? url : v));
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploadingAt(index, false);
    }
  };

  const handleAddSlot = () => {
    setUrls(prev => [...prev, '']);
    setUploading(prev => [...prev, false]);
  };

  const handleRemove = (index) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
    setUploading(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const nonEmpty = urls.filter(Boolean);
    if (nonEmpty.length === 0) {
      alert('Add at least one image before saving.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'heroImages'), { urls: nonEmpty });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hero Images</h1>
        <p className="text-gray-500 mt-1">
          Add as many slides as you want. Each one shows as a dot in the carousel, cycling every 5 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        {urls.map((url, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Slide {index + 1}</p>
              <button
                onClick={() => handleRemove(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove slide"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center group">
              {uploading[index] ? (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs">Uploading...</span>
                </div>
              ) : url ? (
                <>
                  <img src={url} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleFileChange(index, e.target.files[0])}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors p-4 w-full h-full justify-center">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs text-center font-medium">Click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileChange(index, e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        {/* Add new slide button */}
        <div className="flex flex-col gap-2">
          {urls.length > 0 && <p className="text-sm font-medium text-transparent select-none">–</p>}
          <button
            onClick={handleAddSlot}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-xs font-medium">Add Slide</span>
          </button>
        </div>
      </div>

      {/* Dot preview */}
      {urls.filter(Boolean).length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-gray-500">Dot preview:</span>
          <div className="flex gap-2">
            {urls.filter(Boolean).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${i === 0 ? 'w-3 h-3 bg-gray-900' : 'w-2.5 h-2.5 bg-gray-400'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">{urls.filter(Boolean).length} slide{urls.filter(Boolean).length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Hero Images'}
      </button>
    </div>
  );
}
