import React from 'react';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Button } from '@/shared/ui/atoms/button';
import { F_Get_Text } from '@/shared/utils/i18n_utils';

export const F_Open_Source_Section: React.FC = () => {
    const F_Handle_Github = () => {
        window.open('https://github.com/beydah/kabak-ai', '_blank');
    };

    const F_Handle_Support = () => {
        window.open('https://beydahsaglam.com', '_blank');
    };

    return (
        <section id="open-source" className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-text-light dark:bg-text-dark rounded-2xl mb-8">
                        <svg className="w-10 h-10 text-bg-light dark:text-bg-dark" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </div>

                    <F_Text p_variant="h1" p_class_name="mb-4">
                        {F_Get_Text('open_source.title')}
                    </F_Text>
                    <p className="text-primary text-lg mb-4">
                        {F_Get_Text('open_source.subtitle')}
                    </p>
                    <p className="text-secondary mb-8 max-w-xl mx-auto">
                        {F_Get_Text('open_source.description')}
                    </p>

                    <F_Button
                        p_label={F_Get_Text('open_source.github_button')}
                        p_variant="secondary"
                        p_on_click={F_Handle_Github}
                        p_class_name="mb-8"
                    />

                    <div className="bg-bg-light dark:bg-bg-dark p-6 rounded-xl border border-secondary/20 shadow-sm mt-8">
                        <p className="text-lg font-medium text-text-light dark:text-text-dark mb-4">
                            {F_Get_Text('open_source.cta')}
                        </p>
                        <F_Button
                            p_label={F_Get_Text('open_source.cta_button')}
                            p_variant="primary"
                            p_on_click={F_Handle_Support}
                            p_class_name="w-full sm:w-auto"
                        />
                    </div>

                    <p className="text-sm text-secondary mt-8">
                        {F_Get_Text('open_source.license')}
                    </p>
                </div>
            </div>
        </section>
    );
};
