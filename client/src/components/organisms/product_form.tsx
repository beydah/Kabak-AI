import React, { useState, useEffect } from 'react';
import { F_Button } from '../../components/atoms/button';
import { F_File_Upload } from '../../components/molecules/file_upload';
import { I_Product_Data, F_Save_Draft_Image, F_Get_Draft_Image, F_Remove_Draft_Image } from '../../utils/storage_utils';
import { F_Get_Text } from '../../utils/i18n_utils';
import { F_File_To_Base64 } from '../../utils/file_utils';

const DRAFT_IMG_FRONT = 'kabak_draft_img_front';
const DRAFT_IMG_BACK = 'kabak_draft_img_back';

interface Product_Form_Props {
    p_initial_data?: Partial<I_Product_Data>;
    p_on_submit: (data: Partial<I_Product_Data>, front: File | null, back: File | null) => Promise<void>;
    p_on_cancel: () => void;
    p_on_change?: (data: Partial<I_Product_Data>) => void;
    p_is_edit_mode?: boolean;
    p_submit_label?: string;
}

export const F_Product_Form: React.FC<Product_Form_Props> = ({
    p_initial_data,
    p_on_submit,
    p_on_cancel,
    p_on_change,
    p_is_edit_mode = false,
    p_submit_label,
}) => {
    const [front_file, set_front_file] = useState<File | null>(null);
    const [back_file, set_back_file] = useState<File | null>(null);

    const [form_data, set_form_data] = useState({
        gender: p_initial_data?.gender === false ? 'male' : 'female',
        age: p_initial_data?.age || '30',
        body_type: p_initial_data?.vücut_tipi || 'average',
        fit: p_initial_data?.kesim || 'regular',
        background: p_initial_data?.background || 'orange',
        accessory: p_initial_data?.aksesuar || 'none',
        description: p_initial_data?.raw_desc || '',
    });

    useEffect(() => {
        if (!p_initial_data) return;

        set_form_data((prev) => ({
            ...prev,
            gender: p_initial_data.gender === false ? 'male' : 'female',
            body_type: p_initial_data.vücut_tipi || 'average',
            fit: p_initial_data.kesim || 'regular',
            background: p_initial_data.background || 'orange',
            accessory: p_initial_data.aksesuar || 'none',
            age: p_initial_data.age || '30',
            description: p_initial_data.raw_desc || '',
        }));
    }, [p_initial_data]);

    useEffect(() => {
        let mounted = true;

        const loadDraftImages = async () => {
            try {
                const frontB64 = await F_Get_Draft_Image(DRAFT_IMG_FRONT);
                if (mounted && frontB64 && !p_initial_data?.raw_front) {
                    const res = await fetch(frontB64);
                    const blob = await res.blob();
                    set_front_file(new File([blob], 'draft_front.png', { type: 'image/png' }));
                }

                const backB64 = await F_Get_Draft_Image(DRAFT_IMG_BACK);
                if (mounted && backB64 && !p_initial_data?.raw_back) {
                    const res = await fetch(backB64);
                    const blob = await res.blob();
                    set_back_file(new File([blob], 'draft_back.png', { type: 'image/png' }));
                }
            } catch (e) {
                console.error('Failed to load draft images', e);
            }
        };

        loadDraftImages();

        return () => {
            mounted = false;
        };
    }, [p_initial_data]);

    const setFrontFileWithDraft = async (file: File | null) => {
        set_front_file(file);
        if (file) {
            try {
                const b64 = await F_File_To_Base64(file);
                await F_Save_Draft_Image(DRAFT_IMG_FRONT, b64);
            } catch (e) {
                console.error('Draft save failed', e);
            }
            return;
        }
        await F_Remove_Draft_Image(DRAFT_IMG_FRONT);
    };

    const setBackFileWithDraft = async (file: File | null) => {
        set_back_file(file);
        if (file) {
            try {
                const b64 = await F_File_To_Base64(file);
                await F_Save_Draft_Image(DRAFT_IMG_BACK, b64);
            } catch (e) {
                console.error('Draft save failed', e);
            }
            return;
        }
        await F_Remove_Draft_Image(DRAFT_IMG_BACK);
    };

    useEffect(() => {
        if (!p_on_change) return;

        const partial_data: Partial<I_Product_Data> = {
            gender: form_data.gender === 'female',
            age: form_data.age,
            vücut_tipi: form_data.body_type,
            kesim: form_data.fit,
            background: form_data.background,
            aksesuar: form_data.accessory,
            raw_desc: form_data.description,
        };

        p_on_change(partial_data);
    }, [form_data, p_on_change]);

    const F_Handle_Change = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        set_form_data((prev) => ({ ...prev, [name]: value }));
    };

    const F_Validate_Form = (): boolean => {
        if (!front_file && !p_initial_data?.raw_front) {
            alert(F_Get_Text('new_product.validation.required_images'));
            return false;
        }

        if (!back_file && !p_initial_data?.raw_back) {
            alert(F_Get_Text('new_product.validation.required_images'));
            return false;
        }

        if (!form_data.description.trim()) {
            alert(F_Get_Text('new_product.validation.required_all'));
            return false;
        }

        return true;
    };

    const F_Handle_Submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!F_Validate_Form()) {
            return;
        }

        const submit_data: Partial<I_Product_Data> = {
            gender: form_data.gender === 'female',
            age: form_data.age.toString(),
            vücut_tipi: form_data.body_type,
            kesim: form_data.fit,
            background: form_data.background,
            aksesuar: form_data.accessory,
            raw_desc: form_data.description,
        };

        await p_on_submit(submit_data, front_file, back_file);
    };

    return (
        <form onSubmit={F_Handle_Submit} className="space-y-6 max-w-[600px] mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <label htmlFor="product_front_image" className="block text-sm font-medium text-secondary ml-1">
                        {F_Get_Text('new_product.upload.front')} <span className="text-primary">*</span>
                    </label>
                    <div className="h-48">
                        <F_File_Upload
                            p_id="product_front_image"
                            p_label=""
                            p_file={front_file}
                            p_on_change={setFrontFileWithDraft}
                            p_preview_url={p_initial_data?.raw_front}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="product_back_image" className="block text-sm font-medium text-secondary ml-1">
                        {F_Get_Text('new_product.upload.back')} <span className="text-primary">*</span>
                    </label>
                    <div className="h-48">
                        <F_File_Upload
                            p_id="product_back_image"
                            p_label=""
                            p_file={back_file}
                            p_on_change={setBackFileWithDraft}
                            p_preview_url={p_initial_data?.raw_back}
                        />
                    </div>
                </div>
            </div>

            <hr className="border-secondary/20" />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="gender" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.gender')}
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            value={form_data.gender}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="female">{F_Get_Text('new_product.options.gender.female')}</option>
                            <option value="male">{F_Get_Text('new_product.options.gender.male')}</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="body_type" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.body_type')}
                        </label>
                        <select
                            id="body_type"
                            name="body_type"
                            value={form_data.body_type}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="slim">{F_Get_Text('new_product.options.body_type.slim')}</option>
                            <option value="average">{F_Get_Text('new_product.options.body_type.average')}</option>
                            <option value="plus_size">{F_Get_Text('new_product.options.body_type.plus_size')}</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="background" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.background')}
                        </label>
                        <select
                            id="background"
                            name="background"
                            value={form_data.background}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="black">{F_Get_Text('new_product.options.background.black')}</option>
                            <option value="white">{F_Get_Text('new_product.options.background.white')}</option>
                            <option value="orange">{F_Get_Text('new_product.options.background.orange')}</option>
                            <option value="cafe">{F_Get_Text('new_product.options.background.cafe')}</option>
                            <option value="urban">{F_Get_Text('new_product.options.background.urban')}</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="age" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.age')}
                        </label>
                        <input
                            id="age"
                            type="number"
                            name="age"
                            min={10}
                            max={50}
                            value={form_data.age}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="fit" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.fit')}
                        </label>
                        <select
                            id="fit"
                            name="fit"
                            value={form_data.fit}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="slim">{F_Get_Text('new_product.options.fit.slim')}</option>
                            <option value="regular">{F_Get_Text('new_product.options.fit.regular')}</option>
                            <option value="oversized">{F_Get_Text('new_product.options.fit.oversized')}</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="accessory" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                            {F_Get_Text('new_product.labels.accessory')}
                        </label>
                        <select
                            id="accessory"
                            name="accessory"
                            value={form_data.accessory}
                            onChange={F_Handle_Change}
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="none">{F_Get_Text('new_product.options.accessory.none')}</option>
                            <option value="bag">{F_Get_Text('new_product.options.accessory.bag')}</option>
                            <option value="glasses">{F_Get_Text('new_product.options.accessory.glasses')}</option>
                            <option value="wallet">{F_Get_Text('new_product.options.accessory.wallet')}</option>
                            <option value="car_key">{F_Get_Text('new_product.options.accessory.car_key')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="description" className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    {F_Get_Text('new_product.labels.description')}
                </label>
                <textarea
                    id="description"
                    name="description"
                    autoComplete="off"
                    value={form_data.description}
                    onChange={F_Handle_Change}
                    rows={3}
                    placeholder={F_Get_Text('new_product.placeholders.description')}
                    className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-bg-light dark:bg-bg-dark text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    aria-label={F_Get_Text('new_product.labels.description')}
                />
            </div>

            <div className="flex items-center gap-3 pt-2">
                {p_is_edit_mode && (
                    <F_Button
                        p_label={F_Get_Text('product.cancel')}
                        p_type="button"
                        p_variant="secondary"
                        p_class_name="flex-1 py-2.5 text-sm"
                        p_on_click={p_on_cancel}
                    />
                )}
                <F_Button
                    p_label={p_submit_label || F_Get_Text('new_product.generate_button')}
                    p_type="submit"
                    p_variant="primary"
                    p_class_name="flex-1 py-2.5 text-sm font-medium"
                />
            </div>
        </form>
    );
};

