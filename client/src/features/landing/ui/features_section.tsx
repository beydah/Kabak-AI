import React from 'react';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Get_Text } from '@/shared/utils/i18n_utils';
import { UserRound, Palette, Video, Glasses } from 'lucide-react';

type FeatureItem = {
    key: 'mannequin' | 'background' | 'video' | 'accessories';
    icon: React.ReactNode;
};

const FEATURES: FeatureItem[] = [
    { key: 'mannequin', icon: <UserRound size={28} className="text-primary" /> },
    { key: 'background', icon: <Palette size={28} className="text-primary" /> },
    { key: 'video', icon: <Video size={28} className="text-primary" /> },
    { key: 'accessories', icon: <Glasses size={28} className="text-primary" /> },
];

export const F_Features_Section: React.FC = () => {
    return (
        <section id="features" className="py-20 bg-secondary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <F_Text p_variant="h1" p_class_name="mb-4">
                        {F_Get_Text('features.title')}
                    </F_Text>
                    <p className="text-secondary text-lg max-w-2xl mx-auto">
                        {F_Get_Text('features.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.key}
                            className="p-6 bg-bg-light dark:bg-bg-dark rounded-2xl border border-secondary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="mb-4">{feature.icon}</div>
                            <F_Text p_variant="h3" p_class_name="mb-2">
                                {F_Get_Text(`features.items.${feature.key}.title`)}
                            </F_Text>
                            <p className="text-secondary text-sm">
                                {F_Get_Text(`features.items.${feature.key}.description`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
