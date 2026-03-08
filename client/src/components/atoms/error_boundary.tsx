import React, { Component, ErrorInfo, ReactNode } from 'react';
import { F_Get_Text } from '../../utils/i18n_utils';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class F_Error_Boundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark p-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl max-w-md w-full text-center border border-red-200 dark:border-red-800/30">
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{F_Get_Text('error_boundary.title')}</h2>
                        <p className="text-text-light dark:text-text-dark mb-6 opacity-80">
                            {this.state.error?.message || F_Get_Text('error_boundary.message_fallback')}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                            {F_Get_Text('error_boundary.reload')}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
