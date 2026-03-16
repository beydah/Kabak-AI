import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Modal_Props {
    p_is_open: boolean;
    p_on_close: () => void;
    p_title?: string;
    children: React.ReactNode;
}

export const F_Modal: React.FC<Modal_Props> = ({ p_is_open, p_on_close, p_title, children }) => {
    const [visible, setVisible] = React.useState(false);
    const [render, setRender] = React.useState(false);

    useEffect(() => {
        if (p_is_open) {
            setRender(true);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [p_is_open]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (p_is_open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset'; // Restore
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [p_is_open]);

    if (!render) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={p_on_close}>
            <div
                className={`bg-white dark:bg-[#0A0A0A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative transition-all duration-300 transform ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-secondary/10 sticky top-0 bg-white dark:bg-[#0A0A0A] z-10">
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                        {p_title}
                    </h2>
                    <button
                        onClick={p_on_close}
                        className="p-1 rounded-full hover:bg-secondary/10 text-secondary transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
