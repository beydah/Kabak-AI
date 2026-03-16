import React from 'react';
import { Link } from 'react-router-dom';

interface Nav_Link_Props {
    p_to: string;
    p_label: string;
    p_is_active?: boolean;
    p_class_name?: string;
}

export const F_Nav_Link: React.FC<Nav_Link_Props> = ({
    p_to,
    p_label,
    p_is_active = false,
    p_class_name = '',
}) => {
    return (
        <Link
            to={p_to}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${p_is_active
                    ? 'text-primary bg-primary/10'
                    : 'text-text-light dark:text-text-dark hover:text-primary'
                } ${p_class_name}`}
        >
            {p_label}
        </Link>
    );
};
