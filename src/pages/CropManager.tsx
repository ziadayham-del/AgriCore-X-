import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { registerCrop, completeCropTask } from '../api/cropApi';
import { Crop, GrowthStage } from '../types';
import {
  Wheat,
  Plus,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';

export const CropManager: React.FC = () => {
  const { crops } = useTelemetry();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [fieldName, setFieldName] = useState('Field A');
  const [plantingDate, setPlantingDate] = useState('2026-07-01');
  const [expectedHarvest, setExpectedHarvest] = useState('2026-10-28');
  const [growthStage, setGrowthStage] = useState<GrowthStage>('Vegetative');
  const [notes, setNotes] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Validation Error', 'Please enter crop name.');
      return;
    }

    try {
      const newCrop = await registerCrop({
        name,
        variety,
        fieldName,
        plantingDate,
        expectedHarvest,
        growthStage,
        notes,
      });
      showToast('success', 'Crop Registered', `${newCrop.name} has been added to Field ${fieldName}.`);
      setModalOpen(false);
      setName('');
      setNotes('');
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    }
  };

  const handleCompleteTask = async (cropId: string, taskId: string, taskTitle: string) => {
    await completeCropTask(cropId, taskId);
    showToast('success', 'Task Completed', `"${taskTitle}" marked as complete.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-xs font-bold">
              NODE N02 & N07
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Crop Intelligence & Schedule Manager
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Planting-date tracking, growth stages, daily advisory schedule, and macro growth imaging
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/crops/calendar"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-800" />
            <span>Farm Calendar</span>
          </Link>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Crop</span>
          </button>
        </div>
      </div>

      {/* Crops List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {crops.map((crop) => {
          const pendingTasks = crop.tasks?.filter((t) => t.status === 'pending') || [];

          return (
            <div
              key={crop.id}
              className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-6 flex flex-col justify-between hover:border-emerald-700/30 transition-all"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-stone-900">{crop.name}</h3>
                      {crop.variety && (
                        <span className="text-xs text-stone-500 font-mono">({crop.variety})</span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-emerald-800 font-semibold mt-0.5">
                      {crop.fieldName}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-100 text-emerald-900">
                    Day {crop.currentDay}
                  </span>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">Growth Stage</div>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{crop.growthStage}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">Health Indicator</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">
                      {crop.healthScore}%
                    </div>
                    <div className="text-[8px] text-stone-400">Engineering score</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">Harvest Due</div>
                    <div className="text-xs font-bold text-stone-800 mt-0.5 font-mono">
                      {crop.expectedHarvest}
                    </div>
                  </div>
                </div>

                {/* Today's & Next Task */}
                <div className="space-y-2 mb-4">
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Today's Advisory Task
                      </div>
                      <div className="text-xs font-semibold text-stone-900 mt-0.5">
                        {crop.todayTask}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/80 flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Next Up (in {crop.nextTaskInDays} days)
                      </div>
                      <div className="text-xs font-medium text-stone-700 mt-0.5">
                        {crop.nextTask}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Pending Task Items with One-Click Completion */}
                {pendingTasks.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Pending Action Items
                    </div>
                    {pendingTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs border border-stone-200"
                      >
                        <span className="truncate pr-2 text-stone-700">{t.title}</span>
                        <button
                          onClick={() => handleCompleteTask(crop.id, t.id, t.title)}
                          className="shrink-0 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                        >
                          Mark Complete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <Link
                  to={`/crops/${crop.id}/images`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Images ({crop.images?.length || 0})</span>
                </Link>

                <Link
                  to={`/crops/${crop.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                >
                  <span>Full Timeline & Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register New Crop */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-base">Register Crop in Field</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rice, Wheat, Soybean"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. IR64, Heirloom"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Field / Bed *
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. Field A, Bed 2"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Growth Stage
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-medium bg-white"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturation">Maturation</option>
                    <option value="Harvest">Harvest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Planting Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Expected Harvest *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedHarvest}
                    onChange={(e) => setExpectedHarvest(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Agronomic Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Soil amendments, seed lot, irrigation zone assignment..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
                >
                  Register Crop & Generate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
