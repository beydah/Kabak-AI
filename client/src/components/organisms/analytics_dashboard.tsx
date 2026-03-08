import React, { useEffect, useState } from 'react';
import { Info, AlertTriangle, Trash2, RefreshCw, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { F_Get_All_Metrics, I_Metric, F_Subscribe_To_Updates, F_Get_Preference, F_Set_Preference, F_Reset_Model_Usage, F_Clear_All_Stats } from '../../utils/storage_utils';
import { F_Get_Exchange_Rate, F_Convert_Currency } from '../../services/currency_service';
import { F_Text } from '../atoms/text';
import { F_Get_Text } from '../../utils/i18n_utils';
import { F_Confirmation_Modal } from '../molecules/confirmation_modal';

const MODEL_INFO: Record<string, { rpd: number; desc_key: string; label: string; color: string }> = {
    'gemini-2.0-flash': {
        rpd: 1500,
        desc_key: 'analytics.model_desc.gemini_20_flash',
        label: 'Gemini 2.0 Flash',
        color: 'from-blue-500 to-cyan-400'
    },
    'gemini-2.5-flash': {
        rpd: 1500,
        desc_key: 'analytics.model_desc.gemini_25_flash',
        label: 'Gemini 2.5 Flash',
        color: 'from-emerald-500 to-teal-400'
    },
    'models/gemini-3-pro-image-preview': {
        rpd: 50,
        desc_key: 'analytics.model_desc.gemini_3_pro_image',
        label: 'Gemini 3 Pro Image',
        color: 'from-amber-500 to-orange-500'
    },
    'veo-3.1-generate-preview': {
        rpd: 10,
        desc_key: 'analytics.model_desc.veo_31',
        label: 'Veo 3.1 Preview',
        color: 'from-red-500 to-rose-500'
    },
    'veo-3.0-generate-001': {
        rpd: 10,
        desc_key: 'analytics.model_desc.veo_30',
        label: 'Veo 3.0',
        color: 'from-red-500 to-pink-500'
    }
};

export const F_Analytics_Dashboard: React.FC = () => {
    const [metrics, set_metrics] = useState<I_Metric[]>([]);
    const [view_mode, set_view_mode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [currency, set_currency] = useState<'USD' | 'TRY'>('USD');
    const [exchange_rate, set_exchange_rate] = useState<number>(35);

    // Modal State
    const [reset_target, set_reset_target] = useState<string | 'all' | null>(null);
    const [active_model_id, set_active_model_id] = useState<string | null>(null); // New Active State

    useEffect(() => {
        // Task 5: Auto-Migration & Legacy Cleanup
        try {
            if (localStorage.getItem('kabak_ai_usage_stats')) {
                localStorage.removeItem('kabak_ai_usage_stats');
            }
        } catch (e) {
            console.error("Auto-migration failed", e);
        }

        F_Load_Metrics();
        F_Init_Currency();
        const unsubscribe = F_Subscribe_To_Updates(F_Load_Metrics);
        return () => unsubscribe();
    }, []);

    const F_Init_Currency = async () => {
        const pref = F_Get_Preference('app_currency');
        if (pref === 'TRY') set_currency('TRY');
        const rate = await F_Get_Exchange_Rate();
        set_exchange_rate(rate);
    };

    const F_Toggle_Currency = (e: React.MouseEvent) => {
        e.stopPropagation();
        const new_curr = currency === 'USD' ? 'TRY' : 'USD';
        set_currency(new_curr);
        F_Set_Preference('app_currency', new_curr);
    };

    const F_Load_Metrics = async () => {
        const data = await F_Get_All_Metrics();
        set_metrics(data);
    };

    const F_Handle_Reset = async () => {
        if (!reset_target) return;

        if (reset_target === 'all') {
            await F_Clear_All_Stats();
        } else {
            await F_Reset_Model_Usage(reset_target);
        }

        await F_Load_Metrics(); // Refresh UI
        set_reset_target(null);
        set_active_model_id(null);
    };

    const F_Get_Filtered_Data = (metric: I_Metric) => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const today_str = new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

        // 1. Get Today's RPD usage (Always needed for the progress bar limit)
        const today_entry = metric.usage_history.find(h => h.date === today_str);
        const rpd_count = today_entry ? today_entry.count : 0;

        // 2. Get View Stats
        let view_count = 0;
        let view_cost = 0;

        if (view_mode === 'daily') {
            view_count = rpd_count;
            view_cost = today_entry ? today_entry.cost : 0;
        } else {
            const days = view_mode === 'weekly' ? 7 : 30;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            metric.usage_history.forEach(h => {
                if (new Date(h.date) >= cutoff) {
                    view_count += h.count;
                    view_cost += h.cost;
                }
            });
        }

        return { count: view_count, cost: view_cost, rpd_count };
    };

    return (
        <div className="mt-16 relative" onClick={() => set_active_model_id(null)}>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <BarChart3 size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-text-light dark:text-white">
                            {F_Get_Text('analytics.title')}
                        </h2>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm" onClick={(e) => e.stopPropagation()}>
                    {/* Currency Toggle */}
                    <button
                        onClick={F_Toggle_Currency}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-bg-dark border border-secondary/10 text-primary shadow-sm hover:border-primary/30 transition-all uppercase flex items-center gap-1.5"
                    >
                        {currency === 'TRY' ? <span className="text-sm">₺</span> : <DollarSign size={12} />}
                        {currency}
                    </button>

                    <div className="w-px h-6 bg-secondary/20"></div>

                    {/* View Mode Tabs */}
                    <div className="flex bg-secondary/10 p-1 rounded-xl">
                        {['daily', 'weekly', 'monthly'].map((m) => (
                            <button
                                key={m}
                                onClick={() => set_view_mode(m as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view_mode === m
                                    ? 'bg-white dark:bg-bg-dark text-primary shadow-sm'
                                    : 'text-secondary hover:text-text-light dark:hover:text-text-dark'
                                    } capitalize`}
                            >
                                {F_Get_Text(`analytics.view_${m}`)}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-secondary/20"></div>

                    {/* Reset Button */}
                    <button
                        onClick={() => set_reset_target('all')}
                        className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title={F_Get_Text('analytics.reset_all')}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {metrics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-secondary/5 backdrop-blur-sm rounded-3xl border border-dashed border-secondary/20">
                    <div className="p-4 bg-secondary/10 rounded-full mb-4 text-secondary animate-pulse">
                        <AlertTriangle size={32} />
                    </div>
                    <p className="text-secondary font-medium text-lg">{F_Get_Text('analytics.empty_state')}</p>
                    <p className="text-sm text-secondary/60 mt-2">{F_Get_Text('analytics.empty_state_subtitle')}</p>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map((m) => {
                    const info = MODEL_INFO[m.model_id] || {
                        rpd: 100,
                        desc_key: 'analytics.model_desc.unknown',
                        label: m.model_id,
                        color: 'from-gray-500 to-gray-400'
                    };

                    const data = F_Get_Filtered_Data(m);
                    const usage_percent = Math.min((data.rpd_count / info.rpd) * 100, 100);
                    const is_active = active_model_id === m.model_id;

                    return (
                        <div
                            key={m.model_id}
                            onClick={(e) => {
                                e.stopPropagation();
                                set_active_model_id(is_active ? null : m.model_id);
                            }}
                            className={`group relative bg-white dark:bg-[#0A0A0A]/60 backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 cursor-pointer ${is_active
                                ? 'border-primary/50 shadow-2xl -translate-y-1 ring-1 ring-primary/30'
                                : 'border-white/20 dark:border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-1'
                                }`}
                        >
                            {/* Colorful Gradient Border Top */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${info.color} rounded-t-3xl opacity-80`}></div>

                            {/* Card Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-text-light dark:text-white tracking-tight">
                                                {info.label}
                                            </h3>
                                            <div className="group/tooltip relative">
                                                <Info size={14} className="text-secondary/60 hover:text-primary transition-colors cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
                                                    {F_Get_Text(info.desc_key)}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] uppercase tracking-wider text-secondary/60 font-medium font-mono truncate max-w-[150px]">
                                            {m.model_id}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-text-light to-secondary dark:from-white dark:to-white/60">
                                            {data.count}
                                        </div>
                                        <div className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">
                                            {F_Get_Text('analytics.total_requests')}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="bg-secondary/5 dark:bg-white/5 rounded-2xl p-4 mb-4 border border-secondary/5">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-secondary mb-0.5">{F_Get_Text('analytics.requests_per_day')}</span>
                                            <span className={`text-sm font-bold ${usage_percent >= 80 ? 'text-red-500' : 'text-text-light dark:text-white'}`}>
                                                {usage_percent.toFixed(1)}% <span className="text-secondary/40 font-normal">/ 100%</span>
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono text-secondary">
                                            {data.rpd_count} <span className="opacity-40">/ {info.rpd.toLocaleString()}</span>
                                        </span>
                                    </div>

                                    <div className="h-1.5 w-full bg-secondary/10 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${info.color}`}
                                            style={{ width: `${usage_percent}%` }}
                                        />
                                    </div>

                                    {usage_percent >= 100 && (
                                        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-red-500 font-bold animate-pulse">
                                            <AlertTriangle size={10} />
                                            {F_Get_Text('analytics.limit_reached')}
                                        </div>
                                    )}
                                </div>

                                {/* Footer (Cost & Delete) */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${info.color} bg-opacity-10 text-white shadow-sm`}>
                                            <TrendingUp size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-secondary font-medium uppercase">{F_Get_Text('analytics.estimated_cost')}</span>
                                            <span className="font-mono text-sm font-bold text-text-light dark:text-white">
                                                {F_Convert_Currency(data.cost, exchange_rate, currency)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); set_reset_target(m.model_id); }}
                                        className="p-2 text-secondary/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title={F_Get_Text('analytics.delete_model')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Modal */}
            <F_Confirmation_Modal
                p_is_open={!!reset_target}
                p_title={F_Get_Text('analytics.confirm_reset_title')}
                p_message={F_Get_Text('analytics.confirm_reset_message')}
                p_on_confirm={F_Handle_Reset}
                p_on_close={() => set_reset_target(null)}
                p_confirm_label={F_Get_Text('common.yes')}
                p_cancel_label={F_Get_Text('common.no')}
            />
        </div>
    );
};
