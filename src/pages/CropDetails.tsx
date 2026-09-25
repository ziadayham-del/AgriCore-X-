import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTelemetry } from '../hooks/useTelemetry';
import { useToast } from '../components/common/Toast';
import { completeCropTask } from '../api/cropApi';
import {
  Wheat,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowLeft,
  Sprout,
  Thermometer,
  Droplets,
  Activity,
  Sparkles,
  Bot,
  RefreshCw,
} from 'lucide-react';

export const CropDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { crops, environment, soilZones } = useTelemetry();
  const { showToast } = useToast();

  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [advisoryContent, setAdvisoryContent] = useState<string | null>(null);

  const crop = crops.find((c) => c.id === id) || crops[0];

  const handleGenerateAdvisory = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch('/api/ai/agronomic-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: crop.name,
          variety: crop.variety,
          growthStage: crop.growthStage,
          healthScore: crop.healthScore,
          temperature: environment.temperature,
          humidity: environment.humidity,
          soilMoisture: soilZones[0]?.moisture ?? 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch advisory');
      }

      setAdvisoryContent(data.advice);
      showToast('success', 'Groq Advisory Generated', 'Real-time precision agronomic assessment updated.');
    } catch (err: any) {
      showToast('error', 'Advisory Error', err.message || 'Unable to connect to AI engine');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const stages = [
    'Germination',
    'Seedling',
    'Vegetative',
    'Flowering',
    'Fruiting',
    'Maturation',
    'Harvest',
  ];

  const currentStageIndex = stages.indexOf(crop.growthStage);

  const handleTaskCheck = async (taskId: string, title: string) => {
    await completeCropTask(crop.id, taskId);
    showToast('success', 'Task Completed', `"${title}" has been completed.`);
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                {crop.name}
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
                {crop.fieldName}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Planting Date: {crop.plantingDate} • Expected Harvest: {crop.expectedHarvest}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/crops/${crop.id}/images`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>ESP32-CAM N07 Images</span>
          </Link>
        </div>
      </div>

      {/* Growth Stage Horizontal Timeline */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
          Crop Phenology & Growth Timeline
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[600px] relative">
            {/* Background connecting track */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 z-0" />

            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs ${
                      isCurrent
                        ? 'bg-emerald-800 text-white ring-4 ring-emerald-100'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-400 border border-stone-300'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-white" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isCurrent ? 'text-emerald-900 font-bold' : isPast ? 'text-stone-700' : 'text-stone-400'
                    }`}
                  >
                    {stage}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                      Day {crop.currentDay} (Active)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column: Left Tasks & Timeline / Right Sensor Telemetry & Camera Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">
                Scheduled Advisory Tasks & Interventions
              </h3>
              <span className="text-xs font-mono text-stone-500">
                Agronomic Schedule Engine (N02)
              </span>
            </div>

            <div className="space-y-3">
              {crop.tasks?.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    task.status === 'completed'
                      ? 'bg-stone-50/70 border-stone-200 opacity-75'
                      : 'bg-white border-stone-200 shadow-2xs hover:border-emerald-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleTaskCheck(task.id, task.title)}
                      disabled={task.status === 'completed'}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 hover:border-emerald-700'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-stone-500 mt-0.5">{task.description}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-stone-400">
                        <span>Due: {task.dueDate}</span>
                        <span>•</span>
                        <span className="capitalize text-emerald-800 font-semibold">{task.taskType}</span>
                      </div>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleTaskCheck(task.id, task.title)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Environmental Alignment & Health */}
        <div className="space-y-6">
          {/* Engineering Indicator Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Crop Health Status
            </span>
            <div className="text-3xl font-mono font-bold text-emerald-800 mt-2">
              {crop.healthScore}%
            </div>
            <div className="text-xs font-medium text-stone-600 mt-1">
              Engineering Indicator
            </div>
            <div className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              Synthesized from N02 soil moisture adherence, canopy microclimate, and N07 leaf greenness index.
            </div>
          </div>

          {/* Microclimate Live Data for this crop */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Microclimate Conditions
            </span>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-600 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                Zone 1 Soil Moisture:
              </span>
              <span className="font-mono font-bold text-stone-900">{soilZones[0].moisture}%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-600 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-700" />
                Canopy Temperature:
              </span>
              <span className="font-mono font-bold text-stone-900">{environment.temperature}°C</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-600 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-700" />
                Vapor Humidity:
              </span>
              <span className="font-mono font-bold text-stone-900">{environment.humidity}%</span>
            </div>
          </div>

          {/* AI Agronomic Advisory (Powered by Groq Cloud Inference) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900">
                    Groq AI Agronomic Advisory
                  </span>
                  <p className="text-[10px] text-stone-400 font-mono">
                    High-speed LPU inference • Real-time telemetry analysis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAdvisory}
                disabled={loadingAdvice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loadingAdvice ? 'animate-spin' : ''}`} />
                <span>{loadingAdvice ? 'Analyzing...' : 'Generate Assessment'}</span>
              </button>
            </div>

            {advisoryContent ? (
              <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200/90 text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line space-y-2">
                {advisoryContent}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic bg-stone-50/60 p-3 rounded-lg border border-dashed border-stone-200">
                Click "Generate Assessment" to run Groq LPU inference across soil moisture, canopy humidity, and temperature for targeted crop advice.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
