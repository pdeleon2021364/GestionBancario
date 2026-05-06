import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";

export const AvatarUser = () => {

    const { user, logout } = useAuthStore();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null)

    const navigate = useNavigate()

    const togleMenu = () => setOpen((prev) => !prev);

    useEffect(() => {
        const handleClickOutside = (evento) => {
            if (dropdownRef.current && !dropdownRef.current.contains(evento.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)

        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true })
    }

    const initial = user?.nombre?.charAt(0)?.toUpperCase() || "A"

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={togleMenu}
                className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center cursor-pointer transition-all"
                style={{
                    background: 'linear-gradient(135deg, #0284c7, #22d3ee)',
                    color: '#020d1a',
                    boxShadow: open ? '0 0 0 3px rgba(34,211,238,0.35)' : '0 0 0 2px rgba(34,211,238,0.15)'
                }}
            >
                {initial}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden animate-fadeIn z-50"
                    style={{
                        background: 'var(--navy-700)',
                        border: '1px solid rgba(14,165,233,0.2)',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
                    }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(14,165,233,0.12)' }}>
                        <p className="font-semibold text-sm" style={{ color: '#e0f2fe' }}>{user?.nombre}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                    <ul className="p-2">
                        <li>
                            <Link to="/dashboard"
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/usuarios"
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Usuarios
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ color: '#f87171' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Cerrar sesión
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}
