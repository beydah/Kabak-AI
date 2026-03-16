import React, { useState } from 'react';
import { RotateCcw, Trash2, ChevronLeft, ChevronRight, AlertCircle, XCircle } from 'lucide-react';
import { I_Product_Data, F_Update_Product_Status, F_Delete_Product_By_Id } from '../../utils/storage_utils';
import { useJobManager } from '../../context/JobContext';
import { F_Get_Text } from '../../utils/i18n_utils';

export interface Product_Card_Props {
    p_product: I_Product_Data;
    p_navigate: (path: string) => void;
    p_on_download: (e: React.MouseEvent, product: I_Product_Data) => void;
    p_on_refresh: () => void;
}

export const F_Product_Card: React.FC<Product_Card_Props> = ({ p_product, p_navigate, p_on_download, p_on_refresh }) => {
    // Default to 'model' view if generated image exists, otherwise 'front'
    // State for image switcher
    // We only need front/back if we treat "Model" as the new "Front"
    const [current_view, set_current_view] = useState<'front' | 'back'>('front');
    const [show_delete_confirm, set_show_delete_confirm] = useState(false);
    const { cancel_job } = useJobManager();

    const has_back_image = !!p_product.raw_back;
    const is_running = p_product.status === 'running';
    const is_exited = p_product.status === 'exited';

    const F_Toggle_View = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (has_back_image) {
            set_current_view(prev => prev === 'front' ? 'back' : 'front');
        }
    };

    // ... (Handlers unchanged) ...

    const F_Handle_Retry = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await F_Update_Product_Status(p_product.product_id, 'running', undefined);
        p_on_refresh();
    };

    const F_Request_Delete = (e: React.MouseEvent) => {
        e.stopPropagation();
        set_show_delete_confirm(true);
    };

    const F_Confirm_Delete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await F_Delete_Product_By_Id(p_product.product_id);
        set_show_delete_confirm(false);
        p_on_refresh();
    };

    const F_Cancel_Delete = (e: React.MouseEvent) => {
        e.stopPropagation();
        set_show_delete_confirm(false);
    };

    // Granular Status Helpers
    const is_seo_updating = p_product.seo_status === 'updating' || p_product.seo_status === 'pending';
    const is_front_updating = p_product.front_status === 'updating' || p_product.front_status === 'pending' || p_product.front_status === 'generating_again';
    const is_back_updating = p_product.back_status === 'updating' || p_product.back_status === 'pending' || p_product.back_status === 'generating_again';
    const is_video_updating = p_product.video_status === 'generating' || p_product.video_status === 'pending' || p_product.video_status === 'updating';

    // Display Logic: 
    // If View is Front AND Generated Image exists -> Show Generated (Priority 1)
    // Else -> Show Raw Front (Priority 2)
    const display_front = p_product.model_front || p_product.raw_front;
    const display_back = p_product.model_back || p_product.raw_back;
    const display_image = current_view === 'front' ? display_front : display_back;

    return (
        <>
            <div
                onClick={() => !is_exited && !is_running && p_navigate(`/product/${p_product.product_id}`)}
                className={`
                    bg-white dark:bg-bg-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-secondary/20 group relative
                    ${(is_running || is_exited) ? '' : ''} 
                `}
            >
                {/* Image Container */}
                <div className={`aspect-[3/4] bg-secondary/10 relative overflow-hidden`}>

                    {/* Front View (Raw or AI Model) */}
                    <img
                        src={display_image}
                        alt="front"
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110 
                            ${current_view === 'front' ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                            ${(is_front_updating && current_view === 'front') ? 'opacity-50 grayscale blur-md scale-105' : ''} 
                            ${(is_exited) ? 'blur-sm grayscale' : ''}
                        `}
                    />

                    {/* Back Image (if exists) */}
                    {has_back_image && (
                        <img
                            src={display_back}
                            alt="back"
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110 
                                ${current_view === 'back' ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                                ${(is_back_updating && current_view === 'back') ? 'animate-breathe opacity-90 blur-[2px]' : ''} 
                                ${(is_exited) ? 'blur-sm grayscale' : ''}
                            `}
                        />
                    )}

                    {/* Video Player (Veo 3.1) */}
                    {p_product.model_video && !is_video_updating && (
                        <video
                            src={p_product.model_video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className={`absolute inset-0 w-full h-full object-cover z-20 
                                ${current_view === 'front' ? 'opacity-100' : 'opacity-0'} 
                                pointer-events-none group-hover:pointer-events-auto
                            `}
                        />
                    )}

                    {/* RUNNING STATE - New Animation (Gray Blur + Floating Orb) */}
                    {is_running && (
                        <div className="absolute inset-0 z-20 pointer-events-auto flex items-center justify-center overflow-hidden">

                            {/* Floating Pink-Orange Orb */}
                            <div className="absolute w-40 h-40 bg-gradient-to-br from-pink-500/60 to-orange-500/60 rounded-full blur-3xl animate-float-random opacity-80 pointer-events-none mix-blend-screen" />

                            {/* CANCEL BUTTON (Top Right) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(F_Get_Text('product.confirm_cancel'))) {
                                        cancel_job(p_product.product_id);
                                    }
                                }}
                                className="absolute top-2 right-2 z-30 text-white/60 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-black/20"
                                title={F_Get_Text('product.cancel_job')}
                            >
                                <XCircle size={22} />
                            </button>

                            {/* Granular Status Text Overlay */}
                            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-30">
                                <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs rounded-full shadow-lg border border-white/10">
                                    {is_seo_updating ? F_Get_Text('product.status.writing_copy') :
                                        is_front_updating ? F_Get_Text('product.status.gen_front') :
                                            is_back_updating ? F_Get_Text('product.status.gen_back') :
                                                is_video_updating ? F_Get_Text('product.status.filming') : F_Get_Text('product.status.processing')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* EXITED (ERROR) STATE - Centered Buttons over Blurred Image */}
                    {is_exited && (
                        <div className="absolute inset-0 flex items-center justify-center gap-3 z-50 pointer-events-auto">
                            <button
                                onClick={F_Handle_Retry}
                                className="p-3 bg-white/90 hover:bg-white text-black rounded-full transition-all shadow-xl hover:scale-105"
                                title={F_Get_Text('product.retry_gen')}
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={F_Request_Delete}
                                className="p-3 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all shadow-xl hover:scale-105"
                                title={F_Get_Text('product.delete_product')}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )}

                    {/* NORMAL STATE (Buttons & Toggle) */}
                    {!is_running && !is_exited && (
                        <>
                            {/* View Navigation (Left/Right) */}
                            {has_back_image && (
                                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-2 transition-opacity duration-300">
                                    <button
                                        onClick={F_Toggle_View}
                                        className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full pointer-events-auto transition-transform hover:scale-110"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={F_Toggle_View}
                                        className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full pointer-events-auto transition-transform hover:scale-110"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 relative">
                    <p className="font-medium text-text-light dark:text-text-dark truncate">
                        {is_seo_updating ? F_Get_Text('product.status.writing_opt') : (p_product.product_title || `ID: ${(p_product.product_id || "").substring(0, 8)}...`)}
                    </p>
                    <p className="text-sm text-secondary truncate mt-1">
                        {is_seo_updating ? F_Get_Text('product.status.analyzing') : (p_product.product_desc || p_product.raw_desc || F_Get_Text('common.no_desc')).substring(0, 80)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-secondary/60">
                            {p_product.created_at ? new Date(p_product.created_at).toLocaleDateString() : F_Get_Text('common.just_now')}
                        </p>
                    </div>
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {show_delete_confirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={F_Cancel_Delete}>
                    <div className="bg-white dark:bg-bg-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">
                                {F_Get_Text('product.confirm_delete_title')}
                            </h3>
                            <p className="text-sm text-secondary mb-6">
                                {F_Get_Text('product.confirm_delete_message')}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={F_Cancel_Delete}
                                    className="flex-1 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-text-light dark:text-text-dark rounded-lg text-sm font-medium transition-colors"
                                >
                                    {F_Get_Text('product.cancel')}
                                </button>
                                <button
                                    onClick={F_Confirm_Delete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    {F_Get_Text('product.delete_confirm_button')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};




