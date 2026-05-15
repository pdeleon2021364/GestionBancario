import { Link, useLocation } from "react-router-dom"

const icons = {
    "/dashboard/usuarios": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    "/dashboard/cuentas": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
    ),
    "/dashboard/transacciones": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
    ),
    "/dashboard/productos": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75" />
        </svg>
    ),
    "/dashboard/divisas": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    "/dashboard/tipos-cambio": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75h-9m9 0l-3-3m3 3l-3 3M7.5 17.25h9m-9 0l3 3m-3-3l3-3M4.5 12a7.5 7.5 0 0112.8-5.303M19.5 12a7.5 7.5 0 01-12.8 5.303" />
        </svg>
    ),
    "/dashboard/historial": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 2.25M21 12a9 9 0 11-3.3-6.97M21 3v5h-5" />
        </svg>
    ),
}

export const Sidebar = () => {

    const location = useLocation()

    const items = [
        { label: "Usuarios",             to: "/dashboard/usuarios" },
        { label: "Cuentas Bancarias",    to: "/dashboard/cuentas" },
        { label: "Transacciones",        to: "/dashboard/transacciones" },
        { label: "Productos Financieros",to: "/dashboard/productos" },
        { label: "Divisas",              to: "/dashboard/divisas" },
        { label: "Tipos de Cambio",      to: "/dashboard/tipos-cambio" },
        { label: "Historial",            to: "/dashboard/historial" },
    ]

    return (
        <aside className="sidebar-futuristic w-60 min-h-[calc(100vh-4rem)] p-4">
            {/* sección label */}
            <p className="px-3 mb-3 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}>
                Navegación
            </p>
            <ul className="space-y-1">
                {items.map((item) => {
                    const active = location.pathname === item.to

                    return (
                        <li key={item.to}>
                            <Link
                                to={item.to}
                                className={`sidebar-item sidebar-underline flex items-center gap-3 px-3 py-2.5 ${active ? "active" : ""}`}
                            >
                                <span style={{ color: active ? '#38bdf8' : 'var(--text-muted)' }}>
                                    {icons[item.to]}
                                </span>
                                {item.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </aside>
    )
}
