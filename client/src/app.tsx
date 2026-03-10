import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { app_router } from './routes/router';
import { F_Error_Boundary } from './components/atoms/error_boundary';
import { F_Job_Provider } from './components/providers/job_manager';
import { F_Use_Language } from './utils/i18n_utils';

function App() {
    F_Use_Language();
    return (
        <F_Error_Boundary>
            <F_Job_Provider>
                <RouterProvider router={app_router} />
            </F_Job_Provider>
        </F_Error_Boundary>
    );
}

export default App;


