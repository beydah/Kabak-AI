// client/src/context/JobContext.tsx
import { createContext, useContext } from 'react';
import { I_Error_Log } from '../utils/storage_utils';

export interface JobContextType {
    error_logs: I_Error_Log[];
    clear_logs: () => void;
    remove_log: (id: string) => void;
    refresh_logs: () => void;
    cancel_job: (id: string) => Promise<void>;
}

export const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobManager = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobManager must be used within a F_Job_Provider');
    }
    return context;
};
