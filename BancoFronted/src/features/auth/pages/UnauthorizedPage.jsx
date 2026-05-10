export const UnauthorizedPage = () => {
    return (
        <div className="auth-bg min-h-screen flex flex-col items-center justify-center gap-4 px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <svg className="w-8 h-8" style={{ color: '#f87171' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#e0f2fe', fontFamily: "'Space Grotesk', sans-serif" }}>
                Acceso Denegado
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Solo los administradores pueden acceder a esta sección
            </p>
        </div>
    )
}
