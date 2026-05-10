import { AvatarUser } from "../ui/AvatarUser";
import { useAuthStore } from "../../../features/auth/store/authStore";

export const Navbar = () => {
    const role = useAuthStore((state) => state.user?.role);
    const roleLabel = role === "ADMIN_ROLE" ? "ADMIN" : "USER";

    return (
        <nav className="navbar-futuristic sticky top-0 z-50">
            <div className="max-w-full px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0284c7, #22d3ee)' }}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-bold text-base" style={{ color: '#e0f2fe', fontFamily: "'Space Grotesk', sans-serif" }}>
                            GestionBanco
                        </span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }}>
                            {roleLabel}
                        </span>
                    </div>
                </div>
                <AvatarUser />
            </div>
        </nav>
    )
}
