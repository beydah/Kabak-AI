import React from 'react';
import { F_Input } from '../atoms/input';
import { F_Text } from '../atoms/text';

interface Form_Field_Props {
    p_label: string;
    p_type?: 'text' | 'password' | 'email' | 'number';
    p_placeholder?: string;
    p_value?: string;
    p_on_change?: (p_value: string) => void;
    p_name?: string;
    p_error?: string;
}

export const F_Form_Field: React.FC<Form_Field_Props> = ({
    p_label,
    p_type = 'text',
    p_placeholder,
    p_value,
    p_on_change,
    p_name,
    p_error,
}) => {
    return (
        <div className="flex flex-col gap-1">
            <F_Text p_variant="caption" p_class_name="font-medium">
                {p_label}
            </F_Text>
            <F_Input
                p_type={p_type}
                p_placeholder={p_placeholder}
                p_value={p_value}
                p_on_change={p_on_change}
                p_name={p_name}
            />
            {p_error && (
                <F_Text p_variant="caption" p_class_name="text-red-500">
                    {p_error}
                </F_Text>
            )}
        </div>
    );
};
