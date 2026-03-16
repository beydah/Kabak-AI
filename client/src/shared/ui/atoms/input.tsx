import React from 'react';

interface Input_Props {
    p_type?: 'text' | 'password' | 'email' | 'number';
    p_placeholder?: string;
    p_value?: string;
    p_on_change?: (p_value: string) => void;
    p_name?: string;
    p_disabled?: boolean;
    p_class_name?: string;
}

export const F_Input: React.FC<Input_Props> = ({
    p_type = 'text',
    p_placeholder = '',
    p_value,
    p_on_change,
    p_name,
    p_disabled = false,
    p_class_name = '',
}) => {
    return (
        <input
            type={p_type}
            name={p_name}
            placeholder={p_placeholder}
            value={p_value}
            onChange={(e) => p_on_change?.(e.target.value)}
            disabled={p_disabled}
            className={`w-full px-4 py-2 rounded-lg border border-secondary bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all ${p_class_name}`}
        />
    );
};
