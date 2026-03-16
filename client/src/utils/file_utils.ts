import { F_Normalize_Image_File } from './image_utils';

export const F_File_To_Base64 = async (p_file: File): Promise<string> => {
    const normalized = await F_Normalize_Image_File(p_file);
    return normalized.data_url;
};

export const F_Validate_Image_File = (p_file: File): boolean => {
    const valid_types = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/heic-sequence',
        'image/heif-sequence'
    ];
    return valid_types.includes(p_file.type);
};

export type I_Download_Item = {
    file_name: string;
    url?: string;
    blob?: Blob;
};

export const F_Download_File_From_Url = (p_url: string, p_file_name: string) => {
    const link = document.createElement('a');
    link.href = p_url;
    link.download = p_file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const F_Download_File_From_Blob = (p_blob: Blob, p_file_name: string) => {
    const object_url = URL.createObjectURL(p_blob);
    F_Download_File_From_Url(object_url, p_file_name);
    setTimeout(() => URL.revokeObjectURL(object_url), 1000);
};

export const F_Download_Multiple_Files = async (p_items: I_Download_Item[], p_gap_ms = 180) => {
    const valid_items = p_items.filter((item) => Boolean(item.url || item.blob));

    for (let i = 0; i < valid_items.length; i++) {
        const item = valid_items[i];
        if (item.blob) {
            F_Download_File_From_Blob(item.blob, item.file_name);
        } else if (item.url) {
            F_Download_File_From_Url(item.url, item.file_name);
        }

        if (i < valid_items.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, p_gap_ms));
        }
    }
};
