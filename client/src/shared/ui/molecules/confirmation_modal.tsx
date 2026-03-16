import React from 'react';
import { F_Modal } from './modal';
import { F_Button } from '../atoms/button';
import { F_Text } from '../atoms/text';

interface Confirmation_Modal_Props {
    p_is_open: boolean;
    p_on_close: () => void;
    p_on_confirm: () => void;
    p_title: string;
    p_message: string;
    p_confirm_label: string;
    p_cancel_label: string;
}

export const F_Confirmation_Modal: React.FC<Confirmation_Modal_Props> = ({
    p_is_open,
    p_on_close,
    p_on_confirm,
    p_title,
    p_message,
    p_confirm_label,
    p_cancel_label
}) => {
    return (
        <F_Modal p_is_open={p_is_open} p_on_close={p_on_close} p_title={p_title}>
            <div className="space-y-6">
                <F_Text p_variant="body" p_class_name="text-secondary">
                    {p_message}
                </F_Text>

                <div className="flex justify-end gap-3">
                    <F_Button
                        p_label={p_cancel_label}
                        p_variant="secondary"
                        p_on_click={p_on_close}
                    />
                    <F_Button
                        p_label={p_confirm_label}
                        p_variant="primary"
                        p_class_name="bg-red-500 hover:bg-red-600 border-red-500 text-white"
                        p_on_click={() => {
                            p_on_confirm();
                            p_on_close();
                        }}
                    />
                </div>
            </div>
        </F_Modal>
    );
};
