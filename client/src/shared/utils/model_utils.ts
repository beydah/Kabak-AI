import modelsConfig from '../config/models.json';

export interface I_Model_Config {
    model_id: string;
    category: string;
    daily_limit_rpd: number;
    minute_limit_rpm: number;
    current_usage_today: number;
    is_primary: boolean;
    cost_per_request?: number;
}

// In-memory storage for simulation (Resets on refresh)
let SESSION_USAGE: Record<string, number> = {};

// Get base config combined with local usage data
export const F_Get_Models = (): I_Model_Config[] => {
    return modelsConfig.models.map(model => ({
        ...model,
        current_usage_today: SESSION_USAGE[model.model_id] || 0
    }));
};

// Check if 24h passed (Kept for compatibility if we switched back, but effectively no-op for session now)
export const F_Check_Daily_Reset = (force: boolean = false) => {
    if (force) {
        SESSION_USAGE = {};
    }
};

// Simulate usage increment
export const F_Increment_Usage = (p_model_id: string) => {
    const current = SESSION_USAGE[p_model_id] || 0;
    SESSION_USAGE[p_model_id] = current + 1;
};


export const F_Decrement_Usage = (p_model_id: string, p_amount = 1) => {
    const current = SESSION_USAGE[p_model_id] || 0;
    const next_value = Math.max(0, current - Math.max(1, p_amount));
    SESSION_USAGE[p_model_id] = next_value;
};
