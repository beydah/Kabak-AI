import React from 'react';
import { F_Header } from '../organisms/header';
import { F_Footer } from '../organisms/footer';

interface Main_Template_Props {
    children: React.ReactNode;
    p_is_authenticated?: boolean;
}

export const F_Main_Template: React.FC<Main_Template_Props> = ({
    children,
    p_is_authenticated = false,
}) => {
    return (
        <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors">
            <F_Header p_is_authenticated={p_is_authenticated} />
            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
                {children}
            </main>
            <F_Footer />
        </div>
    );
};
