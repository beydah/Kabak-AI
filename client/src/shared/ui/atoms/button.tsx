import React from 'react';

interface Button_Props {
    p_label: string;
    p_on_click?: () => void;
    p_variant?: 'primary' | 'secondary' | 'ghost';
    p_type?: 'button' | 'submit' | 'reset';
    p_disabled?: boolean;
    p_class_name?: string;
}

export const F_Button: React.FC<Button_Props> = ({
    p_label,
    p_on_click,
    p_variant = 'primary',
    p_type = 'button',
    p_disabled = false,
    p_class_name = '',
}) => {
    const variant_classes = {
        primary: 'bg-primary text-white hover:opacity-90',
        secondary: 'bg-secondary text-text-light dark:text-text-dark hover:opacity-90',
        ghost: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
    };

    return (
        <button
            type={p_type}
            onClick={p_on_click}
            disabled={p_disabled}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variant_classes[p_variant]} ${p_class_name}`}
        >
            {p_label}
        </button>
    );
};
