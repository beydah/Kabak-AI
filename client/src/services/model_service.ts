import { F_Track_Usage } from '../utils/storage_utils';

export type ModelTask = 'text' | 'image' | 'video';

export interface AIModel {
    name: string;
    type: ModelTask;
    isFallback: boolean;
}

const PRIMARY_MODELS: Record<ModelTask, string> = {
    text: 'gemini-2.5-flash',
    image: 'models/gemini-3-pro-image-preview',
    video: 'veo-3.1-generate-preview'
};

export const PRIMARY_MODEL = PRIMARY_MODELS.text;

export const TEXT_MODELS: AIModel[] = [{ name: PRIMARY_MODELS.text, type: 'text', isFallback: false }];
export const VISUAL_MODELS: AIModel[] = [{ name: PRIMARY_MODELS.image, type: 'image', isFallback: false }];
export const VIDEO_MODELS: AIModel[] = [{ name: PRIMARY_MODELS.video, type: 'video', isFallback: false }];

const DEBUG_AI_LOGS = ((import.meta as any).env?.VITE_DEBUG_AI_LOGS === 'true');
const F_Debug_Log = (...args: any[]) => {
    if (DEBUG_AI_LOGS) console.log(...args);
};

const COST_MAP: Record<string, number> = {
    'gemini-2.0-flash': 0.0001,
    'gemini-2.5-flash': 0.0001,
    'models/gemini-3-pro-image-preview': 0.002,
    'veo-3.1-generate-preview': 0.05,
    'veo-3.0-generate-001': 0.05,
    'imagen-4.0-fast': 0.04
};

export class ModelService {
    private static instance: ModelService;

    private constructor() {}

    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    public async executeWithFailover<T>(
        task: ModelTask,
        operation: (model: AIModel) => Promise<T>,
        modelName?: string
    ): Promise<T> {
        const resolved_model_name = modelName || PRIMARY_MODELS[task];
        const model: AIModel = { name: resolved_model_name, type: task, isFallback: false };

        try {
            F_Debug_Log(`[ModelService] Executing ${task} (Model: ${model.name})`);
            const result = await operation(model);

            F_Track_Usage(resolved_model_name, COST_MAP[resolved_model_name] || 0.0001).catch(console.error);
            return result;
        } catch (error: any) {
            console.error('[ModelService] Failed:', error);
            throw error;
        }
    }
}
