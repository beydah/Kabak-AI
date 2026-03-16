import React from 'react';

interface Auth_Template_Props {
    children: React.ReactNode;
}

export const F_Auth_Template: React.FC<Auth_Template_Props> = ({
    children,
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors">
            <div className="w-full max-w-md p-8 bg-white dark:bg-bg-dark rounded-xl shadow-lg border border-secondary/30">
                {children}
            </div>
        </div>
    );
};
