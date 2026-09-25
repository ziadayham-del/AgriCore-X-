import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  Wheat,
  Droplet,
  Sparkles,
} from 'lucide-react';

export const CropCalendar: React.FC = () => {
  const { crops } = useTelemetry();
  const [filterType, setFilterType] = useState<string>('all');

  // Flatten all tasks from crops
  const allTasks = crops.flatMap(c => 
    (c.tasks || []).map(t => ({
      ...t,
      cropName: c.name,
      fieldName: c.fieldName,
    }))
  );

  const filteredTasks = filterType === 'all'
    ? allTasks
    : allTasks.filter(t => t.taskType === filterType);

  const taskTypeColors: Record<string, { bg: string; text: string; border: string }> = {
    fertilization: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    irrigation: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    inspection: { bg: 'bg-stone-50', text: 'text-stone-800', border: 'border-stone-200' },
    pruning: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    pest_control: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    harvest: { bg: 'bg-lime-50', text: 'text-lime-900', border: 'border-lime-200' },
    general: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/crops"
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Crop Advisory & Care Calendar
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Scheduled agronomic treatments, irrigation windows, and harvest projections
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            <option value="all">All Task Types</option>
            <option value="fertilization">Fertilization</option>
            <option value="irrigation">Irrigation</option>
            <option value="pruning">Pruning</option>
            <option value="pest_control">Pest Control</option>
            <option value="inspection">Scouting / Inspection</option>
          </select>
        </div>
      </div>

      {/* Calendar List View */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-base text-stone-900">Active Schedule Timeline</h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {filteredTasks.length} task events
          </span>
        </div>

        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const style = taskTypeColors[t.taskType] || taskTypeColors.general;
            const isCompleted = t.status === 'completed';

            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted ? 'bg-stone-50/50 opacity-70 border-stone-200' : 'bg-white border-stone-200 shadow-2xs hover:border-emerald-700/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg border ${style.bg} ${style.border} ${style.text}`}>
                    {t.taskType === 'irrigation' ? (
                      <Droplet className="w-4 h-4" />
                    ) : t.taskType === 'fertilization' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{t.title}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                        {t.taskType}
                      </span>
                    </div>
                    {t.description && (
                      <div className="text-xs text-stone-600 mt-1">{t.description}</div>
                    )}
                    <div className="text-[11px] text-stone-500 font-mono mt-1">
                      {t.cropName} • {t.fieldName}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-stone-800">
                    {t.dueDate}
                  </div>
                  <div className="text-[10px] uppercase font-mono mt-0.5">
                    {isCompleted ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">Scheduled Action</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
