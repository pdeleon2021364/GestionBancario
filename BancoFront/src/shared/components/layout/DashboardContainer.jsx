import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

export const DashboardContainer = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--deep-navy)' }}>
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-6" style={{ color: 'var(--text-primary)' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
