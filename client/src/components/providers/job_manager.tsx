import React, { useEffect, useRef, useState } from 'react';
import {
    I_Product_Data,
    F_Get_All_Products,
    F_Update_Product_Status,
    I_Error_Log,
    F_Get_Error_Logs,
    F_Clear_Error_Logs,
    F_Remove_Error_Log,
    F_Add_Error_Log,
    F_Subscribe_To_Updates,
    F_Save_Product,
    F_Delete_Product_By_Id,
    F_Save_Product_Video_Asset,
} from '../../utils/storage_utils';
import { F_Get_Language } from '../../utils/i18n_utils';
import { JobContext } from '../../context/JobContext';

export const F_Job_Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error_logs, set_error_logs] = useState<I_Error_Log[]>([]);
    const processing_jobs_ref = useRef<Set<string>>(new Set());
    const is_tick_running_ref = useRef(false);
    const MAX_CONCURRENT_JOBS = 2;

    const refresh_logs = async () => {
        set_error_logs(await F_Get_Error_Logs());
    };

    const cancel_job = async (id: string) => {
        await F_Delete_Product_By_Id(id);
        refresh_logs();
    };

    const F_Process_Product = async (product: I_Product_Data) => {
        const TIMEOUT_MS = 600000;
        const F_Is_Video_Busy = (status: I_Product_Data['video_status']) =>
            status === 'generating' || status === 'pending' || status === 'updating';

        const reference_time = product.update_at || product.created_at;
        if (Date.now() - reference_time > TIMEOUT_MS) {
            product.status = 'exited';
            product.error_log = 'System Timeout: 10 Minutes';

            if (product.seo_status === 'updating' || product.seo_status === 'pending') product.seo_status = 'failed';
            if (product.front_status === 'updating' || product.front_status === 'pending' || product.front_status === 'generating_again') product.front_status = 'failed';
            if (product.back_status === 'updating' || product.back_status === 'pending' || product.back_status === 'generating_again') product.back_status = 'failed';
            if (product.video_status === 'updating' || product.video_status === 'pending' || product.video_status === 'generating') product.video_status = 'error';

            await F_Save_Product(product);
            await F_Add_Error_Log({ product_id: product.product_id, message: product.error_log || 'System Timeout' }).catch(() => {});
            return;
        }

        if ((product.retry_count || 0) >= 3) {
            if (product.status !== 'exited') {
                await F_Update_Product_Status(product.product_id, 'exited', 'Max Retries Exceeded');
            }
            return;
        }

        if (product.status === 'finished' || product.status === 'failed' || product.status === 'exited') {
            return;
        }

        try {
            if (product.analysis_status === 'pending' || (product.status === 'running' && !product.front_analyse)) {
                if (product.analysis_status !== 'updating') {
                    product.analysis_status = 'updating';
                    product.error_log = 'Analyzing Visual Attributes (Flash 2.0)...';
                    await F_Save_Product(product);
                }

                const { F_Analyze_Image } = await import('../../services/gemini_service');

                if (!product.front_analyse && product.raw_front) {
                    product.front_analyse = await F_Analyze_Image(
                        product.raw_front,
                        'Describe detailed technical fashion attributes: Fit, Length, Fabric, Neckline, Sleeve, Color, Pattern. Output as concise keywords.'
                    );
                }

                if (!product.back_analyse && product.raw_back) {
                    product.back_analyse = await F_Analyze_Image(
                        product.raw_back,
                        'Describe back details: Cuts, Zippers, Pockets, Fit from back. Output as concise keywords.'
                    );
                }

                product.analysis_status = 'completed';
                if (product.seo_status !== 'completed') product.seo_status = 'pending';

                await F_Save_Product(product);
                return;
            }

            if (product.seo_status === 'pending') {
                if (product.analysis_status !== 'completed' && !product.front_analyse) {
                    return;
                }

                product.seo_status = 'updating';
                product.error_log = 'Writing Localized Marketing Copy...';
                await F_Save_Product(product);

                const { F_Generate_SEO_Content } = await import('../../services/gemini_service');

                const richContext = `User Input: ${product.raw_desc}. \nVisual Analysis: ${product.front_analyse} ${product.back_analyse || ''}`;
                const lang = product.language_pref || F_Get_Language() || 'en';
                const result = await F_Generate_SEO_Content(product, lang as any, richContext);

                product.product_title = result.title;
                product.product_desc = result.description;
                product.seo_status = 'completed';

                if (product.front_status !== 'completed') product.front_status = 'pending';

                await F_Save_Product(product);
                return;
            }

            if (product.front_status === 'pending' || product.front_status === 'generating_again') {
                if (product.seo_status !== 'completed') {
                    return;
                }

                const is_retry_front = product.front_status === 'generating_again';
                if (!is_retry_front) {
                    product.front_status = 'updating';
                }
                product.error_log = is_retry_front
                    ? 'Retrying Front View...'
                    : 'Synthesizing High-Fidelity Front View (Pro)...';
                await F_Save_Product(product);

                const { F_Generate_Model_Image } = await import('../../services/gemini_service');
                const generated_image = await F_Generate_Model_Image(product);

                if (!generated_image) {
                    throw new Error('Pro Generation failed (Empty)');
                }

                product.model_front = generated_image;
                product.front_status = 'completed';

                if (!product.raw_back) {
                    product.back_status = 'completed';
                } else if (product.back_status !== 'completed') {
                    product.back_status = 'pending';
                }

                await F_Save_Product(product);
                return;
            }

            if (product.back_status === 'pending' || product.back_status === 'generating_again') {
                if (!product.raw_back) {
                    product.back_status = 'completed';
                    if (product.video_status === 'generating' || product.video_status === 'pending' || product.video_status === 'updating') {
                        product.status = 'running';
                    } else {
                        product.status = 'finished';
                        if (!product.video_status) product.video_status = 'not_generate';
                    }
                    product.error_log = undefined;
                    await F_Save_Product(product);
                    return;
                }

                const is_retry_back = product.back_status === 'generating_again';
                if (!is_retry_back) {
                    product.back_status = 'updating';
                }
                product.error_log = is_retry_back
                    ? 'Retrying Back View...'
                    : 'Synthesizing Consistent Back View...';
                await F_Save_Product(product);

                const { F_Generate_Back_View } = await import('../../services/gemini_service');

                if (!product.model_front) {
                    throw new Error('Missing Front Model Image for Back View Generation');
                }

                const back_gen = await F_Generate_Back_View(product, product.model_front);

                product.model_back = back_gen;
                product.back_status = 'completed';
                if (product.video_status === 'generating' || product.video_status === 'pending' || product.video_status === 'updating') {
                    product.status = 'running';
                } else {
                    product.status = 'finished';
                    if (!product.video_status) product.video_status = 'not_generate';
                }
                product.error_log = undefined;
                await F_Save_Product(product);
                return;
            }

            if (F_Is_Video_Busy(product.video_status)) {
                if (!product.model_front) {
                    return;
                }

                product.video_status = 'generating';
                product.error_log = 'Generating cinematic video preview...';
                await F_Save_Product(product);

                const { F_Generate_Video_Preview } = await import('../../services/gemini_service');
                const generated_video = await F_Generate_Video_Preview(product);

                if (!generated_video || !generated_video.video_blob) {
                    throw new Error('Video generation failed (Empty)');
                }

                await F_Save_Product_Video_Asset(product.product_id, generated_video.video_blob, generated_video.fetch_url || generated_video.source_uri);

                product.model_video = generated_video.fetch_url || generated_video.source_uri;
                product.video_status = 'generated';
                product.status = 'finished';
                product.error_log = undefined;
                await F_Save_Product(product);
                return;
            }

            const is_video_busy = F_Is_Video_Busy(product.video_status);
            const is_workflow_done =
                product.front_status === 'completed' &&
                product.back_status === 'completed' &&
                !is_video_busy;

            if (product.status === 'running' && is_workflow_done) {
                product.status = 'finished';
                if (!product.video_status) product.video_status = 'not_generate';
                product.error_log = undefined;
                await F_Save_Product(product);
            }
        } catch (error: any) {
            product.status = 'failed';
            product.error_log = `Pipeline Error: ${error.message}`;

            if (product.analysis_status === 'updating' || product.analysis_status === 'pending') product.analysis_status = 'failed';
            if (product.seo_status === 'updating' || product.seo_status === 'pending') product.seo_status = 'failed';
            if (product.front_status === 'updating' || product.front_status === 'pending' || product.front_status === 'generating_again') product.front_status = 'failed';
            if (product.back_status === 'updating' || product.back_status === 'pending' || product.back_status === 'generating_again') product.back_status = 'failed';
            if (product.video_status === 'updating' || product.video_status === 'pending' || product.video_status === 'generating') product.video_status = 'error';

            await F_Save_Product(product);
            await F_Add_Error_Log({ product_id: product.product_id, message: product.error_log || error.message }).catch(() => {});
        }
    };

    useEffect(() => {
        refresh_logs();
        let is_mounted = true;

        const F_Handle_Error = (event: ErrorEvent) => {
            const message = event.message || 'Unhandled error';
            F_Add_Error_Log({ message }).catch(() => {});
        };

        const F_Handle_Rejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Unhandled rejection');
            F_Add_Error_Log({ message: reason }).catch(() => {});
        };

        const F_Run_Job = async (product: I_Product_Data) => {
            if (processing_jobs_ref.current.has(product.product_id)) {
                return;
            }

            processing_jobs_ref.current.add(product.product_id);
            try {
                await F_Process_Product(product);
            } finally {
                processing_jobs_ref.current.delete(product.product_id);
            }
        };

        const tick = async () => {
            if (!is_mounted || is_tick_running_ref.current) {
                return;
            }

            is_tick_running_ref.current = true;

            try {
                const products = await F_Get_All_Products();

                const active_products = products.filter((p) =>
                    (p.status !== 'failed' && p.status !== 'exited') && (
                        p.status === 'running' ||
                        p.analysis_status === 'pending' || p.analysis_status === 'updating' ||
                        p.seo_status === 'pending' || p.seo_status === 'updating' ||
                        p.front_status === 'pending' || p.front_status === 'updating' || p.front_status === 'generating_again' ||
                        p.back_status === 'pending' || p.back_status === 'updating' || p.back_status === 'generating_again' ||
                        p.video_status === 'pending' || p.video_status === 'updating' || p.video_status === 'generating'
                    )
                ).sort((a, b) => (b.update_at || b.created_at) - (a.update_at || a.created_at));

                for (const product of active_products) {
                    if (processing_jobs_ref.current.size >= MAX_CONCURRENT_JOBS) {
                        break;
                    }
                    if (processing_jobs_ref.current.has(product.product_id)) {
                        continue;
                    }
                    void F_Run_Job(product);
                }
            } finally {
                is_tick_running_ref.current = false;
            }
        };

        const unsubscribe = F_Subscribe_To_Updates(refresh_logs);

        tick();
        const interval = setInterval(tick, 5000);

        window.addEventListener('error', F_Handle_Error);
        window.addEventListener('unhandledrejection', F_Handle_Rejection);

        return () => {
            is_mounted = false;
            clearInterval(interval);
            processing_jobs_ref.current.clear();
            window.removeEventListener('error', F_Handle_Error);
            window.removeEventListener('unhandledrejection', F_Handle_Rejection);
            unsubscribe();
        };
    }, []);

    const clear_logs = () => {
        F_Clear_Error_Logs();
        refresh_logs();
    };

    const remove_log = (id: string) => {
        F_Remove_Error_Log(id);
        refresh_logs();
    };

    return (
        <JobContext.Provider value={{ error_logs, clear_logs, remove_log, refresh_logs, cancel_job }}>
            {children}
        </JobContext.Provider>
    );
};
