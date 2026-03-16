import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { F_Auth_Template } from '@/shared/ui/templates/auth_template';
import { F_Text } from '@/shared/ui/atoms/text';
import { F_Input } from '@/shared/ui/atoms/input';
import { F_Button } from '@/shared/ui/atoms/button';
import { F_Get_Text } from '@/shared/utils/i18n_utils';

export const F_Login_Page: React.FC = () => {
    const navigate = useNavigate();
    const [username, set_username] = React.useState('');
    const [password, set_password] = React.useState('');
    const [error_message, set_error_message] = React.useState('');
    const [lockout_timer, set_lockout_timer] = React.useState(0);

    const F_Check_Ban_Status = () => {
        const ban_status = localStorage.getItem('login_ban_status');
        const ban_timestamp = localStorage.getItem('login_ban_timestamp');

        if (ban_status === 'active' && ban_timestamp) {
            const remaining_ms = parseInt(ban_timestamp, 10) - Date.now();
            if (remaining_ms > 0) {
                set_lockout_timer(Math.ceil(remaining_ms / 1000));
                set_error_message(F_Get_Text('login.account_locked'));
                return true;
            }

            F_Clear_Ban();
        }

        return false;
    };

    const F_Clear_Ban = () => {
        localStorage.removeItem('login_ban_status');
        localStorage.removeItem('login_ban_timestamp');
        localStorage.setItem('login_attempts', '0');
        set_lockout_timer(0);
        set_error_message('');
    };

    useEffect(() => {
        const auth_token = document.cookie.split('; ').find((row) => row.startsWith('auth_token='));
        if (auth_token) {
            navigate('/collection');
        }

        F_Check_Ban_Status();
    }, [navigate]);

    useEffect(() => {
        if (lockout_timer <= 0) {
            return;
        }

        const timer = setInterval(() => {
            set_lockout_timer((prev) => {
                if (prev <= 1) {
                    F_Clear_Ban();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [lockout_timer]);

    const F_Handle_Login = () => {
        if (lockout_timer > 0) return;
        if (F_Check_Ban_Status()) return;

        const env_username = (import.meta.env.VITE_USERNAME || '').trim();
        const env_password = (import.meta.env.VITE_PASSWORD || '').trim();
        const input_username = username.trim();
        const input_password = password.trim();

        if (!env_username || !env_password) {
            set_error_message('System Error: Auth configuration missing. Check .env file.');
            return;
        }

        if (input_username === env_username && input_password === env_password) {
            const date = new Date();
            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
            document.cookie = `auth_token=session_key; expires=${date.toUTCString()}; path=/; SameSite=Lax`;

            F_Clear_Ban();
            navigate('/collection');
            return;
        }

        set_error_message(F_Get_Text('login.invalid_credentials'));

        const current_attempts = parseInt(localStorage.getItem('login_attempts') || '0', 10) + 1;
        localStorage.setItem('login_attempts', current_attempts.toString());

        if (current_attempts >= 5) {
            const ban_end_time = Date.now() + (5 * 60 * 1000);
            localStorage.setItem('login_ban_status', 'active');
            localStorage.setItem('login_ban_timestamp', ban_end_time.toString());

            set_lockout_timer(300);
            set_error_message('Too many failed attempts. Access restricted for 5 minutes.');
        }
    };

    const F_Format_Time = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <F_Auth_Template>
            <div className="flex flex-col gap-6 w-full max-w-sm relative">
                <div className="absolute -top-16 left-0 w-full flex justify-start">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium text-sm"
                    >
                        <span>&lt; Kabak AI</span>
                    </button>
                </div>

                <F_Text p_variant="h2" p_class_name="text-center">
                    {F_Get_Text('login.title')}
                </F_Text>

                {error_message && (
                    <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center border border-red-500/20">
                        {error_message}
                    </div>
                )}

                {lockout_timer > 0 && (
                    <div className="bg-orange-500/10 text-orange-500 p-3 rounded-lg text-sm text-center border border-orange-500/20 font-mono">
                        {F_Get_Text('login.try_again_after')} {F_Format_Time(lockout_timer)}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <F_Input
                        p_value={username}
                        p_on_change={set_username}
                        p_placeholder={F_Get_Text('login.username_placeholder')}
                        p_type="text"
                        p_disabled={lockout_timer > 0}
                    />
                    <F_Input
                        p_value={password}
                        p_on_change={set_password}
                        p_placeholder={F_Get_Text('login.password_placeholder')}
                        p_type="password"
                        p_disabled={lockout_timer > 0}
                    />
                </div>

                <F_Button
                    p_label={lockout_timer > 0 ? F_Format_Time(lockout_timer) : F_Get_Text('login.submit_button')}
                    p_on_click={F_Handle_Login}
                    p_variant="primary"
                    p_class_name="w-full"
                    p_disabled={lockout_timer > 0}
                />

                <div className="text-center text-sm text-secondary mt-2">
                    {F_Get_Text('login.contact_prompt')}{' '}
                    <a
                        href="https://beydahsaglam.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                        {F_Get_Text('login.contact_link')}
                    </a>.
                </div>
            </div>
        </F_Auth_Template>
    );
};
