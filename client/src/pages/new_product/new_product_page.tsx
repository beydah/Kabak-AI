import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { F_Main_Template } from '../../components/templates/main_template';
import { F_Text } from '../../components/atoms/text';
import { F_Get_Text } from '../../utils/i18n_utils';
import { F_Product_Form } from '../../components/organisms/product_form';
import { F_Save_Product, I_Product_Data, F_Save_Draft, F_Get_Draft, F_Clear_Draft, F_Remove_Draft_Image, F_Get_Start_Defaults, F_Save_Start_Defaults, F_Add_Error_Log } from '../../utils/storage_utils';
import { F_File_To_Base64 } from '../../utils/file_utils';

export const F_New_Product_Page: React.FC = () => {
    const navigate = useNavigate();
    const [initial_data, set_initial_data] = React.useState<Partial<I_Product_Data> | undefined>(undefined);
    const [is_loading, set_is_loading] = React.useState(true);

    // Initial Data Logic (Draft vs IndexedDB Defaults vs Hardcoded)
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Check for Draft
                const draft = await F_Get_Draft();
                if (draft) {
                    set_initial_data(draft);
                } else {
                    // 2. Check for IndexedDB Defaults
                    const defaults = await F_Get_Start_Defaults<Partial<I_Product_Data>>();
                    if (defaults) {
                        set_initial_data(defaults);
                    } else {
                        // 3. Hardcoded Defaults (First Run)
                        // Gender=Female (true), Age=30, Body=Average, Fit=Regular, BG=Orange, Acc=None
                        const hardcoded: Partial<I_Product_Data> = {
                            gender: true, // Female
                            age: '30',
                            vücut_tipi: 'average',
                            kesim: 'regular',
                            background: 'orange',
                            aksesuar: 'none'
                        };
                        set_initial_data(hardcoded);
                        // Save these immediately so next time they exist? 
                        // Or wait for user to save? User request implies "if first time... varsayilanlar eklenecek".
                        await F_Save_Start_Defaults(hardcoded);
                    }
                }
            } catch (e) {
                console.error("Failed to load initial data", e);
            } finally {
                set_is_loading(false);
            }
        };
        load();
    }, []);

    const F_Handle_Submit = async (p_data: Partial<I_Product_Data>, p_front_file: File | null, p_back_file: File | null) => {
        if (!p_front_file && !p_data.raw_front) {
            alert(F_Get_Text('new_product.validation.required_images'));
            return;
        }

        try {
            const front_b64 = p_front_file ? await F_File_To_Base64(p_front_file) : (p_data.raw_front || '');
            const back_b64 = p_back_file ? await F_File_To_Base64(p_back_file) : (p_data.raw_back || '');

            // Ensure all required fields for I_Product_Data are present
            const new_product: I_Product_Data = {
                product_id: uuidv4(),
                created_at: Date.now(),
                update_at: Date.now(),
                raw_front: front_b64,
                raw_back: back_b64,

                // Use form data or defaults
                gender: p_data.gender !== undefined ? p_data.gender : true,
                age: p_data.age || '30',
                vücut_tipi: p_data.vücut_tipi || 'average',
                kesim: p_data.kesim || 'regular',
                background: p_data.background || 'orange',
                aksesuar: p_data.aksesuar || 'none',

                raw_desc: p_data.raw_desc || '',
                status: 'running',
                retry_count: 0,
                video_status: 'not_generate'
            };

            // VALIDATION
            if (!new_product.product_id) throw new Error("ID Generation Failed");

            // 1. Save Product
            await F_Save_Product(new_product);

            // 2. Update Defaults in IndexedDB (User Request: "new-product bilgileri doldurulan ilgili kÄ±sÄ±mlarla gÃ¼ncellenecek")
            const new_defaults = {
                gender: new_product.gender,
                age: new_product.age,
                vücut_tipi: new_product.vücut_tipi,
                kesim: new_product.kesim,
                background: new_product.background,
                aksesuar: new_product.aksesuar
            };
            await F_Save_Start_Defaults(new_defaults);

            // 3. Clear Draft
            await F_Clear_Draft();
            await F_Remove_Draft_Image('kabak_draft_img_front');
            await F_Remove_Draft_Image('kabak_draft_img_back');

            navigate('/collection');

        } catch (error) {
            console.error("Error creating product:", error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            await F_Add_Error_Log({ message: `Create Product Error: ${message}` }).catch(() => {});
            alert(F_Get_Text('common.error'));
        }
    };

    const F_Handle_Draft_Update = async (data: Partial<I_Product_Data>) => {
        try {
            await F_Save_Draft(data);
        } catch (e) {
            console.error("Failed to save draft", e);
            const message = e instanceof Error ? e.message : 'Unknown error';
            await F_Add_Error_Log({ message: `Draft Save Error: ${message}` }).catch(() => {});
        }
    };

    if (is_loading) {
        return (
            <F_Main_Template p_is_authenticated={true}>
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner text-primary"></span>
                </div>
            </F_Main_Template>
        );
    }

    return (
        <F_Main_Template p_is_authenticated={true}>
            <div className="max-w-2xl mx-auto">
                {/* Back Link */}
                <button
                    onClick={() => navigate('/collection')}
                    className="text-primary hover:underline font-medium mb-6 flex items-center gap-2"
                >
                    {F_Get_Text('new_product.back_to_collection')}
                </button>

                {/* Title */}
                <F_Text p_variant="h1" p_class_name="mb-8 text-center text-text-light dark:text-text-dark">
                    {F_Get_Text('new_product.title')}
                </F_Text>

                {/* Form Card */}
                <div className="bg-white dark:bg-bg-dark rounded-xl shadow-lg border border-secondary/20 p-6 md:p-8">
                    <F_Product_Form
                        p_initial_data={initial_data as I_Product_Data}
                        p_on_submit={F_Handle_Submit}
                        p_on_cancel={() => navigate('/collection')}
                        p_on_change={F_Handle_Draft_Update}
                    />
                </div>
            </div>
        </F_Main_Template>
    );
};


