import React from 'react';
import { F_Icon } from '../atoms/icon';

interface Social_Link_Props {
    p_type: 'instagram' | 'twitter' | 'linkedin';
    p_url: string;
}

export const F_Social_Link: React.FC<Social_Link_Props> = ({
    p_type,
    p_url,
}) => {
    return (
        <a
            href={p_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-secondary/20 hover:bg-primary hover:text-white transition-colors"
        >
            <F_Icon p_name={p_type} p_size={20} />
        </a>
    );
};
