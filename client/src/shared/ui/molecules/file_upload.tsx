import React, { useState, useRef, useEffect } from 'react';
import { F_Validate_Image_File } from '../../utils/file_utils';
import { F_Get_Text } from '../../utils/i18n_utils';

interface File_Upload_Props {
    p_label: string;
    p_id?: string;
    p_file: File | null;
    p_on_change: (file: File | null) => void;
    p_preview_url?: string;
}

export const F_File_Upload: React.FC<File_Upload_Props> = ({ p_label, p_id, p_file, p_on_change, p_preview_url }) => {
    const [is_dragging, set_is_dragging] = useState(false);
    const [preview, set_preview] = useState<string | undefined>(p_preview_url);
    const input_ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let object_url: string | undefined;

        if (p_file) {
            object_url = URL.createObjectURL(p_file);
            set_preview(object_url);
        } else {
            set_preview(p_preview_url);
        }

        return () => {
            if (object_url) {
                URL.revokeObjectURL(object_url);
            }
        };
    }, [p_file, p_preview_url]);

    const F_Handle_Drag_Over = (e: React.DragEvent) => {
        e.preventDefault();
        set_is_dragging(true);
    };

    const F_Handle_Drag_Leave = (e: React.DragEvent) => {
        e.preventDefault();
        set_is_dragging(false);
    };

    const F_Handle_Drop = (e: React.DragEvent) => {
        e.preventDefault();
        set_is_dragging(false);

        if (!e.dataTransfer.files || !e.dataTransfer.files[0]) {
            return;
        }

        const dropped_file = e.dataTransfer.files[0];
        if (F_Validate_Image_File(dropped_file) || dropped_file.type === 'image/svg+xml') {
            p_on_change(dropped_file);
            return;
        }

        alert(F_Get_Text('new_product.upload.error_type'));
    };

    const F_Handle_Click = () => {
        input_ref.current?.click();
    };

    const F_Handle_Input_Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) {
            return;
        }

        const selected_file = e.target.files[0];
        if (F_Validate_Image_File(selected_file) || selected_file.type === 'image/svg+xml') {
            p_on_change(selected_file);
            return;
        }

        alert(F_Get_Text('new_product.upload.error_type'));
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">
                {p_label}
            </label>

            <div
                onClick={F_Handle_Click}
                onDragOver={F_Handle_Drag_Over}
                onDragLeave={F_Handle_Drag_Leave}
                onDrop={F_Handle_Drop}
                className={`
          relative border-2 border-dashed rounded-lg p-4 h-48 flex items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${is_dragging ? 'border-primary bg-primary/5' : 'border-secondary/40 hover:border-primary/50 bg-secondary/5'}
        `}
            >
                <input
                    id={p_id}
                    type="file"
                    ref={input_ref}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.tiff,.svg,.heic,.heif"
                    onChange={F_Handle_Input_Change}
                />

                {preview ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <span className="text-white text-sm font-medium">{F_Get_Text('new_product.upload.change_photo')}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center pointer-events-none">
                        <svg className="mx-auto h-8 w-8 text-secondary/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-secondary text-sm block">
                            {F_Get_Text('new_product.upload.click_to_upload')}
                        </span>
                        <span className="text-secondary/60 text-xs block mt-1">
                            {F_Get_Text('new_product.upload.file_format')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
