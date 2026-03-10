import React from 'react';
import { F_Text } from '../atoms/text';
import { F_Get_Text } from '../../utils/i18n_utils';
import { BadgeDollarSign, Gauge, Sparkles } from 'lucide-react';

type StatItem = {
    key: 'cost_reduction' | 'time_saved' | 'quality';
    icon: React.ReactNode;
};

const STATS: StatItem[] = [
    { key: 'cost_reduction', icon: <BadgeDollarSign size={20} className="text-primary" /> },
    { key: 'time_saved', icon: <Gauge size={20} className="text-primary" /> },
    { key: 'quality', icon: <Sparkles size={20} className="text-primary" /> },
];

export const F_About_Section: React.FC = () => {
    const [split_percent, set_split_percent] = React.useState(50);
    const [is_dragging, set_is_dragging] = React.useState(false);
    const slider_ref = React.useRef<HTMLDivElement>(null);

    const F_Update_Split = React.useCallback((client_x: number) => {
        const slider = slider_ref.current;
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const ratio = ((client_x - rect.left) / rect.width) * 100;
        const normalized = Math.max(0, Math.min(100, ratio));
        set_split_percent(normalized);
    }, []);

    React.useEffect(() => {
        if (!is_dragging) return;

        const F_On_Move = (event: PointerEvent) => {
            F_Update_Split(event.clientX);
        };

        const F_On_Up = () => {
            set_is_dragging(false);
        };

        window.addEventListener('pointermove', F_On_Move);
        window.addEventListener('pointerup', F_On_Up);

        return () => {
            window.removeEventListener('pointermove', F_On_Move);
            window.removeEventListener('pointerup', F_On_Up);
        };
    }, [is_dragging, F_Update_Split]);

    const F_Handle_Pointer_Down = (event: React.PointerEvent<HTMLDivElement>) => {
        set_is_dragging(true);
        F_Update_Split(event.clientX);
    };

    return (
        <section id="about" className="py-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <F_Text p_variant="h1" p_class_name="mb-4">
                            {F_Get_Text('about.title')}
                        </F_Text>
                        <p className="text-primary text-lg mb-4">
                            {F_Get_Text('about.subtitle')}
                        </p>
                        <p className="text-secondary leading-relaxed mb-8">
                            {F_Get_Text('about.description')}
                        </p>

                        <div className="grid grid-cols-3 gap-4">
                            {STATS.map((stat) => (
                                <div key={stat.key} className="text-center p-4 bg-secondary/10 rounded-xl border border-secondary/10">
                                    <div className="flex justify-center mb-2">{stat.icon}</div>
                                    <p className="text-sm font-medium text-text-light dark:text-text-dark">
                                        {F_Get_Text(`about.stats.${stat.key}`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div
                            ref={slider_ref}
                            onPointerDown={F_Handle_Pointer_Down}
                            className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-secondary/20 shadow-2xl bg-secondary/10 select-none cursor-ew-resize"
                        >
                            <img
                                src="/images/about-after.jpg"
                                alt={F_Get_Text('about.before_label')}
                                className="absolute inset-0 w-full h-full object-cover"
                                draggable={false}
                            />

                            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split_percent}% 0 0)` }}>
                                <img
                                    src="/images/about-before.jpg"
                                    alt={F_Get_Text('about.after_label')}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    draggable={false}
                                />
                            </div>

                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
                                style={{ left: `${split_percent}%` }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white text-primary border border-primary/20 shadow-lg flex items-center justify-center font-bold"
                                style={{ left: `${split_percent}%` }}
                            >
                                ||
                            </div>

                            <div className="absolute left-3 top-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">
                                {F_Get_Text('about.before_label')}
                            </div>
                            <div className="absolute right-3 top-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">
                                {F_Get_Text('about.after_label')}
                            </div>
                        </div>

                        <p className="text-xs text-secondary mt-3 text-center">
                            {F_Get_Text('about.slider_hint')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
