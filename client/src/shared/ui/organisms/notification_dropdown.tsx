import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Copy, Trash2, X } from 'lucide-react';
import { useJobManager } from '../../context/JobContext';
import { F_Get_Text } from '../../utils/i18n_utils';

export const F_Notification_Dropdown: React.FC = () => {
    const { error_logs, clear_logs, remove_log } = useJobManager();
    const [show_notifications, set_show_notifications] = useState(false);
    const [is_copied, set_is_copied] = useState(false);

    const wrapper_ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const F_Handle_Click_Outside = (event: MouseEvent) => {
            if (wrapper_ref.current && !wrapper_ref.current.contains(event.target as Node)) {
                set_show_notifications(false);
            }
        };

        if (show_notifications) {
            document.addEventListener('mousedown', F_Handle_Click_Outside);
        }

        return () => {
            document.removeEventListener('mousedown', F_Handle_Click_Outside);
        };
    }, [show_notifications]);

    const F_Copy_To_Clipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        set_is_copied(true);
        setTimeout(() => set_is_copied(false), 1000);
    };

    return (
        <div className="relative" ref={wrapper_ref}>
            <button
                onClick={() => set_show_notifications(!show_notifications)}
                className="p-2 hover:bg-secondary/10 rounded-full transition-colors relative"
            >
                <Bell size={24} className={error_logs.length > 0 ? 'text-primary' : 'text-secondary'} />
                {error_logs.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-bg-dark" />
                )}
            </button>

            {show_notifications && (
                <div className="fixed left-4 right-4 top-16 w-auto max-w-[calc(100vw-2rem)] bg-white dark:bg-bg-dark border border-secondary/20 rounded-xl shadow-xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 md:sm:w-96">
                    <div className="p-3 border-b border-secondary/20 flex items-center justify-between bg-secondary/5">
                        <h3 className="font-semibold text-sm">{F_Get_Text('notifications.title')}</h3>
                        <div className="flex items-center gap-2">
                            {error_logs.length > 0 && (
                                <>
                                    <button
                                        onClick={() => F_Copy_To_Clipboard(JSON.stringify(error_logs, null, 2))}
                                        className={`text-xs hover:underline ${is_copied ? 'text-green-500 font-bold' : 'text-primary'}`}
                                        disabled={is_copied}
                                    >
                                        {is_copied ? F_Get_Text('notifications.copied') : F_Get_Text('notifications.copy_all')}
                                    </button>
                                    <button
                                        onClick={clear_logs}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        {F_Get_Text('notifications.clear_all')}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => set_show_notifications(false)}
                                className="p-1 rounded hover:bg-secondary/10 text-secondary hover:text-primary"
                                title={F_Get_Text('notifications.hide')}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {error_logs.length === 0 ? (
                            <div className="p-4 text-center text-sm text-secondary">
                                {F_Get_Text('notifications.empty')}
                            </div>
                        ) : (
                            error_logs.map((log) => (
                                <div key={log.id} className="p-3 border-b border-secondary/10 hover:bg-secondary/5 transition-colors flex gap-3 text-left">
                                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">
                                            {F_Get_Text('notifications.processing_failed')}
                                        </p>
                                        <p className="text-xs text-secondary mt-0.5 line-clamp-2 break-all">
                                            {log.message}
                                        </p>
                                        <p className="text-[10px] text-secondary/60 mt-1">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 items-center">
                                        <button
                                            onClick={() => F_Copy_To_Clipboard(log.message)}
                                            className="p-1 hover:bg-secondary/10 rounded text-secondary hover:text-primary"
                                            title={F_Get_Text('notifications.copy')}
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() => remove_log(log.id)}
                                            className="p-1 hover:bg-secondary/10 rounded text-secondary hover:text-red-500"
                                            title={F_Get_Text('notifications.delete')}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
