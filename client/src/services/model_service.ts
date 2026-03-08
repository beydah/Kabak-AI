
import { F_Track_Usage } from '../utils/storage_utils';

export type ModelTask = 'text' | 'image' | 'video';

export interface AIModel {
    name: string;
    type: ModelTask;
    isFallback: boolean;
}

// HARD-CODED SINGLE SOURCE OF TRUTH
export const PRIMARY_MODEL = 'gemini-2.0-flash';

export const TEXT_MODELS: AIModel[] = [{ name: PRIMARY_MODEL, type: 'text', isFallback: false }];
export const VISUAL_MODELS: AIModel[] = [{ name: PRIMARY_MODEL, type: 'image', isFallback: false }];
export const VIDEO_MODELS: AIModel[] = [];

const COST_MAP: Record<string, number> = {
    'gemini-2.0-flash': 0.0001,
    'gemini-2.5-flash': 0.0001,
    'gemini-1.5-pro': 0.001,
    'models/gemini-3-pro-image-preview': 0.002, // Estimated
    'veo-3.0-generate-001': 0.05
};

export class ModelService {
    private static instance: ModelService;

    private constructor() { }

    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    public async executeWithFailover<T>(
        task: ModelTask,
        operation: (model: AIModel) => Promise<T>,
        modelName?: string // New optional parameter for accurate tracking
    ): Promise<T> {
        const model: AIModel = { name: modelName || PRIMARY_MODEL, type: task, isFallback: false };

        try {
            console.log(`[ModelService] Executing ${task} (Model: ${model.name})`);
            const result = await operation(model);

            // ACCURATE TRACKING
            // Use the passed modelName if available, otherwise default logic
            let trackedModel = modelName;

            if (!trackedModel) {
                // Fallback Logic (Legacy)
                trackedModel = 'gemini-2.5-flash';
                if (task === 'image') trackedModel = 'models/gemini-3-pro-image-preview';
            }

            // Track usage with specific model name and its cost
            F_Track_Usage(trackedModel, COST_MAP[trackedModel] || 0.0001).catch(console.error);

            return result;
        } catch (error: any) {
            console.error(`[ModelService] Failed:`, error);
            throw error;
        }
    }

    private getModelsForTask(task: ModelTask): AIModel[] {
        return [{ name: PRIMARY_MODEL, type: task, isFallback: false }];
    }
}

