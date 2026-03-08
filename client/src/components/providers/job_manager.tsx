import React, { useEffect, useRef, useState } from 'react';
import {
    I_Product_Data,
    F_Get_All_Products,
    F_Update_Product_Status,
    I_Error_Log,
    F_Get_Error_Logs,
    F_Clear_Error_Logs,
    F_Remove_Error_Log,
    F_Save_Product,
    F_Delete_Product_By_Id,
} from '../../utils/storage_utils';
import { F_Get_Language } from '../../utils/i18n_utils';
import { JobContext } from '../../context/JobContext';

export const F_Job_Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error_logs, set_error_logs] = useState<I_Error_Log[]>([]);
    const processing_jobs_ref = useRef<Set<string>>(new Set());
    const is_tick_running_ref = useRef(false);

    const refresh_logs = async () => {
        set_error_logs(await F_Get_Error_Logs());
    };

    const cancel_job = async (id: string) => {
        await F_Delete_Product_By_Id(id);
        refresh_logs();
    };

    const F_Process_Product = async (product: I_Product_Data) => {
        const TIMEOUT_MS = 600000;

        if (Date.now() - product.created_at > TIMEOUT_MS) {
            product.status = 'exited';
            product.error_log = 'System Timeout: 10 Minutes';

            if (product.seo_status === 'updating' || product.seo_status === 'pending') product.seo_status = 'failed';
            if (product.front_status === 'updating' || product.front_status === 'pending') product.front_status = 'failed';
            if (product.back_status === 'updating' || product.back_status === 'pending') product.back_status = 'failed';
            if (product.video_status === 'updating' || product.video_status === 'pending') product.video_status = 'failed';

            await F_Save_Product(product);
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

            if (product.front_status === 'pending') {
                if (product.seo_status !== 'completed') {
                    return;
                }

                product.front_status = 'updating';
                product.error_log = 'Synthesizing High-Fidelity Front View (Pro)...';
                await F_Save_Product(product);

                const { F_Generate_Model_Image } = await import('../../services/gemini_service');
                const generated_image = await F_Generate_Model_Image(product);

                if (!generated_image) {
                    throw new Error('Pro Generation failed (Empty)');
                }

                product.model_front = generated_image;
                product.front_status = 'completed';

                if (product.back_status !== 'completed') product.back_status = 'pending';

                await F_Save_Product(product);
                return;
            }

            if (product.back_status === 'pending') {
                if (!product.raw_back) {
                    product.back_status = 'completed';
                    product.status = 'finished';
                    product.video_status = 'completed';
                    product.error_log = undefined;
                    await F_Save_Product(product);
                    return;
                }

                product.back_status = 'updating';
                product.error_log = 'Synthesizing Consistent Back View...';
                await F_Save_Product(product);

                const { F_Generate_Back_View } = await import('../../services/gemini_service');

                if (!product.model_front) {
                    throw new Error('Missing Front Model Image for Back View Generation');
                }

                const back_gen = await F_Generate_Back_View(product, product.model_front);

                product.model_back = back_gen;
                product.back_status = 'completed';
                product.status = 'finished';
                product.video_status = 'completed';
                product.error_log = undefined;
                await F_Save_Product(product);
                return;
            }
        } catch (error: any) {
            product.status = 'failed';
            product.error_log = `Pipeline Error: ${error.message}`;

            if (product.analysis_status === 'updating' || product.analysis_status === 'pending') product.analysis_status = 'failed';
            if (product.seo_status === 'updating' || product.seo_status === 'pending') product.seo_status = 'failed';
            if (product.front_status === 'updating' || product.front_status === 'pending') product.front_status = 'failed';
            if (product.back_status === 'updating' || product.back_status === 'pending') product.back_status = 'failed';
            if (product.video_status === 'updating' || product.video_status === 'pending') product.video_status = 'failed';

            await F_Save_Product(product);
        }
    };

    useEffect(() => {
        refresh_logs();
        let is_mounted = true;

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
                        p.front_status === 'pending' || p.front_status === 'updating' ||
                        p.back_status === 'pending' || p.back_status === 'updating' ||
                        p.video_status === 'pending' || p.video_status === 'updating'
                    )
                );

                for (const product of active_products) {
                    if (processing_jobs_ref.current.has(product.product_id)) {
                        continue;
                    }

                    processing_jobs_ref.current.add(product.product_id);
                    try {
                        await F_Process_Product(product);
                    } finally {
                        processing_jobs_ref.current.delete(product.product_id);
                    }
                }
            } finally {
                is_tick_running_ref.current = false;
            }
        };

        tick();
        const interval = setInterval(tick, 5000);

        return () => {
            is_mounted = false;
            clearInterval(interval);
            processing_jobs_ref.current.clear();
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
