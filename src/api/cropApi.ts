/**
 * SmartAgriculture X - Crop Advisory & Management API
 * Syncs crop records, schedules, tasks, and image captures.
 */
import { hardwareService } from '../services/hardware';
import { Crop, CropTask, GrowthStage } from '../types';

export async function registerCrop(data: {
  name: string;
  variety?: string;
  fieldName: string;
  plantingDate: string;
  expectedHarvest: string;
  growthStage: GrowthStage;
  notes?: string;
}): Promise<Crop> {
  // Calculate current day from planting date
  const plantTime = new Date(data.plantingDate).getTime();
  const nowTime = new Date().getTime();
  const currentDay = Math.max(1, Math.floor((nowTime - plantTime) / (1000 * 60 * 60 * 24)));

  const initialTasks: CropTask[] = [
    {
      id: `task_${Date.now()}_1`,
      cropId: '',
      title: 'Inspect seedling germination and root vitality',
      taskType: 'inspection',
      scheduledDay: currentDay,
      dueDate: 'Today',
      status: 'pending',
    },
    {
      id: `task_${Date.now()}_2`,
      cropId: '',
      title: 'Nutrient application & soil moisture check',
      taskType: 'fertilization',
      scheduledDay: currentDay + 2,
      dueDate: 'In 2 days',
      status: 'pending',
    }
  ];

  return hardwareService.registerCrop({
    ...data,
    currentDay,
    healthScore: 92,
    todayTask: 'Inspect seedling emergence & verify irrigation zone baseline',
    nextTask: 'Nutrient application in 2 days',
    nextTaskInDays: 2,
    status: 'active',
    tasks: initialTasks,
    images: [],
  });
}

export async function completeCropTask(cropId: string, taskId: string) {
  hardwareService.completeCropTask(cropId, taskId);
  return { success: true };
}

export async function captureCropImage(cropId: string, notes?: string) {
  const crop = hardwareService.crops.find(c => c.id === cropId);
  if (!crop) throw new Error('Crop not found');

  const newImg = {
    id: `img_${Date.now()}`,
    cropId,
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=300&q=80',
    captureDate: new Date().toISOString(),
    dayNumber: crop.currentDay,
    growthStage: crop.growthStage,
    engineeringHealthScore: crop.healthScore,
    leafGreennessIndex: 0.82,
    illuminationLux: hardwareService.environment.lightLux,
    notes: notes || 'Manual capture triggered from Crop Manager interface',
  };

  crop.images = [newImg, ...(crop.images || [])];
  hardwareService.addEvent({
    eventType: 'CAMERA_ONLINE',
    nodeId: 'N07',
    severity: 'info',
    description: `N07 Crop Camera captured growth image for ${crop.name}`,
  });
  return newImg;
}
