'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../providers';

const quickLogins = [
    {
        email: 'sottodennis@gmail.com',
        password: 'Denskie123',
        name: 'Dennis Sotto',
        role: 'Super Admin',
        icon: '👑',
        gradient: 'linear-gradient(135deg, hsl(270, 65%, 55%), hsl(310, 70%, 55%))',
    },
    {
        email: 'employee@mabdc.org',
        password: 'Denskie123',
        name: 'Sarah Ahmed',
        role: 'Employee',
        icon: '👤',
        gradient: 'linear-gradient(135deg, hsl(195, 75%, 50%), hsl(220, 70%, 55%))',
    },
];

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();
    const { theme, changeTheme } = useTheme();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError('Invalid email or password');
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const handleQuickLogin = async (ql) => {
        setError('');
        setLoading(true);

        const result = await signIn('credentials', {
            email: ql.email,
            password: ql.password,
            redirect: false,
        });

        if (result?.error) {
            setError('Quick login failed');
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    if (status === 'loading') {
        return (
            <div className="login-page">
                <div className="loading-spinner" style={{ margin: 'auto' }}></div>
            </div>
        );
    }

    const themes = ['default', 'ocean', 'emerald', 'sunset', 'violet', 'rose', 'amber', 'teal'];

    return (
        <div className="login-page">
            <div className="login-container animate-fadeInUp">
                <div className="login-card">
                    <div className="login-logo">HR</div>
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to MABDC HR Portal</p>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@company.ae"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: '8px' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="login-divider">Quick Access</div>

                    <div className="quick-login-section">
                        <div className="quick-login-grid">
                            {quickLogins.map((ql) => (
                                <button
                                    key={ql.email}
                                    className="quick-login-btn"
                                    onClick={() => handleQuickLogin(ql)}
                                    disabled={loading}
                                >
                                    <div className="ql-icon" style={{ background: ql.gradient, color: 'white' }}>
                                        {ql.icon}
                                    </div>
                                    <span className="ql-name">{ql.name}</span>
                                    <span className="ql-role">{ql.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Theme picker below login card */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <div className="theme-picker">
                        {themes.map((t) => (
                            <button
                                key={t}
                                className={`theme-dot ${theme === t ? 'active' : ''}`}
                                data-theme={t}
                                onClick={() => changeTheme(t)}
                                title={t.charAt(0).toUpperCase() + t.slice(1)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
