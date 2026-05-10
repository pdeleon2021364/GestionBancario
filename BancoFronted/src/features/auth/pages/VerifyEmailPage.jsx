import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { useVerifyEmail } from "../hooks/useVerifyEmail";

export const VerifyEmailPage = () => {

    const location = useLocation();
    const navigate = useNavigate();

    const token = new URLSearchParams(location.search).get("token")

    const handleFinish = useCallback(() => {
        setTimeout(() => navigate("/"), 2000)
    }, [navigate]);

    const { status, message } = useVerifyEmail(token, handleFinish);

    const displayMessage =
        status === "loading" ? "Verificando correo, por favor espera..." : message;

    return (
        <div className="auth-bg min-h-screen flex flex-col justify-center items-center px-4 gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0284c7, #22d3ee)', boxShadow: '0 0 40px rgba(14,165,233,0.35)' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
            </div>

            {status === "loading" && (
                <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: '#22d3ee', borderRightColor: 'rgba(34,211,238,0.3)' }} />
            )}

            <p
                className="text-base font-semibold text-center max-w-md"
                style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}
                aria-live="polite"
            >
                {displayMessage}
            </p>
        </div>
    )
}
