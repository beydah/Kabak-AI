import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import '@/index.css';
import { F_Get_Preference } from '@/shared/utils/storage_utils';
import { F_Set_Language } from '@/shared/utils/i18n_utils';
import { F_Init_Theme } from '@/shared/utils/theme_utils';

const F_Initialize_App = () => {
    const saved_lang = F_Get_Preference('lang');
    if (saved_lang === 'tr' || saved_lang === 'en') {
        F_Set_Language(saved_lang);
    }

    F_Init_Theme();
};

F_Initialize_App();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
