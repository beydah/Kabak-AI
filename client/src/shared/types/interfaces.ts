export type ProductStatus = 'draft' | 'running' | 'finished' | 'exited' | 'failed';

export interface I_Product_Data {
    product_id: string; // Unique UUID

    // Images (Base64/Blob)
    raw_front: string;
    raw_back: string;
    model_front?: string; // AI Generated result
    model_back?: string;  // Placeholder
    model_video?: string; // Placeholder

    // AI Content
    product_title?: string;
    product_desc?: string;

    // Multimodal Analysis
    front_analyse?: string;
    back_analyse?: string;
    language_pref?: string;

    // Attributes
    gender: boolean; // true = Female, false = Male (Assumption based on fashion default)
    age: string;     // User input
    vücut_tipi: string; // body_type
    kesim: string;      // fit
    background: string;
    aksesuar: string;   // accessory

    raw_desc: string; // Original user input text

    // Metadata
    update_at: number;
    created_at: number; // Keeping for sort
    status: ProductStatus;
    retry_count?: number;
    error_log?: string;

    // Smart Sync Statuses
    analysis_status?: 'pending' | 'updating' | 'completed' | 'failed'; // New Phase 2
    seo_status?: 'pending' | 'updating' | 'completed' | 'failed';
    front_status?: 'pending' | 'updating' | 'completed' | 'failed' | 'generating_again';
    back_status?: 'pending' | 'updating' | 'completed' | 'failed' | 'generating_again';
    video_status?: 'not_generate' | 'generating' | 'generated' | 'error' | 'pending' | 'updating' | 'completed' | 'failed';
}

export interface I_Error_Log {
    id: string;
    product_id?: string;
    message: string;
    timestamp: number;
}

export interface I_Metric {
    model_id: string; // e.g. "gemini-3-pro"
    total_requests: number;
    total_cost: number;
    usage_history: { date: string; count: number; cost: number }[]; // For daily/weekly views
    last_updated: number;
}

export enum Accessory {
    NONE = 'Yok',
    SUNGLASSES = 'Güneş Gözlüğü',
    BAG = 'Çanta',
    HAT = 'Şapka',
    WATCH = 'Saat',
    JEWELRY = 'Takı',
    GLASSES = 'glasses', // Added for compatibility
    WALLET = 'wallet', // Added for compatibility
    CAR_KEY = 'car_key' // Added for compatibility
}

export enum BgOption {
    STUDIO = 'Stüdyo',
    URBAN = 'Şehir',
    LUXURY_CAFE = 'Lüks Kafe',
    ORANGE = 'Turuncu',
    BLACK = 'Siyah',
    MINIMALIST = 'Minimalist',
    WHITE = 'Beyaz' // Added
}

export interface ProductInput {
    gender: 'Erkek' | 'Kadın';
    age: string;
    fit: string; // Vücut tipi
    productFit: string; // Kesim
    backgroundColor: BgOption;
    accessory: Accessory;
    raw_desc?: string; // Original user input
    frontImage: string; // Base64
    backImage: string; // Base64
    seo_context?: string; // High-Fidelity Context
}

export interface ApiLog {
    id: string;
    timestamp: number;
    task: 'image' | 'text' | 'video' | 'verify';
    method: string;
    status: 'success' | 'error';
    message: string;
    details?: any;
}
