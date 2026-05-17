import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";

const getSafeImageUrl = (value) => {
    if (!value || typeof value !== "string") return "";
    const trimmed = value.trim();
    if (trimmed.includes("default-avatar_ewzxwx")) return "";
    return /^(https?:\/\/|data:image\/)/i.test(trimmed) ? trimmed : "";
};

export const AvatarUser = () => {

    const { user, logout } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const dropdownRef = useRef(null)

    const navigate = useNavigate()

    const toggleMenu = () => setOpen((prev) => !prev);

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

    const displayName = user?.name || user?.username || "Administrador";
    const initial = displayName.charAt(0).toUpperCase();
    const profileImage = !imageFailed ? getSafeImageUrl(user?.profilePicture) : "";

    useEffect(() => {
        setImageFailed(false);
    }, [user?.profilePicture]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleMenu}
                className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center overflow-hidden cursor-pointer transition-all"
                style={{
                    background: profileImage ? 'transparent' : 'linear-gradient(135deg, #0284c7, #22d3ee)',
                    color: '#020d1a',
                    boxShadow: open ? '0 0 0 3px rgba(34,211,238,0.35)' : '0 0 0 2px rgba(34,211,238,0.15)'
                }}
            >
                {profileImage ? (
                    <img
                        src={profileImage}
                        alt={displayName}
                        onError={() => setImageFailed(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <span>{initial}</span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden animate-fadeIn z-50"
                    style={{
                        background: 'var(--navy-700)',
                        border: '1px solid rgba(14,165,233,0.2)',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
                    }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(14,165,233,0.12)' }}>
                        <p className="font-semibold text-sm" style={{ color: '#e0f2fe' }}>{displayName}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email || user?.role}</p>
                    </div>
                    <ul className="p-2">
                        <li>
                            <Link to="/dashboard/perfil"
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Mi perfil
                            </Link>
                        </li>
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
