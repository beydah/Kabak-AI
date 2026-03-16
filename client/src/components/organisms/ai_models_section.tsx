import React, { useEffect, useState } from 'react';
import { F_Text } from '../atoms/text';
import { F_Get_Text } from '../../utils/i18n_utils';
import { F_Get_Models, F_Increment_Usage, F_Decrement_Usage, F_Check_Daily_Reset, I_Model_Config } from '../../utils/model_utils';
import { F_Get_Preference, F_Set_Preference } from '../../utils/storage_utils';
import { F_Get_Exchange_Rate, F_Convert_Currency } from '../../services/currency_service';
import { RotateCcw, Plus, Minus, Package, BrainCircuit, ImageIcon, Film, Info, DollarSign } from 'lucide-react';

const CATEGORY_ORDER = ['Text Generation', 'Image', 'Video'] as const;

const F_Get_Category_Text_Key = (category: string) => {
    if (category === 'Text Generation') return 'ai_models.categories.text';
    if (category === 'Image') return 'ai_models.categories.image';
    if (category === 'Video') return 'ai_models.categories.video';
    return 'ai_models.categories.other';
};

const F_Get_Model_Detail_Key = (model_id: string) => {
    const key_map: Record<string, string> = {
        'gemini-2.0-flash': 'ai_models.model_details.gemini_20_flash',
        'gemini-2.5-flash': 'ai_models.model_details.gemini_25_flash',
        'models/gemini-3-pro-image-preview': 'ai_models.model_details.gemini_3_pro_image',
        'models/imagen-4.0-fast-generate-001': 'ai_models.model_details.imagen_4_fast',
        'veo-3.1-generate-preview': 'ai_models.model_details.veo_31',
        'veo-3.0-generate-001': 'ai_models.model_details.veo_30'
    };

    return key_map[model_id] || 'ai_models.model_details.unknown';
};

const F_Get_Category_Icon = (category: string) => {
    if (category === 'Text Generation') return <BrainCircuit size={18} className="text-primary" />;
    if (category === 'Image') return <ImageIcon size={18} className="text-primary" />;
    if (category === 'Video') return <Film size={18} className="text-primary" />;
    return <Package size={18} className="text-primary" />;
};

export const F_AI_Models_Section: React.FC = () => {
    const [models, set_models] = useState<I_Model_Config[]>([]);
    const [grouped_models, set_grouped_models] = useState<Record<string, I_Model_Config[]>>({});
    const [bundle_count, set_bundle_count] = useState(0);
    const [currency, set_currency] = useState<'USD' | 'TRY'>('USD');
    const [exchange_rate, set_exchange_rate] = useState(35);

    useEffect(() => {
        F_Load_Data();
        void F_Init_Currency();
    }, []);

    const F_Init_Currency = async () => {
        const pref = F_Get_Preference('app_currency');
        if (pref === 'TRY') set_currency('TRY');
        const rate = await F_Get_Exchange_Rate();
        set_exchange_rate(rate);
    };

    const F_Toggle_Currency = () => {
        const next = currency === 'USD' ? 'TRY' : 'USD';
        set_currency(next);
        F_Set_Preference('app_currency', next);
    };

    const F_Load_Data = () => {
        const data = F_Get_Models();
        set_models(data);

        const groups: Record<string, I_Model_Config[]> = {};
        data.forEach((model) => {
            if (!groups[model.category]) groups[model.category] = [];
            groups[model.category].push(model);
        });
        set_grouped_models(groups);
    };

    const F_Reset_Usage = () => {
        F_Check_Daily_Reset(true);
        set_bundle_count(0);
        F_Load_Data();
    };

    const F_Increment_Category_Usage = (category: string, amount: number) => {
        const data = F_Get_Models();
        const category_models = data.filter((model) => model.category === category);
        const primary = category_models.find((model) => model.is_primary);
        const fallback = category_models.find((model) => !model.is_primary);

        if (!primary) return;

        let remaining = amount;

        const primary_capacity = Math.max(0, primary.daily_limit_rpd - primary.current_usage_today);
        const primary_alloc = Math.min(remaining, primary_capacity);

        if (primary_alloc > 0) {
            for (let i = 0; i < primary_alloc; i++) {
                F_Increment_Usage(primary.model_id);
            }
            remaining -= primary_alloc;
        }

        if (remaining > 0 && fallback) {
            for (let i = 0; i < remaining; i++) {
                F_Increment_Usage(fallback.model_id);
            }
        }
    };

    const F_Decrement_Category_Usage = (category: string, amount: number) => {
        const data = F_Get_Models();
        const category_models = data.filter((model) => model.category === category);
        const primary = category_models.find((model) => model.is_primary);
        const fallback = category_models.find((model) => !model.is_primary);

        if (!primary) return;

        let remaining = amount;

        if (fallback && remaining > 0) {
            const fallback_remove = Math.min(remaining, fallback.current_usage_today);
            if (fallback_remove > 0) {
                F_Decrement_Usage(fallback.model_id, fallback_remove);
                remaining -= fallback_remove;
            }
        }

        if (remaining > 0) {
            const primary_remove = Math.min(remaining, primary.current_usage_today);
            if (primary_remove > 0) {
                F_Decrement_Usage(primary.model_id, primary_remove);
            }
        }
    };

    const F_Handle_Bundle_Change = (delta: number) => {
        if (delta > 0) {
            if (bundle_count >= 20) return;

            set_bundle_count((prev) => prev + 1);
            F_Increment_Category_Usage('Text Generation', 1);
            F_Increment_Category_Usage('Image', 4);
            F_Increment_Category_Usage('Video', 1);
        } else {
            if (bundle_count <= 0) return;

            set_bundle_count((prev) => prev - 1);
            F_Decrement_Category_Usage('Text Generation', 1);
            F_Decrement_Category_Usage('Image', 4);
            F_Decrement_Category_Usage('Video', 1);
        }

        F_Load_Data();
    };

    const total_cost = models.reduce((sum, model) => sum + (model.current_usage_today * (model.cost_per_request || 0)), 0);

    return (
        <section id="ai-models" className="py-20 bg-secondary/5">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-12">
                    <F_Text p_variant="h1" p_class_name="mb-4">
                        {F_Get_Text('ai_models.title')}
                    </F_Text>
                    <p className="text-secondary text-lg max-w-3xl mx-auto">
                        {F_Get_Text('ai_models.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-bg-dark rounded-2xl p-6 border border-secondary/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Package size={100} className="text-primary" />
                            </div>

                            <h3 className="text-xl font-bold mb-2 text-text-light dark:text-text-dark flex items-center gap-2">
                                <Package className="text-primary" />
                                {F_Get_Text('pricing.product_bundle')}
                            </h3>
                            <p className="text-sm text-secondary mb-6">
                                {F_Get_Text('pricing.bundle_desc')}
                            </p>

                            <div className="flex items-center justify-between bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                                <button
                                    onClick={() => F_Handle_Bundle_Change(-1)}
                                    disabled={bundle_count === 0}
                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white dark:bg-bg-dark border border-secondary/20 text-secondary hover:text-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    title={F_Get_Text('pricing.remove_product')}
                                >
                                    <Minus size={20} />
                                </button>

                                <div className="text-center">
                                    <span className="block text-3xl font-black text-text-light dark:text-text-dark">
                                        {bundle_count}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
                                        {F_Get_Text('pricing.bundles_subtext')}
                                    </span>
                                </div>

                                <button
                                    onClick={() => F_Handle_Bundle_Change(1)}
                                    disabled={bundle_count >= 20}
                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    title={F_Get_Text('pricing.add_product')}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-bg-dark rounded-2xl p-6 border border-secondary/20 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                                    {F_Get_Text('pricing.estimated_cost')}
                                </h3>
                                <button
                                    onClick={F_Toggle_Currency}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-bg-dark border border-secondary/10 text-primary shadow-sm hover:border-primary/30 transition-all uppercase flex items-center gap-1.5"
                                >
                                    {currency === 'TRY' ? <span className="text-sm">{'\u20BA'}</span> : <DollarSign size={12} />}
                                    {currency}
                                </button>
                            </div>

                            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 mb-4 text-center">
                                <span className="text-4xl font-black text-text-light dark:text-text-dark">
                                    {F_Convert_Currency(total_cost, exchange_rate, currency)}
                                </span>
                            </div>

                            <button
                                onClick={F_Reset_Usage}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary/10 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-sm font-medium text-secondary transition-colors"
                            >
                                <RotateCcw size={16} />
                                <span>{F_Get_Text('pricing.reset')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        {CATEGORY_ORDER.map((category) => {
                            const category_models = grouped_models[category] || [];
                            if (category_models.length === 0) return null;

                            return (
                                <div key={category} className="bg-white dark:bg-bg-dark rounded-2xl shadow-sm border border-secondary/20 overflow-hidden">
                                    <div className="px-6 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                                        <h3 className="font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                                            {F_Get_Category_Icon(category)}
                                            {F_Get_Text(F_Get_Category_Text_Key(category))}
                                        </h3>
                                    </div>

                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {category_models.map((model) => {
                                            const usage_percent = Math.min(100, (model.current_usage_today / model.daily_limit_rpd) * 100);
                                            const detail_key = F_Get_Model_Detail_Key(model.model_id);

                                            return (
                                                <div
                                                    key={`${category}-${model.model_id}`}
                                                    className={`relative rounded-xl border p-4 transition-all ${model.is_primary
                                                        ? 'border-primary/30 bg-primary/5'
                                                        : 'border-secondary/20 bg-transparent'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2 gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-sm text-text-light dark:text-text-dark break-all">
                                                                    {model.model_id}
                                                                </span>
                                                                {model.is_primary ? (
                                                                    <span className="text-[9px] font-bold uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                                                        {F_Get_Text('ai_models.status.primary')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold uppercase text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                                                        {F_Get_Text('ai_models.status.fallback')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-secondary mt-1 line-clamp-2">
                                                                {F_Get_Text(detail_key)}
                                                            </p>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <span className="block text-xs font-mono font-bold text-text-light dark:text-text-dark">
                                                                {model.current_usage_today.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] text-secondary">
                                                                / {model.daily_limit_rpd.toLocaleString()} {F_Get_Text('ai_models.rpd')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden mt-2">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${usage_percent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                                            style={{ width: `${usage_percent}%` }}
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-1 text-[10px] text-secondary">
                                                        <Info size={12} />
                                                        <span>{F_Get_Text('ai_models.usage_info')}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};
