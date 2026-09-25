import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { captureCropImage } from '../api/cropApi';
import {
  Camera,
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  Sun,
  Activity,
  Upload,
  Check,
} from 'lucide-react';

export const CropImages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { crops } = useTelemetry();
  const { showToast } = useToast();
  const [capturing, setCapturing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const crop = crops.find(c => c.id === id) || crops[0];
  const images = crop.images || [];

  const handleCapture = async () => {
    setCapturing(true);
    showToast('info', 'N07 Triggered', 'ESP32-CAM N07 capturing macro crop frame...');
    try {
      await captureCropImage(crop.id, 'Operator manual capture via Web Console');
      showToast('success', 'Image Synchronized', 'New high-resolution canopy capture received from N07.');
    } catch (err: any) {
      showToast('error', 'Capture Failed', err.message);
    } finally {
      setCapturing(false);
    }
  };

  const toggleCompare = (imgId: string) => {
    if (selectedForCompare.includes(imgId)) {
      setSelectedForCompare(prev => prev.filter(i => i !== imgId));
    } else {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare(prev => [...prev, imgId]);
      } else {
        setSelectedForCompare([selectedForCompare[1], imgId]);
      }
    }
  };

  const comparedImages = images.filter(img => selectedForCompare.includes(img.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/crops/${crop.id}`}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
                NODE N07
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Crop Growth Image Log
              </h1>
            </div>
            <p className="text-sm text-stone-500 mt-0.5">
              {crop.name} • {crop.fieldName} • Time-lapse growth progression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompareMode(prev => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              compareMode
                ? 'bg-emerald-800 text-white border-emerald-900'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{compareMode ? 'Exit Compare' : 'Compare Mode'}</span>
          </button>

          <button
            disabled={capturing}
            onClick={handleCapture}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>{capturing ? 'Capturing via N07...' : 'Capture Image Now'}</span>
          </button>
        </div>
      </div>

      {/* Compare Drawer when 2 images selected */}
      {compareMode && comparedImages.length === 2 && (
        <div className="bg-white rounded-xl border-2 border-emerald-700/40 p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-800" />
              <span>Side-by-Side Canopy Progression</span>
            </h3>
            <span className="text-xs font-mono text-emerald-800 font-bold">
              Comparing 2 Snapshots
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparedImages.map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-stone-200">
                <img src={img.imageUrl} alt="Canopy capture" className="w-full h-56 object-cover" />
                <div className="p-3 bg-stone-50 text-xs font-mono flex justify-between">
                  <span>Day {img.dayNumber} ({img.growthStage})</span>
                  <span>Health: {img.engineeringHealthScore}% (Eng. Indicator)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => {
          const isSelected = selectedForCompare.includes(img.id);

          return (
            <div
              key={img.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-xs transition-all ${
                isSelected ? 'border-emerald-700 ring-2 ring-emerald-700/20' : 'border-stone-200'
              }`}
            >
              <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                <img
                  src={img.imageUrl}
                  alt={`Day ${img.dayNumber} capture`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded text-xs font-mono font-bold">
                  Day {img.dayNumber}
                </div>
                {compareMode && (
                  <button
                    onClick={() => toggleCompare(img.id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-900/70 text-white hover:bg-stone-900'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-900">{img.growthStage}</span>
                  <span className="text-stone-400 font-mono">
                    {new Date(img.captureDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <div>
                    <span className="text-stone-400">Health Index:</span>
                    <span className="ml-1 text-emerald-800 font-bold">
                      {img.engineeringHealthScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">Greenness:</span>
                    <span className="ml-1 text-stone-800 font-bold">
                      {img.leafGreennessIndex || 0.82}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-stone-200/60 text-stone-500">
                    Light: {img.illuminationLux ? `${(img.illuminationLux / 1000).toFixed(1)} kLux` : 'Ambient'}
                  </div>
                </div>

                {img.notes && (
                  <div className="text-xs text-stone-600 line-clamp-2 italic">
                    "{img.notes}"
                  </div>
                )}

                <div className="text-[10px] text-stone-400 border-t border-stone-100 pt-2">
                  Health score is an <span className="font-semibold text-stone-600">Engineering Indicator</span> (not an agronomic diagnosis).
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
