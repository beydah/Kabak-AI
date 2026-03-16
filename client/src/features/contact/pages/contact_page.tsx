import React from 'react';
import { F_Main_Template } from '@/shared/ui/templates/main_template';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Icon } from '@/shared/ui/atoms/icon';
import { F_Social_Link } from '@/shared/ui/molecules/social_link';
import { F_Get_Text } from '@/shared/utils/i18n_utils';

const CONTACT_INFO = {
    email: 'info@kabak.ai',
    phone: '+90 555 123 4567',
    socials: {
        instagram: 'https://instagram.com/kabak_ai',
        twitter: 'https://twitter.com/kabak_ai',
        linkedin: 'https://linkedin.com/company/kabak-ai',
    },
};

export const F_Contact_Page: React.FC = () => {
    return (
        <F_Main_Template>
            <div className="max-w-2xl mx-auto">
                <F_Text p_variant="h1" p_class_name="mb-8 text-center">
                    {F_Get_Text('contact.title')}
                </F_Text>

                <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                        <F_Icon p_name="email" p_size={24} p_class_name="text-primary" />
                        <div>
                            <F_Text p_variant="caption">{F_Get_Text('contact.email_label')}</F_Text>
                            <F_Text p_variant="body">{CONTACT_INFO.email}</F_Text>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                        <F_Icon p_name="phone" p_size={24} p_class_name="text-primary" />
                        <div>
                            <F_Text p_variant="caption">{F_Get_Text('contact.phone_label')}</F_Text>
                            <F_Text p_variant="body">{CONTACT_INFO.phone}</F_Text>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="p-4 bg-secondary/10 rounded-lg">
                        <F_Text p_variant="caption" p_class_name="mb-4">
                            {F_Get_Text('contact.social_label')}
                        </F_Text>
                        <div className="flex gap-4">
                            <F_Social_Link p_type="instagram" p_url={CONTACT_INFO.socials.instagram} />
                            <F_Social_Link p_type="twitter" p_url={CONTACT_INFO.socials.twitter} />
                            <F_Social_Link p_type="linkedin" p_url={CONTACT_INFO.socials.linkedin} />
                        </div>
                    </div>
                </div>
            </div>
        </F_Main_Template>
    );
};
