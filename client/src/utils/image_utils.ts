/**
 * Optimizes an image for Gemini 2.0/Imagen 4.0 API compliance.
 * Specs: 1024x1024, JPEG, 0.7 quality.
 * Returns both a Clean Base64 (no header) and the full Data URL for preview if needed.
 */
export const F_Prepare_Image_For_Gemini = (file: File): Promise<{ clean_base64: string, mime_type: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1024;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error("Canvas context failed"));
                    return;
                }

                // Fill white background (JPEG doesn't support transparency)
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, 1024, 1024);

                // Calculate Aspect Ratio to "Contain" or "Cover"
                // For product transfer, "Contain" preserves whole item? 
                // "Cover" fills square? 
                // Let's use "Contain" to ensure the whole product is visible on the 1024x1024 canvas.
                // Center the image.
                const scale = Math.min(1024 / img.width, 1024 / img.height);
                const x = (1024 / 2) - (img.width / 2) * scale;
                const y = (1024 / 2) - (img.height / 2) * scale;

                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                // Export as JPEG 0.7
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const clean_base64 = dataUrl.split(',')[1];

                resolve({ clean_base64, mime_type: 'image/jpeg' });
            };
            img.onerror = (err) => reject(new Error("Image load failed"));
        };
        reader.onerror = (err) => reject(new Error("File read failed"));
    });
};

// Deprecated alias for compatibility
export const F_Optimize_Image_For_Imagen = F_Prepare_Image_For_Gemini;

const DEFAULT_NORMALIZE_SIZE = 1024;
const DEFAULT_NORMALIZE_QUALITY = 0.85;
const HEIC_MIME_TYPES = [
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence'
];

const F_Read_File_As_DataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("File read failed"));
    });
};

const F_Is_Heic_File = (file: File): boolean => {
    const type = (file.type || '').toLowerCase();
    if (HEIC_MIME_TYPES.includes(type)) return true;

    const name = (file.name || '').toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif');
};

export const F_DataUrl_To_Blob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
        return new Blob([], { type: 'application/octet-stream' });
    }

    const header = parts[0] || '';
    const base64 = parts.slice(1).join(',');
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch?.[1] || 'application/octet-stream';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
};

export const F_DataUrl_To_File = (dataUrl: string, fileName: string): File => {
    const blob = F_DataUrl_To_Blob(dataUrl);
    return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
};

export const F_Normalize_Image_File = async (
    file: File,
    maxSize: number = DEFAULT_NORMALIZE_SIZE,
    quality: number = DEFAULT_NORMALIZE_QUALITY
): Promise<{ data_url: string; mime_type: string }> => {
    let workingFile = file;

    if (F_Is_Heic_File(file)) {
        try {
            const mod = await import('heic2any');
            const heic2any = (mod as any).default || mod;
            const converted = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality
            });
            const blob = Array.isArray(converted) ? converted[0] : converted;
            workingFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg'
            });
        } catch (error) {
            console.warn('HEIC conversion failed. Falling back to original file.', error);
        }
    }

    const dataUrl = await F_Read_File_As_DataUrl(workingFile);

    try {
        const img = new Image();
        img.src = dataUrl;

        const imageEl = img as HTMLImageElement;
        if (typeof imageEl.decode === 'function') {
            await imageEl.decode();
        } else {
            await new Promise<void>((resolve, reject) => {
                imageEl.onload = () => resolve();
                imageEl.onerror = () => reject(new Error("Image load failed"));
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return { data_url: dataUrl, mime_type: file.type || 'image/jpeg' };
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, maxSize, maxSize);

        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        const x = (maxSize / 2) - (img.width / 2) * scale;
        const y = (maxSize / 2) - (img.height / 2) * scale;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const normalizedUrl = canvas.toDataURL('image/jpeg', quality);
        return { data_url: normalizedUrl, mime_type: 'image/jpeg' };
    } catch (error) {
        return { data_url: dataUrl, mime_type: workingFile.type || 'image/jpeg' };
    }
};

/**
 * Helper to optimize base64 string directly if File object not available
 */
export const F_Prepare_Base64_For_Gemini = (base64: string): Promise<{ clean_base64: string, mime_type: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error("Canvas context failed"));
                return;
            }

            // Fill white background (no alpha)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, 1024, 1024);

            const scale = Math.min(1024 / img.width, 1024 / img.height);
            const x = (1024 / 2) - (img.width / 2) * scale;
            const y = (1024 / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const clean_base64 = dataUrl.split(',')[1];

            resolve({ clean_base64, mime_type: 'image/jpeg' });
        };
        img.onerror = (err) => reject(new Error("Image load failed"));
    });
};

export const F_Optimize_Base64_For_Imagen = F_Prepare_Base64_For_Gemini;

export const F_File_To_Base64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};
