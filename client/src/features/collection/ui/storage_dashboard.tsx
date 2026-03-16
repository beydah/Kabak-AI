import React, { useEffect, useState } from 'react';
import { DB_Service } from '@/shared/services/storage_service';
import { F_Format_Bytes } from '@/shared/utils/format_utils';
import { Database, HardDrive, Trash2, PieChart } from 'lucide-react';
import { F_Confirmation_Modal } from '@/shared/ui/molecules/confirmation_modal';
import { F_Get_Text } from '@/shared/utils/i18n_utils';

export const F_Storage_Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        products: 0,
        logs: 0,
        metrics: 0,
        drafts: 0,
        localStoragesize: 0,
        indexedDBSize: 0 // Estimated
    });
    const [loading, setLoading] = useState(false);
    const [confirm_target, set_confirm_target] = useState<'products' | 'logs' | 'metrics' | 'local' | 'drafts' | null>(null);

    // Rough Estimation of IndexedDB Size
    const estimateIDBSize = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return estimate.usage || 0;
        }
        return 0;
    };

    const refreshStats = async () => {
        setLoading(true);
        try {
            const products = await DB_Service.getAllProducts();
            const logs = await DB_Service.getAllLogs();
            const metrics = await DB_Service.getAllMetrics();
            const draft = await DB_Service.getDraft('kabak_ai_draft');

            // Calc LS size
            let lsSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    lsSize += (localStorage[key].length + key.length) * 2;
                }
            }

            const idbSize = await estimateIDBSize();

            setStats({
                products: products.length,
                logs: logs.length,
                metrics: metrics.length,
                drafts: draft ? 1 : 0,
                localStoragesize: lsSize,
                indexedDBSize: idbSize
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshStats();
    }, []);

    const F_Handle_Clear = async () => {
        if (!confirm_target) return;

        if (confirm_target === 'products') {
            const items = await DB_Service.getAllProducts();
            for (const i of items) await DB_Service.deleteProduct(i.product_id);
        } else if (confirm_target === 'logs') {
            await DB_Service.clearLogs();
        } else if (confirm_target === 'metrics') {
            await DB_Service.clearMetrics();
        } else if (confirm_target === 'drafts') {
            await DB_Service.clearDrafts();
        } else if (confirm_target === 'local') {
            localStorage.clear();
            window.location.reload();
            return;
        }

        await refreshStats();
        set_confirm_target(null);
    };

    // Calculate Percentages for Bar
    const total_storage = stats.indexedDBSize + stats.localStoragesize;
    // Just visual ratio, not true system capacity (which is huge)
    // Let's assume a visual "Quota" for the bar to look nice, e.g. 500MB?
    // Or just IDB vs Local vs Free? 
    // Let's just show IDB vs Local relative to each other if total is small, 
    // or relative to 1GB if large.
    const VISUAL_QUOTA = Math.max(total_storage * 1.2, 1024 * 1024 * 50); // Min 50MB for visual scale

    const idb_percent = (stats.indexedDBSize / VISUAL_QUOTA) * 100;
    const ls_percent = (stats.localStoragesize / VISUAL_QUOTA) * 100;

    return (
        <div className="bg-white dark:bg-bg-dark rounded-xl border border-secondary/20 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PieChart className="text-primary" size={20} />
                    <h3 className="font-bold text-lg text-text-light dark:text-text-dark">{F_Get_Text('storage.title')}</h3>
                </div>
                <button
                    onClick={refreshStats}
                    className={`p-1.5 rounded-full hover:bg-secondary/10 text-secondary transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <Database size={16} />
                </button>
            </div>

            <div className="p-6">
                {/* Graph Section */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                        <span>{F_Get_Text('storage.usage')}</span>
                        <span>{F_Format_Bytes(total_storage)} {F_Get_Text('storage.used')}</span>
                    </div>

                    {/* Multi-colored Progress Bar */}
                    <div className="h-4 w-full bg-secondary/10 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${idb_percent}%` }}
                            title={`${F_Get_Text('storage.idb')}: ${F_Format_Bytes(stats.indexedDBSize)}`}
                        />
                        <div
                            className="h-full bg-purple-500 transition-all duration-1000"
                            style={{ width: `${ls_percent}%` }}
                            title={`${F_Get_Text('storage.local')}: ${F_Format_Bytes(stats.localStoragesize)}`}
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-text-light dark:text-text-dark font-medium">{F_Get_Text('storage.idb')}</span>
                            <span className="text-secondary">({F_Format_Bytes(stats.indexedDBSize)})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-text-light dark:text-text-dark font-medium">{F_Get_Text('storage.local')}</span>
                            <span className="text-secondary">({F_Format_Bytes(stats.localStoragesize)})</span>
                        </div>
                    </div>
                </div>

                {/* Actions Grid (Opposite Alignment) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Left: IndexedDB Controls */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                            <Database size={12} /> {F_Get_Text('storage.items')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-between group hover:bg-secondary/10 transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-text-light dark:text-text-dark">{stats.products} {F_Get_Text('storage.products')}</div>
                                    <div className="text-[10px] text-secondary">{F_Get_Text('storage.products_desc')}</div>
                                </div>
                                <button
                                    onClick={() => set_confirm_target('products')}
                                    className="p-2 text-secondary hover:text-red-500 hover:bg-white dark:hover:bg-bg-dark rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title={F_Get_Text('storage.actions.clear')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-between group hover:bg-secondary/10 transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-text-light dark:text-text-dark">{stats.drafts} {F_Get_Text('storage.drafts')}</div>
                                    <div className="text-[10px] text-secondary">{F_Get_Text('storage.drafts_desc')}</div>
                                </div>
                                <button
                                    onClick={() => set_confirm_target('drafts')}
                                    className="p-2 text-secondary hover:text-red-500 hover:bg-white dark:hover:bg-bg-dark rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title={F_Get_Text('storage.actions.clear')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: LocalStorage Controls */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                            <HardDrive size={12} /> {F_Get_Text('storage.settings')}
                        </h4>
                        <div className="bg-purple-500/5 rounded-lg p-3 flex items-center justify-between group hover:bg-purple-500/10 transition-colors">
                            <div>
                                <div className="text-sm font-bold text-text-light dark:text-text-dark">{F_Get_Text('storage.app_settings')}</div>
                                <div className="text-[10px] text-secondary">{F_Get_Text('storage.app_settings_desc')}</div>
                            </div>
                            <button
                                onClick={() => set_confirm_target('local')}
                                className="p-2 text-secondary hover:text-red-500 hover:bg-white dark:hover:bg-bg-dark rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title={F_Get_Text('storage.actions.reset')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <F_Confirmation_Modal
                p_is_open={!!confirm_target}
                p_title={F_Get_Text('storage.clear_modal.title')}
                p_message={F_Get_Text('storage.clear_modal.message').replace('{target}', confirm_target || '')}
                p_on_confirm={F_Handle_Clear}
                p_on_close={() => set_confirm_target(null)}
                p_confirm_label={F_Get_Text('common.yes')}
                p_cancel_label={F_Get_Text('common.no')}
            />
        </div>
    );
};
export default F_Storage_Dashboard;
