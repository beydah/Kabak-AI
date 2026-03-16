import React from 'react';

interface Text_Props {
    children: React.ReactNode;
    p_variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
    p_class_name?: string;
}

export const F_Text: React.FC<Text_Props> = ({
    children,
    p_variant = 'body',
    p_class_name = '',
}) => {
    const variant_classes = {
        h1: 'text-4xl font-bold',
        h2: 'text-2xl font-semibold',
        h3: 'text-xl font-medium',
        body: 'text-base',
        caption: 'text-sm text-secondary',
    };

    const Tag = p_variant === 'h1' ? 'h1' : p_variant === 'h2' ? 'h2' : p_variant === 'h3' ? 'h3' : 'p';

    return (
        <Tag className={`text-text-light dark:text-text-dark ${variant_classes[p_variant]} ${p_class_name}`}>
            {children}
        </Tag>
    );
};
