import React from 'react';
import { F_Text } from '../atoms/text';
import { F_Button } from '../atoms/button';
import { F_Get_Text } from '../../utils/i18n_utils';

interface Hero_Section_Props {
    p_on_cta_click?: () => void;
    p_on_learn_more?: () => void;
}

export const F_Hero_Section: React.FC<Hero_Section_Props> = ({
    p_on_cta_click = () => {
        const element = document.getElementById('contact');
        element?.scrollIntoView({ behavior: 'smooth' });
    },
    p_on_learn_more,
}) => {
    return (
        <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-bg-light via-bg-light to-primary/10 dark:from-bg-dark dark:via-bg-dark dark:to-primary/20 transition-colors" />

            <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 py-20 relative z-10 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-block mb-6 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                        <span className="text-primary text-sm font-medium">{F_Get_Text('hero.badge')}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-light dark:text-text-dark mb-6 leading-tight">
                        {F_Get_Text('hero.title')}
                    </h1>

                    <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10">
                        {F_Get_Text('hero.subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <F_Button
                            p_label={F_Get_Text('home.cta.request_installation')}
                            p_variant="primary"
                            p_on_click={p_on_cta_click}
                            p_class_name="text-lg px-8 py-4"
                        />
                        <F_Button
                            p_label={F_Get_Text('hero.cta_secondary')}
                            p_variant="ghost"
                            p_on_click={p_on_learn_more}
                            p_class_name="text-lg px-8 py-4"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
