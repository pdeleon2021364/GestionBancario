import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

export const DashboardContainer = ({ children }) => {
    return (
        <div className="dashboard-shell min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-6 dashboard-main" style={{ color: 'var(--text-primary)' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
