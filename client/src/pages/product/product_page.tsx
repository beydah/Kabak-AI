import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Copy, Check, RotateCcw, Download, Video } from 'lucide-react';
import { F_Main_Template } from '../../components/templates/main_template';
import { F_Text } from '../../components/atoms/text';
import { F_Button } from '../../components/atoms/button';
import { F_Get_Text } from '../../utils/i18n_utils';
import { F_Get_Product_By_Id, F_Delete_Product_By_Id, I_Product_Data } from '../../utils/storage_utils';
import { F_Edit_Product_Modal } from '../../components/organisms/edit_product_modal';
import { F_Confirmation_Modal } from '../../components/molecules/confirmation_modal';
import { F_Generate_Video_Preview } from '../../services/gemini_service';

export const F_Product_Page: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, set_product] = useState<I_Product_Data | undefined>(undefined);
    const [video_url, set_video_url] = useState<string | null>(null);
    const [is_generating_video, set_is_generating_video] = useState(false);
    const [copied_field, set_copied_field] = useState<string | null>(null);

    // State for image switcher
    const [active_image, set_active_image] = useState<'model_front' | 'model_back' | 'video'>('model_front');

    // Modals
    const [is_edit_modal_open, set_is_edit_modal_open] = useState(false);
    const [is_delete_modal_open, set_is_delete_modal_open] = useState(false);

    useEffect(() => {
        F_Load_Product();
    }, [id]);

    // Cleanup Blob URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (video_url && video_url.startsWith('blob:')) {
                URL.revokeObjectURL(video_url);
            }
        };
    }, [video_url]);

    const F_Load_Product = async () => {
        if (id) {
            const data = await F_Get_Product_By_Id(id);
            if (data) {
                set_product(data);
                if (data.model_video) set_video_url(data.model_video);

                // Priority: Model Front > Video
                if (data.model_front && !data.model_video) set_active_image('model_front');
                else if (data.model_video) set_active_image('video'); // Auto-switch to video if exists
                else set_active_image('model_front'); // Default
            }
        }
    };

    const F_Get_Image_Order = (): ('model_front' | 'model_back' | 'video')[] => {
        const order: ('model_front' | 'model_back' | 'video')[] = [];
        if (product?.model_front) order.push('model_front');
        if (product?.model_back) order.push('model_back');
        order.push('video'); // Always add video slide
        return order;
    };

    const F_Next_Image = () => {
        const order = F_Get_Image_Order();
        if (order.length <= 1) return;

        const current_index = order.indexOf(active_image);
        const next_index = (current_index + 1) % order.length;
        set_active_image(order[next_index]);
    };

    const F_Prev_Image = () => {
        const order = F_Get_Image_Order();
        if (order.length <= 1) return;

        const current_index = order.indexOf(active_image);
        const prev_index = (current_index - 1 + order.length) % order.length;
        set_active_image(order[prev_index]);
    };

    const F_Handle_Download = () => {
        if (!product) return;
        const link = document.createElement('a');

        const downloadImage = (url: string, name: string) => {
            link.href = url;
            link.download = name;
            link.click();
        };

        // Context-Aware Download
        if (active_image === 'model_front' && product.model_front) {
            downloadImage(product.model_front, `model_front_${product.product_id}.jpg`);
        } else if (active_image === 'model_back' && product.model_back) {
            downloadImage(product.model_back, `model_back_${product.product_id}.jpg`);
        } else if (active_image === 'video' && video_url) {
            downloadImage(video_url, `video_${product.product_id}.mp4`);
        }
    };

    const F_Handle_Delete = async () => {
        if (id) {
            await F_Delete_Product_By_Id(id);
            navigate('/collection');
        }
    };

    const F_Handle_Generate_Video = async () => {
        if (!product) return;

        try {
            set_is_generating_video(true);
            const videoUrl = await F_Generate_Video_Preview(product);

            if (videoUrl) {
                set_video_url(videoUrl);
                set_active_image('video');
            } else {
                alert('Video generation failed: no video URI returned.');
            }
        } catch (error) {
            console.error('Video Generation Error:', error);
            const message = error instanceof Error ? error.message : F_Get_Text('common.error');
            alert(message);
        } finally {
            set_is_generating_video(false);
        }
    };

    const F_Copy_To_Clipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        set_copied_field(field);
        setTimeout(() => set_copied_field(null), 2000);
    };

    if (!product) {
        return (
            <F_Main_Template p_is_authenticated={true}>
                <div className="container mx-auto px-4 py-8 text-center">
                    <p className="text-secondary">{F_Get_Text('common.loading')}</p>
                </div>
            </F_Main_Template>
        );
    }

    const has_multiple_images = F_Get_Image_Order().length > 1;

    // Display Data
    const display_title = product.product_title || F_Get_Text('product.title');
    const display_desc = product.product_desc || product.raw_desc || 'No description provided.';

    return (
        <F_Main_Template p_is_authenticated={true}>
            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Back Link */}
                <button
                    onClick={() => navigate('/collection')}
                    className="text-primary hover:underline font-medium mb-6 flex items-center gap-2"
                >
                    {F_Get_Text('new_product.back_to_collection')}
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* LEFT COLUMN: Images */}
                    <div className="space-y-4">
                        {/* Main Image Container */}
                        <div className="aspect-[3/4] bg-white dark:bg-bg-dark rounded-xl shadow-sm border border-secondary/20 overflow-hidden relative group">

                            {/* RENDER ACTIVE MEDIA */}
                            {active_image === 'video' ? (
                                <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black">
                                    {video_url ? (
                                        <video
                                            src={video_url}
                                            controls
                                            autoPlay
                                            loop
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <>
                                            {/* Blurred Background (Front Image) */}
                                            <div
                                                className="absolute inset-0 bg-cover bg-center blur-md grayscale opacity-50 scale-110"
                                                style={{ backgroundImage: `url(${product.model_front || product.raw_front})` }}
                                            ></div>
                                            <div className="absolute inset-0 bg-black/20"></div>

                                            {/* Create Video Button */}
                                            <button
                                                className="relative z-10 flex flex-col items-center gap-4 group/btn transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={F_Handle_Generate_Video}
                                                disabled={is_generating_video}
                                            >
                                                <div className="p-5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl group-hover/btn:bg-white/20 transition-all ring-1 ring-white/10">
                                                    {is_generating_video ? (
                                                        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
                                                    ) : (
                                                        <Video size={40} className="text-white drop-shadow-md" />
                                                    )}
                                                </div>
                                                <div className="px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white font-bold text-sm tracking-wide shadow-lg uppercase">
                                                    {is_generating_video ? "Generating..." : F_Get_Text('product.create_video')}
                                                </div>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <img
                                    key={active_image} // Force re-render for animation
                                    src={active_image === 'model_front' ? product.model_front : (product.model_back || '')}
                                    alt="Main View"
                                    className="w-full h-full object-cover animate-fade-in transition-all duration-500"
                                />
                            )}

                            {/* Top-Left Actions (Retry & Download) - Hide on Video */}
                            {active_image !== 'video' && (
                                <div className="absolute top-4 left-4 flex gap-2 z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); F_Load_Product(); }}
                                        className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-lg transition-colors"
                                        title={F_Get_Text('common.retry')}
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); F_Handle_Download(); }}
                                        className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-lg transition-colors"
                                        title={F_Get_Text('product.download')}
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Navigation Arrows (Interactive Gallery) - ALWAYS VISIBLE & OPAQUE */}
                            {has_multiple_images && (
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 pointer-events-none z-30">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); F_Prev_Image(); }}
                                        className="p-3 bg-black/60 text-white rounded-full pointer-events-auto transition-transform hover:scale-110 shadow-lg"
                                        title={F_Get_Text('product.prev_image')}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); F_Next_Image(); }}
                                        className="p-3 bg-black/60 text-white rounded-full pointer-events-auto transition-transform hover:scale-110 shadow-lg"
                                        title={F_Get_Text('product.next_image')}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails Row */}
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {/* Model Front */}
                            {product.model_front && (
                                <button
                                    onClick={() => set_active_image('model_front')}
                                    className={`flex-shrink-0 w-24 h-32 rounded-lg border-2 overflow-hidden transition-all relative ${active_image === 'model_front'
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-transparent hover:border-secondary/30'
                                        }`}
                                >
                                    <img src={product.model_front} alt="Model Front" className="w-full h-full object-cover" />
                                </button>
                            )}

                            {/* Model Back */}
                            {product.model_back && (
                                <button
                                    onClick={() => set_active_image('model_back')}
                                    className={`flex-shrink-0 w-24 h-32 rounded-lg border-2 overflow-hidden transition-all relative ${active_image === 'model_back'
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-transparent hover:border-secondary/30'
                                        }`}
                                >
                                    <img src={product.model_back} alt="Model Back" className="w-full h-full object-cover" />
                                </button>
                            )}

                            {/* Video Placeholder Thumbnail */}
                            <button
                                onClick={() => set_active_image('video')}
                                className={`flex-shrink-0 w-24 h-32 rounded-lg border-2 overflow-hidden transition-all relative group flex items-center justify-center bg-gray-900 ${active_image === 'video'
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-transparent hover:border-secondary/30'
                                    }`}
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-50 blur-sm grayscale"
                                    style={{ backgroundImage: `url(${product.model_front || product.raw_front})` }}
                                ></div>
                                <Video size={24} className="text-white relative z-10" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Details & Actions */}
                    <div className="space-y-8">

                        {/* Title Section */}
                        <div className="border-b border-secondary/10 pb-6">
                            <div className="flex items-start justify-between gap-4">
                                <F_Text p_variant="h1" p_class_name="mb-2 leading-tight">
                                    {display_title}
                                </F_Text>
                                <button
                                    onClick={() => F_Copy_To_Clipboard(display_title, 'title')}
                                    className="p-2 text-secondary hover:text-primary transition-colors flex-shrink-0"
                                    title="Copy Title"
                                >
                                    {copied_field === 'title' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                </button>
                            </div>
                            <p className="text-secondary text-sm mt-1">ID: {product.product_id}</p>
                        </div>

                        {/* Description Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                                    {F_Get_Text('new_product.labels.description')}
                                </h3>
                                <button
                                    onClick={() => F_Copy_To_Clipboard(display_desc, 'desc')}
                                    className="p-1.5 text-secondary hover:text-primary transition-colors text-sm flex items-center gap-1.5"
                                    title="Copy Description"
                                >
                                    {copied_field === 'desc' ? (
                                        <>
                                            <Check size={16} className="text-green-500" />
                                            <span className="text-green-500 font-medium">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-secondary leading-relaxed whitespace-pre-line p-4 bg-secondary/5 rounded-lg border border-secondary/10 text-sm">
                                {display_desc}
                            </p>
                        </div>

                        {/* Attributes Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.gender')}</dt>
                                <dd className="font-medium capitalize text-text-light dark:text-text-dark">
                                    {F_Get_Text(`new_product.options.gender.${product.gender ? 'female' : 'male'}`)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.age')}</dt>
                                <dd className="font-medium text-text-light dark:text-text-dark">{product.age}</dd>
                            </div>
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.body_type')}</dt>
                                <dd className="font-medium capitalize text-text-light dark:text-text-dark">
                                    {product.vücut_tipi ? F_Get_Text(`new_product.options.body_type.${product.vücut_tipi}`) : product.vücut_tipi}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.fit')}</dt>
                                <dd className="font-medium capitalize text-text-light dark:text-text-dark">
                                    {product.kesim ? F_Get_Text(`new_product.options.fit.${product.kesim}`) : product.kesim}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.background')}</dt>
                                <dd className="font-medium capitalize text-text-light dark:text-text-dark">
                                    {product.background ? F_Get_Text(`new_product.options.background.${product.background}`) : product.background}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-secondary text-sm">{F_Get_Text('new_product.labels.accessory')}</dt>
                                <dd className="font-medium capitalize text-text-light dark:text-text-dark">
                                    {product.aksesuar ? F_Get_Text(`new_product.options.accessory.${product.aksesuar}`) : product.aksesuar}
                                </dd>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-6 border-t border-secondary/10">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => set_is_edit_modal_open(true)}
                                    className="p-3 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 hover:text-primary transition-colors tooltip-trigger"
                                    title={F_Get_Text('product.edit')}
                                >
                                    <Edit2 size={24} />
                                </button>
                                <button
                                    onClick={() => set_is_delete_modal_open(true)}
                                    className="p-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors tooltip-trigger"
                                    title={F_Get_Text('product.delete')}
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>

                            <F_Button
                                p_label={F_Get_Text('product.download')}
                                p_variant="primary"
                                p_class_name="flex-1 py-3 flex items-center justify-center gap-2"
                                p_on_click={F_Handle_Download}
                            />
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                <F_Edit_Product_Modal
                    p_is_open={is_edit_modal_open}
                    p_on_close={() => set_is_edit_modal_open(false)}
                    p_product={product}
                    p_on_update={F_Load_Product}
                />

                <F_Confirmation_Modal
                    p_is_open={is_delete_modal_open}
                    p_on_close={() => set_is_delete_modal_open(false)}
                    p_on_confirm={F_Handle_Delete}
                    p_title={F_Get_Text('product.confirm_delete_title')}
                    p_message={F_Get_Text('product.confirm_delete_message')}
                    p_confirm_label={F_Get_Text('product.delete_confirm_button')}
                    p_cancel_label={F_Get_Text('product.cancel')}
                />

            </div>
        </F_Main_Template >
    );
};


