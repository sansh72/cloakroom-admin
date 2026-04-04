import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { HexColorPicker } from 'react-colorful';
import { Plus, X, Save, Palette } from 'lucide-react';

const CONFIG_DOC = 'customizationColors';

export default function CustomizationPage() {
  const [colors, setColors] = useState([]);
  const [pickerColor, setPickerColor] = useState('#7f8f82');
  const [colorName, setColorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const snap = await getDoc(doc(db, 'appConfig', CONFIG_DOC));
      if (snap.exists() && snap.data().colors) {
        setColors(snap.data().colors);
      }
    } catch (err) {
      console.error('Failed to load colors:', err);
    } finally {
      setLoading(false);
    }
  };

  const addColor = () => {
    if (!colorName.trim()) return;
    if (colors.some(c => c.value.toLowerCase() === pickerColor.toLowerCase())) {
      alert('This color already exists');
      return;
    }
    setColors(prev => [...prev, { name: colorName.trim(), value: pickerColor }]);
    setColorName('');
    setShowPicker(false);
  };

  const removeColor = (index) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const saveColors = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'appConfig', CONFIG_DOC), { colors });
      alert('Colors saved successfully!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save colors');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette size={24} />
            Customization Colors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the color palette available in the 3D customizer on the frontend
          </p>
        </div>
        <button
          onClick={saveColors}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Current Colors */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Current Palette ({colors.length} colors)
        </h2>

        {colors.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No colors added yet. Add your first color below.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {colors.map((color, index) => (
              <div
                key={index}
                className="group relative bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <div
                  className="w-full aspect-square rounded-lg mb-2 border border-gray-200"
                  style={{ backgroundColor: color.value }}
                />
                <p className="text-xs font-medium text-gray-800 truncate">{color.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{color.value}</p>
                <button
                  onClick={() => removeColor(index)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Color */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add New Color</h2>

        {!showPicker ? (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors w-full justify-center cursor-pointer"
          >
            <Plus size={18} />
            Add a Color
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            <div>
              <HexColorPicker color={pickerColor} onChange={setPickerColor} />
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Hex Value</label>
                <input
                  type="text"
                  value={pickerColor}
                  onChange={(e) => setPickerColor(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preview</label>
                <div
                  className="w-20 h-20 rounded-xl border border-gray-200"
                  style={{ backgroundColor: pickerColor }}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Color Name *</label>
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g. Forest Green"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  onKeyDown={(e) => e.key === 'Enter' && addColor()}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addColor}
                  disabled={!colorName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={16} />
                  Add Color
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
