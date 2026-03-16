import { I_Product_Data } from '../types/interfaces';

export type DiffResult = {
    hasChanges: boolean;
    needsAnalysis: boolean;
    needsSEO: boolean;
    needsFront: boolean;
    needsBack: boolean;
    needsVideo: boolean;
};

const F_Get_Body_Type = (product: Partial<I_Product_Data>): string | undefined => {
    const any_product = product as any;
    return any_product['v\u00fccut_tipi'] ?? any_product['v\u00c3\u00bccut_tipi'];
};

const F_Has_Changed = <T>(new_value: T | undefined, old_value: T | undefined): boolean => {
    return new_value !== undefined && new_value !== old_value;
};

export const F_Analyze_Config_Diff = (oldProduct: I_Product_Data, newConfig: Partial<I_Product_Data>): DiffResult => {
    const changes: DiffResult = {
        hasChanges: false,
        needsAnalysis: false,
        needsSEO: false,
        needsFront: false,
        needsBack: false,
        needsVideo: false
    };

    const old_body_type = F_Get_Body_Type(oldProduct);
    const new_body_type = F_Get_Body_Type(newConfig);

    const critical_change =
        F_Has_Changed(newConfig.gender, oldProduct.gender) ||
        F_Has_Changed(newConfig.age, oldProduct.age) ||
        F_Has_Changed(new_body_type, old_body_type) ||
        F_Has_Changed(newConfig.kesim, oldProduct.kesim) ||
        F_Has_Changed(newConfig.raw_desc, oldProduct.raw_desc);

    const source_image_change =
        F_Has_Changed(newConfig.raw_front, oldProduct.raw_front) ||
        F_Has_Changed(newConfig.raw_back, oldProduct.raw_back);

    const visual_change =
        F_Has_Changed(newConfig.background, oldProduct.background) ||
        F_Has_Changed(newConfig.aksesuar, oldProduct.aksesuar);

    if (critical_change || source_image_change) {
        changes.hasChanges = true;
        changes.needsAnalysis = true;
        changes.needsSEO = true;
        changes.needsFront = true;
        changes.needsBack = true;
        changes.needsVideo = true;
        return changes;
    }

    if (visual_change) {
        changes.hasChanges = true;
        changes.needsFront = true;
        changes.needsBack = true;
        changes.needsVideo = true;
    }

    return changes;
};
