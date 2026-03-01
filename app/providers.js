'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function Providers({ children, session }) {
    const [theme, setTheme] = useState('default');

    useEffect(() => {
        const saved = localStorage.getItem('hr-theme');
        if (saved) setTheme(saved);
    }, []);

    const changeTheme = (t) => {
        setTheme(t);
        localStorage.setItem('hr-theme', t);
        if (t === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', t);
        }
    };

    useEffect(() => {
        if (theme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme]);

    return (
        <SessionProvider session={session}>
            <ThemeContext.Provider value={{ theme, changeTheme }}>
                {children}
            </ThemeContext.Provider>
        </SessionProvider>
    );
}
