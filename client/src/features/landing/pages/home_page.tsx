import React from 'react';
import { F_Header } from '@/shared/ui/organisms/header';
import { F_Footer } from '@/shared/ui/organisms/footer';
import { F_Hero_Section } from '../ui/hero_section';
import { F_Features_Section } from '../ui/features_section';
import { F_About_Section } from '../ui/about_section';
import { F_AI_Models_Section } from '../ui/ai_models_section';
import { F_Open_Source_Section } from '../ui/open_source_section';
import { F_Contact_Section } from '../ui/contact_section';

export const F_Home_Page: React.FC = () => {
    const F_Handle_Get_Started = () => {
        window.open('https://beydahsaglam.com', '_blank');
    };

    const F_Handle_Learn_More = () => {
        const element = document.getElementById('features');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors">
            <F_Header p_is_landing={true} />

            <main>
                <F_Hero_Section
                    p_on_cta_click={F_Handle_Get_Started}
                    p_on_learn_more={F_Handle_Learn_More}
                />
                <F_Features_Section />
                <F_About_Section />
                <F_AI_Models_Section />
                <F_Open_Source_Section />
                <F_Contact_Section />
            </main>

            <F_Footer />
        </div>
    );
};
