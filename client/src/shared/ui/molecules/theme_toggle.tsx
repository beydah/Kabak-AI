import React from 'react';
import { F_Icon } from '../atoms/icon';
import { F_Transition_Theme, F_Get_Theme } from '../../utils/theme_utils';

interface Theme_Toggle_Props {
    p_class_name?: string;
}

export const F_Theme_Toggle: React.FC<Theme_Toggle_Props> = ({
    p_class_name = '',
}) => {
    const [current_theme, set_current_theme] = React.useState(F_Get_Theme());

    React.useEffect(() => {
        const handle_theme_change = () => {
            set_current_theme(F_Get_Theme());
        };
        window.addEventListener('theme-change', handle_theme_change);
        return () => window.removeEventListener('theme-change', handle_theme_change);
    }, []);

    const handle_toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Use the advanced transition
        // We don't need to manually set state here, the event listener will catch it after the transition completes
        // BUT for instant feedback/icon swap? No, icon should swap when theme swaps.
        // F_Transition_Theme handles the delay.
        F_Transition_Theme(e);
    };

    return (
        <button
            onClick={handle_toggle}
            className={`p-2 rounded-full hover:bg-secondary/20 transition-colors ${p_class_name}`}
            aria-label="Toggle theme"
        >
            <F_Icon p_name={current_theme === 'light' ? 'moon' : 'sun'} p_size={20} />
        </button>
    );
};

