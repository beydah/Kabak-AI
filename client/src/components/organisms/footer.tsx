import React from 'react';
import { F_Get_Text } from '../../utils/i18n_utils';

export const F_Footer: React.FC = () => {
    return (
        <footer className="py-8 transition-colors bg-bg-dark text-text-dark dark:bg-[#1E293B] dark:text-text-dark border-t border-secondary/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm opacity-80">
                            {F_Get_Text('footer.copyright')}
                        </p>
                        <p className="text-xs opacity-60 mt-1 flex gap-1 items-center justify-center md:justify-start">
                            <span>{F_Get_Text('footer.creator_prefix')}</span>
                            <a
                                href="https://beydahsaglam.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                            >
                                {F_Get_Text('footer.creator_name')}
                            </a>
                        </p>
                    </div>
                    <p className="text-sm opacity-80">
                        {F_Get_Text('footer.made_with')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
