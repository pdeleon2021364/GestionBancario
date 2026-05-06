import { useState } from 'react'
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

const BankIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
)

export const AuthPage = () => {
    const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

    return (
        <div className="auth-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

            {/* Orbs decorativos */}
            <div className="orb absolute w-[500px] h-[500px] top-[-120px] left-[-120px]"
                style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 65%)' }} />
            <div className="orb absolute w-[400px] h-[400px] bottom-[-100px] right-[-100px]"
                style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 65%)', animationDelay: '3s' }} />
            <div className="orb absolute w-[300px] h-[300px] top-[35%] right-[8%]"
                style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 65%)', animationDelay: '1.5s' }} />

            {/* Card */}
            <div className={`login-card relative w-full rounded-2xl p-8 md:p-10 animate-fadeInUp transition-all duration-500 ${view === 'register' ? 'max-w-lg' : 'max-w-md'}`}>

                {/* Logo + Brand */}
                <div className="flex justify-center mb-7">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center animate-pulse-cyan"
                                style={{ background: 'linear-gradient(135deg, #0284c7, #22d3ee)', color: '#020d1a' }}>
                                <BankIcon />
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1.5 rounded-full"
                                style={{ background: 'rgba(34,211,238,0.45)', filter: 'blur(5px)' }} />
                        </div>
                        <div>
                            <span className="text-shimmer text-xl font-bold tracking-tight block"
                                style={{ fontFamily: "'Sora', sans-serif" }}>
                                GestionBanco
                            </span>
                            <p className="text-xs tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}>
                                PORTAL BANCARIO
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab switcher login / register */}
                {view !== 'forgot' && (
                    <div className="tab-switcher flex rounded-xl p-1 mb-8" style={{ background: 'rgba(2,13,26,0.6)', border: '1px solid rgba(14,165,233,0.12)' }}>
                        <button
                            onClick={() => setView('login')}
                            className={`tab-btn flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${view === 'login' ? 'tab-active' : ''}`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => setView('register')}
                            className={`tab-btn flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${view === 'register' ? 'tab-active' : ''}`}
                        >
                            Registrarse
                        </button>
                    </div>
                )}

                {/* Header text */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                        {view === 'login' && 'Bienvenido,'}
                        {view === 'register' && 'Crear cuenta,'}
                        {view === 'forgot' && 'Recuperar acceso,'}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {view === 'login' && 'inicia sesión para continuar'}
                        {view === 'register' && 'completa tu información'}
                        {view === 'forgot' && 'ingresa tu correo registrado'}
                    </p>
                </div>

                {/* Forms */}
                {view === 'login' && (
                    <LoginForm onForgot={() => setView('forgot')} />
                )}
                {view === 'register' && (
                    <RegisterForm onSuccess={() => setView('login')} />
                )}
                {view === 'forgot' && (
                    <ForgotPasswordForm onSwitch={() => setView('login')} />
                )}

                {/* Footer seguridad */}
                <div className="mt-7 pt-5 flex items-center justify-center gap-2"
                    style={{ borderTop: '1px solid rgba(14,165,233,0.08)' }}>
                    <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                        CONEXIÓN SEGURA · SSL 256-BIT
                    </span>
                </div>
            </div>
        </div>
    )
}
