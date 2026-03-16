import React from 'react';
import { F_Modal } from '@/shared/ui/molecules/modal';
import { F_Product_Form } from './product_form';
import { F_Get_Text } from '@/shared/utils/i18n_utils';
import { I_Product_Data, F_Save_Product, F_Add_Error_Log } from '@/shared/utils/storage_utils';
import { F_File_To_Base64 } from '@/shared/utils/file_utils';
import { F_Analyze_Config_Diff } from '@/shared/utils/diff_utils';

interface Edit_Product_Modal_Props {
    p_is_open: boolean;
    p_on_close: () => void;
    p_product: I_Product_Data;
    p_on_update: () => void;
}

export const F_Edit_Product_Modal: React.FC<Edit_Product_Modal_Props> = ({
    p_is_open,
    p_on_close,
    p_product,
    p_on_update
}) => {

    const F_Handle_Submit = async (p_data: Partial<I_Product_Data>, p_front_file: File | null, p_back_file: File | null) => {
        try {
            let front_b64 = p_product.raw_front;
            if (p_front_file) {
                front_b64 = await F_File_To_Base64(p_front_file);
            }

            let back_b64 = p_product.raw_back;
            if (p_back_file) {
                back_b64 = await F_File_To_Base64(p_back_file);
            }

            const updated_product: I_Product_Data = {
                ...p_product,
                ...p_data,
                raw_front: front_b64,
                raw_back: back_b64,
                update_at: Date.now()
            };

            const diff = F_Analyze_Config_Diff(p_product, updated_product);
            const had_video = Boolean(p_product.model_video);

            if (diff.hasChanges) {
                updated_product.status = 'running';
                updated_product.retry_count = 0;
                updated_product.error_log = undefined;

                if (diff.needsAnalysis) {
                    updated_product.analysis_status = 'pending';
                    updated_product.front_analyse = undefined;
                    updated_product.back_analyse = undefined;
                }

                if (diff.needsSEO) {
                    updated_product.seo_status = 'pending';
                } else if (updated_product.seo_status !== 'completed') {
                    updated_product.seo_status = 'completed';
                }

                if (diff.needsFront) {
                    updated_product.front_status = 'pending';
                }

                if (diff.needsBack) {
                    updated_product.back_status = 'pending';
                }

                const should_regenerate_video = diff.needsVideo && had_video;
                if (should_regenerate_video) {
                    updated_product.video_status = 'generating';
                } else if (updated_product.video_status !== 'completed') {
                    updated_product.video_status = updated_product.video_status || 'not_generate';
                }
            }

            await F_Save_Product(updated_product);

            p_on_update();
            p_on_close();

        } catch (error) {
            console.error('Error updating product:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            await F_Add_Error_Log({ product_id: p_product.product_id, message: `Update Product Error: ${message}` }).catch(() => {});
            alert(F_Get_Text('common.error'));
        }
    };

    return (
        <F_Modal
            p_is_open={p_is_open}
            p_on_close={p_on_close}
            p_title={F_Get_Text('product.edit_modal_title')}
        >
            <F_Product_Form
                p_initial_data={p_product}
                p_on_submit={F_Handle_Submit}
                p_on_cancel={p_on_close}
                p_is_edit_mode={true}
                p_submit_label={F_Get_Text('product.save_changes')}
            />
        </F_Modal>
    );
};
