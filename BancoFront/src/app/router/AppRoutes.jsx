import { Routes, Route } from "react-router-dom";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { DashboardPage } from "../layouts/DashboardPage.jsx";
import { RoleGuard } from "./RoleGuard.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { UnauthorizedPage } from "../../features/auth/pages/UnauthorizedPage.jsx";

// Placeholder pages — reemplazar con los módulos reales de GestionBanco
const PlaceholderPage = ({ title }) => (
    <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-2">Módulo en construcción.</p>
    </div>
)

export const AppRoutes = () => {
    return (
        <Routes>
            {/* RUTAS PUBLICAS */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />

            {/* PROTECTED ROUTES + ROLE */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["ADMIN"]}>
                            <DashboardPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            >
                <Route path="usuarios" element={<PlaceholderPage title="Usuarios" />} />
                <Route path="cuentas" element={<PlaceholderPage title="Cuentas Bancarias" />} />
                <Route path="transacciones" element={<PlaceholderPage title="Transacciones" />} />
                <Route path="productos" element={<PlaceholderPage title="Productos Financieros" />} />
                <Route path="divisas" element={<PlaceholderPage title="Divisas" />} />
            </Route>
        </Routes>
    )
}
