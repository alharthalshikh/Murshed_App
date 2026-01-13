import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system' | 'scheduled';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    resolvedTheme: 'light' | 'dark';
    schedule: { start: string; end: string };
    setSchedule: (schedule: { start: string; end: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        return (localStorage.getItem('theme') as ThemeMode) || 'system';
    });
    const [schedule, setScheduleState] = useState(() => {
        const saved = localStorage.getItem('theme-schedule');
        return saved ? JSON.parse(saved) : { start: '18:00', end: '06:00' };
    });
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    const setTheme = (mode: ThemeMode) => {
        setThemeState(mode);
        localStorage.setItem('theme', mode);
    };

    const setSchedule = (s: { start: string; end: string }) => {
        setScheduleState(s);
        localStorage.setItem('theme-schedule', JSON.stringify(s));
    };

    useEffect(() => {
        const root = window.document.documentElement;

        const updateTheme = () => {
            let activeTheme: 'light' | 'dark' = 'light';

            if (theme === 'system') {
                activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } else if (theme === 'scheduled') {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();

                const [startH, startM] = schedule.start.split(':').map(Number);
                const [endH, endM] = schedule.end.split(':').map(Number);

                const startTime = startH * 60 + startM;
                const endTime = endH * 60 + endM;

                if (startTime < endTime) {
                    activeTheme = currentTime >= startTime && currentTime < endTime ? 'dark' : 'light';
                } else {
                    // Crosses midnight (e.g., 18:00 to 06:00)
                    activeTheme = currentTime >= startTime || currentTime < endTime ? 'dark' : 'light';
                }
            } else {
                activeTheme = theme as 'light' | 'dark';
            }

            root.classList.remove('light', 'dark');
            root.classList.add(activeTheme);
            setResolvedTheme(activeTheme);
        };

        updateTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        if (theme === 'scheduled') {
            const interval = setInterval(updateTheme, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [theme, schedule]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, schedule, setSchedule }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
