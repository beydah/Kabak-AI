import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { F_Theme_Toggle } from '../molecules/theme_toggle';
import { F_Get_Text, F_Set_Language, F_Use_Language } from '../../utils/i18n_utils';
import { F_Transition_Theme } from '../../utils/theme_utils';
import { Menu, X, LogOut, Globe } from 'lucide-react';
import { F_Notification_Dropdown } from './notification_dropdown';

interface Header_Props {
    p_is_authenticated?: boolean;
    p_is_landing?: boolean;
}

export const F_Header: React.FC<Header_Props> = ({
    p_is_authenticated = false,
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const current_lang = F_Use_Language();
    const [is_menu_open, set_is_menu_open] = React.useState(false);
    const [is_scrolled, set_is_scrolled] = React.useState(false);

    React.useEffect(() => {
        const F_Handle_Scroll = () => {
            set_is_scrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', F_Handle_Scroll);
        return () => window.removeEventListener('scroll', F_Handle_Scroll);
    }, []);

    const F_Handle_Language_Toggle = () => {
        const new_lang = current_lang === 'en' ? 'tr' : 'en';
        F_Set_Language(new_lang);
    };

    const F_Handle_Logout = () => {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/');
    };

    const F_Scroll_To_Section = (p_section_id: string) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById(p_section_id);
                element?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        const element = document.getElementById(p_section_id);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    const landing_nav_items = [
        { id: 'about', label: F_Get_Text('nav.about') },
        { id: 'ai-models', label: F_Get_Text('nav.ai_models') },
        { id: 'open-source', label: F_Get_Text('nav.open_source') },
        { id: 'contact', label: F_Get_Text('nav.contact') },
    ];

    const logo_target = p_is_authenticated ? '/collection' : '/';
    const menu_ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const F_Handle_Click_Outside = (event: MouseEvent) => {
            if (menu_ref.current && !menu_ref.current.contains(event.target as Node)) {
                set_is_menu_open(false);
            }
        };

        if (is_menu_open) {
            document.addEventListener('mousedown', F_Handle_Click_Outside);
        }

        return () => {
            document.removeEventListener('mousedown', F_Handle_Click_Outside);
        };
    }, [is_menu_open]);

    return (
        <header className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${is_scrolled || p_is_authenticated
            ? 'bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-md shadow-md'
            : 'bg-transparent'
            }`}>
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link to={logo_target} className="text-xl font-bold flex items-center gap-0.5">
                    <span className="text-text-light dark:text-text-dark">Kabak</span>
                    <span className="text-orange-500">AI</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    {!p_is_authenticated && landing_nav_items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => F_Scroll_To_Section(item.id)}
                            className="text-sm font-medium text-text-light dark:text-text-dark hover:text-primary transition-colors"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {!p_is_authenticated && (
                        <Link
                            to="/login"
                            className="hidden md:block px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            {F_Get_Text('nav.login')}
                        </Link>
                    )}

                    {p_is_authenticated && <F_Notification_Dropdown />}

                    <div className="relative group" ref={menu_ref}>
                        <button
                            onClick={() => set_is_menu_open(!is_menu_open)}
                            className="p-2 rounded-lg hover:bg-secondary/10 text-text-light dark:text-text-dark transition-colors"
                        >
                            {is_menu_open ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {is_menu_open && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur-xl rounded-xl shadow-xl border border-secondary/20 p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                <div className="md:hidden flex flex-col gap-1 border-b border-secondary/10 pb-2 mb-2">
                                    {!p_is_authenticated && (
                                        <>
                                            {landing_nav_items.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        F_Scroll_To_Section(item.id);
                                                        set_is_menu_open(false);
                                                    }}
                                                    className="text-left px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark hover:bg-secondary/10 rounded-lg"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                            <Link
                                                to="/login"
                                                onClick={() => set_is_menu_open(false)}
                                                className="px-3 py-2 text-sm font-bold text-primary hover:bg-secondary/10 rounded-lg"
                                            >
                                                {F_Get_Text('nav.login')}
                                            </Link>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={F_Handle_Language_Toggle}
                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark hover:bg-secondary/10 rounded-lg transition-colors w-full text-left"
                                >
                                    <Globe size={18} />
                                    <span>{F_Get_Text('settings.language')} ({current_lang.toUpperCase()})</span>
                                </button>

                                <div
                                    onClick={(e) => F_Transition_Theme(e)}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span className="text-sm font-medium text-text-light dark:text-text-dark">
                                        {F_Get_Text('settings.theme')}
                                    </span>
                                    <F_Theme_Toggle />
                                </div>

                                {p_is_authenticated && (
                                    <button
                                        onClick={F_Handle_Logout}
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left mt-2 border-t border-secondary/10 pt-3"
                                    >
                                        <LogOut size={18} />
                                        <span>{F_Get_Text('nav.logout')}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};


