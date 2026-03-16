import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { F_Main_Template } from '@/shared/ui/templates/main_template';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Button } from '@/shared/ui/atoms/button';
import { F_Get_Text } from '@/shared/utils/i18n_utils';
import { F_Product_Card } from '../ui/product_card';
import { F_Analytics_Dashboard } from '../ui/analytics_dashboard';
import F_Storage_Dashboard from '../ui/storage_dashboard';
import { F_Get_All_Products, I_Product_Data, F_Subscribe_To_Updates } from '@/shared/utils/storage_utils';
import { F_Filter_Bar, I_Filter_State } from '../ui/filter_bar';
import { F_Detect_Gender_In_Query, F_Remove_Gender_Keywords } from '@/shared/utils/keyword_utils';
import { F_Download_Multiple_Files } from '@/shared/utils/file_utils';

export const F_Collection_Page: React.FC = () => {
    const navigate = useNavigate();
    const [all_products, set_all_products] = useState<I_Product_Data[]>([]);
    const [filtered_products, set_filtered_products] = useState<I_Product_Data[]>([]);
    const [current_filters, set_current_filters] = useState<I_Filter_State>({
        search: '',
        gender: 'all',
        status: 'all',
        age_range: 'all',
        sort: 'newest',
    });

    const F_Apply_Filters = useCallback((data: I_Product_Data[], filters: I_Filter_State) => {
        let result = [...data];

        if (filters.search) {
            let q = filters.search.toLowerCase().trim();
            const detectedGender = F_Detect_Gender_In_Query(q);

            if (detectedGender) {
                const normalizedGender = detectedGender.toLowerCase();
                const isFemale = normalizedGender.includes('kad') || normalizedGender.includes('female');
                result = result.filter((p) => p.gender === isFemale);
                q = F_Remove_Gender_Keywords(q);
            }

            if (q.length > 0) {
                result = result.filter((p) =>
                    p.product_id.toLowerCase().includes(q) ||
                    (p.product_title && p.product_title.toLowerCase().includes(q)) ||
                    (p.raw_desc && p.raw_desc.toLowerCase().includes(q))
                );
            }
        }

        if (filters.gender !== 'all') {
            const is_female = filters.gender === 'female';
            result = result.filter((p) => p.gender === is_female);
        }

        if (filters.status !== 'all') {
            result = result.filter((p) => p.status === filters.status);
        }

        if (filters.age_range !== 'all') {
            const [min, max] = filters.age_range.split('-').map(Number);
            result = result.filter((p) => {
                const age = parseInt(p.age || '0', 10);
                return age >= min && age <= max;
            });
        }

        result.sort((a, b) => {
            if (filters.sort === 'newest') return b.created_at - a.created_at;
            return a.created_at - b.created_at;
        });

        set_filtered_products(result);
    }, []);

    const F_Refresh_Products = useCallback(async () => {
        const data = await F_Get_All_Products();
        set_all_products(data);
    }, []);

    const F_Handle_Filter_Change = (filters: I_Filter_State) => {
        set_current_filters(filters);
    };

    useEffect(() => {
        F_Refresh_Products();

        const unsubscribe = F_Subscribe_To_Updates(() => {
            F_Refresh_Products();
        });

        const interval = setInterval(() => {
            F_Refresh_Products();
        }, 5000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [F_Refresh_Products]);

    useEffect(() => {
        F_Apply_Filters(all_products, current_filters);
    }, [all_products, current_filters, F_Apply_Filters]);

    const F_Handle_Bulk_Download = async (e: React.MouseEvent, p_product: I_Product_Data) => {
        e.stopPropagation();

        const items = [];
        if (p_product.raw_front) {
            items.push({ url: p_product.raw_front, file_name: `front_${p_product.product_id}.png` });
        }
        if (p_product.raw_back) {
            items.push({ url: p_product.raw_back as string, file_name: `back_${p_product.product_id}.png` });
        }

        await F_Download_Multiple_Files(items);
    };

    return (
        <F_Main_Template p_is_authenticated={true}>
            <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                    <F_Text p_variant="h1">
                        {F_Get_Text('collection.title')}
                    </F_Text>

                    <div className="flex items-center gap-4">
                        <F_Button
                            p_label={F_Get_Text('collection.create_new')}
                            p_on_click={() => navigate('/new-product')}
                        />
                    </div>
                </div>

                <div className="w-full">
                    <F_Filter_Bar p_on_filter_change={F_Handle_Filter_Change} />
                </div>

                {filtered_products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {filtered_products.map((product) => (
                            <F_Product_Card
                                key={product.product_id}
                                p_product={product}
                                p_navigate={navigate}
                                p_on_download={F_Handle_Bulk_Download}
                                p_on_refresh={F_Refresh_Products}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-lg">
                        <F_Text p_variant="body" p_class_name="text-secondary">
                            {F_Get_Text('collection.empty_state')}
                        </F_Text>
                    </div>
                )}

                <F_Analytics_Dashboard />
                <F_Storage_Dashboard />
            </div>
        </F_Main_Template>
    );
};

