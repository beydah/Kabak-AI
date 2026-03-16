import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { F_Get_Text } from '@/shared/utils/i18n_utils';
import { F_Combobox } from '@/shared/ui/atoms/combobox';

export interface I_Filter_State {
    search: string;
    gender: 'all' | 'female' | 'male';
    status: 'all' | 'finished' | 'running' | 'exited';
    age_range: 'all' | '10-20' | '20-30' | '30-40' | '40-50';
    sort: 'newest' | 'oldest';
}

interface Filter_Bar_Props {
    p_on_filter_change: (filters: I_Filter_State) => void;
}

export const F_Filter_Bar: React.FC<Filter_Bar_Props> = ({ p_on_filter_change }) => {
    const [filters, set_filters] = useState<I_Filter_State>({
        search: '',
        gender: 'all',
        status: 'all',
        age_range: 'all',
        sort: 'newest'
    });

    const [is_expanded, set_is_expanded] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            p_on_filter_change(filters);
        }, 300); // Debounce search
        return () => clearTimeout(timeout);
    }, [filters, p_on_filter_change]);

    const F_Update = (key: keyof I_Filter_State, value: string) => {
        set_filters(prev => ({ ...prev, [key]: value }));
    };

    const F_Clear = () => {
        set_filters({
            search: '',
            gender: 'all',
            status: 'all',
            age_range: 'all',
            sort: 'newest'
        });
    };

    const has_active_filters = filters.gender !== 'all' || filters.status !== 'all' || filters.age_range !== 'all' || filters.search !== '';

    return (
        <div className="bg-white dark:bg-bg-dark rounded-xl border border-secondary/20 shadow-sm p-4 mb-6 transition-all relative z-[200] overflow-visible">
            {/* Top Row: Search & Toggle */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => F_Update('search', e.target.value)}
                        placeholder={F_Get_Text('common.search_placeholder') || "Search products..."}
                        className="w-full pl-10 pr-4 py-2 bg-secondary/5 border border-secondary/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                    />
                    {filters.search && (
                        <button
                            onClick={() => F_Update('search', '')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => set_is_expanded(!is_expanded)}
                    className={`p-2 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${is_expanded || has_active_filters
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-secondary/20 text-secondary hover:border-secondary/40'
                        }`}
                >
                    <Filter size={18} />
                    <span className="hidden sm:inline">{F_Get_Text('filters.toggle')}</span>
                    {has_active_filters && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                </button>
            </div>

            {/* Expanded Filters */}
            {is_expanded && (
                <div className="mt-4 pt-4 border-t border-secondary/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in relative z-[220] overflow-visible">

                    {/* Gender */}
                    <F_Combobox
                        label={F_Get_Text('filters.gender.label')}
                        value={filters.gender}
                        onChange={(val) => F_Update('gender', val)}
                        options={[
                            { label: F_Get_Text('filters.gender.all'), value: 'all' },
                            { label: F_Get_Text('new_product.options.gender.female'), value: 'female' },
                            { label: F_Get_Text('new_product.options.gender.male'), value: 'male' }
                        ]}
                    />

                    {/* Age Range */}
                    <F_Combobox
                        label={F_Get_Text('filters.age_range.label')}
                        value={filters.age_range}
                        onChange={(val) => F_Update('age_range', val)}
                        options={[
                            { label: F_Get_Text('filters.age_range.all'), value: 'all' },
                            { label: "10 - 20", value: "10-20" },
                            { label: "20 - 30", value: "20-30" },
                            { label: "30 - 40", value: "30-40" },
                            { label: "40 - 50", value: "40-50" }
                        ]}
                    />

                    {/* Status */}
                    <F_Combobox
                        label={F_Get_Text('filters.status.label')}
                        value={filters.status}
                        onChange={(val) => F_Update('status', val)}
                        options={[
                            { label: F_Get_Text('filters.status.all'), value: 'all' },
                            { label: F_Get_Text('filters.status.finished'), value: 'finished' },
                            { label: F_Get_Text('filters.status.running'), value: 'running' },
                            { label: F_Get_Text('filters.status.exited'), value: 'exited' }
                        ]}
                    />

                    {/* Sort */}
                    <F_Combobox
                        label={F_Get_Text('filters.sort.label')}
                        value={filters.sort}
                        onChange={(val) => F_Update('sort', val)}
                        options={[
                            { label: F_Get_Text('filters.sort.newest'), value: 'newest' },
                            { label: F_Get_Text('filters.sort.oldest'), value: 'oldest' }
                        ]}
                    />

                    {/* Clear Button */}
                    <div className="flex items-end">
                        <button
                            onClick={F_Clear}
                            className="w-full py-2 text-sm text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                        >
                            {F_Get_Text('filters.clear')}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

