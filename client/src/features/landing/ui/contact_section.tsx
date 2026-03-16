import React from 'react';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Icon } from '@/shared/ui/atoms/icon';
import { F_Button } from '@/shared/ui/atoms/button';
import { F_Get_Text } from '@/shared/utils/i18n_utils';

export const F_Contact_Section: React.FC = () => {
    const contact_email = F_Get_Text('contact.contact_email');
    const social_links = [
        {
            key: 'github_personal',
            icon: 'github',
            url: 'https://github.com/beydah',
            label: F_Get_Text('contact.links.github_personal')
        },
        {
            key: 'linkedin',
            icon: 'linkedin',
            url: 'https://linkedin.com/in/beydah',
            label: F_Get_Text('contact.links.linkedin')
        },
        {
            key: 'website',
            icon: 'globe',
            url: 'https://beydahsaglam.com',
            label: F_Get_Text('contact.links.website')
        },
    ];

    const F_Handle_Contact = () => {
        window.open('https://beydahsaglam.com', '_blank');
    };

    return (
        <section id="contact" className="py-20">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <F_Text p_variant="h1" p_class_name="mb-4">
                            {F_Get_Text('contact.title')}
                        </F_Text>
                        <p className="text-secondary">
                            {F_Get_Text('contact.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* Email */}
                        <div className="col-span-1 md:col-span-2 p-6 bg-secondary/10 rounded-2xl flex items-center justify-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                <F_Icon p_name="email" p_size={24} p_class_name="text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-secondary">{F_Get_Text('contact.email_label')}</p>
                                <a
                                    href={`mailto:${contact_email}`}
                                    className="font-medium text-text-light dark:text-text-dark hover:text-primary transition-colors"
                                >
                                    {contact_email}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* CTA Banner */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-2xl border border-primary/20 text-center mb-12">
                        <F_Text p_variant="h2" p_class_name="mb-4">
                            {F_Get_Text('contact.cta')}
                        </F_Text>
                        <F_Button
                            p_label={F_Get_Text('contact.cta_button')}
                            p_variant="primary"
                            p_on_click={F_Handle_Contact}
                            p_class_name="px-8"
                        />
                    </div>

                    {/* Social Links */}
                    <div>
                        <p className="text-sm text-secondary text-center mb-6">{F_Get_Text('contact.social_label')}</p>
                        <div className="flex justify-center flex-wrap gap-4">
                            {social_links.map((link) => (
                                <a
                                    key={link.key}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4 bg-secondary/10 hover:bg-primary/10 border border-secondary/20 hover:border-primary/50 rounded-xl transition-all group min-w-[120px]"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <F_Icon
                                            p_name={link.icon as any}
                                            p_size={24}
                                            p_class_name="text-secondary group-hover:text-primary transition-colors"
                                        />
                                        <span className="text-xs font-medium text-text-light dark:text-text-dark">
                                            {link.label}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
