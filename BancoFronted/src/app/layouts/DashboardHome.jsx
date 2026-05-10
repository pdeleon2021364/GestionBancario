import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

const ModuleCard = ({ to, title, description, metric, accent = "cyan" }) => (
    <Link to={to} className={`intro-module module-${accent}`}>
        <div>
            <span className="module-kicker">{metric}</span>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
        <span className="module-link">Abrir</span>
    </Link>
);

const FlowStep = ({ number, title, text }) => (
    <div className="flow-step">
        <span>{number}</span>
        <div>
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    </div>
);

export const DashboardHome = () => {
    const user = useAuthStore((state) => state.user);
    const displayName = user?.name || user?.username || "Administrador";

    return (
        <section className="dashboard-home intro-home">
            <div className="intro-hero animate-fadeInUp">
                <div className="intro-copy">
                    <p className="dash-label">GestionBanco Command Center</p>
                    <h1>Bienvenido, {displayName}. Tu banco en modo futuro.</h1>
                    <p>
                        Administra usuarios, cuentas, transacciones, productos financieros y divisas
                        desde una experiencia centralizada, visual y lista para operar con precisión.
                    </p>
                    <div className="intro-actions">
                        <Link to="/dashboard/usuarios" className="intro-primary">
                            Empezar gestión
                        </Link>
                        <Link to="/dashboard/transacciones" className="intro-secondary">
                            Ver operaciones
                        </Link>
                    </div>
                </div>

                <div className="bank-holo" aria-hidden="true">
                    <div className="holo-card holo-main">
                        <span>GestionBanco</span>
                        <strong>Q 18.42M</strong>
                        <small>Capital supervisado</small>
                    </div>
                    <div className="holo-card holo-float top">
                        <span>8,294</span>
                        <small>Transacciones hoy</small>
                    </div>
                    <div className="holo-card holo-float bottom">
                        <span>99.98%</span>
                        <small>Disponibilidad</small>
                    </div>
                    <div className="holo-grid" />
                </div>
            </div>

            <div className="intro-strip animate-fadeInUp delay-100">
                <span>Sistema activo</span>
                <span>JWT protegido</span>
                <span>Roles administrativos</span>
                <span>Monitoreo bancario</span>
            </div>

            <div className="intro-layout">
                <article className="bank-panel intro-panel animate-fadeInUp delay-200">
                    <div className="panel-heading">
                        <div>
                            <p className="dash-label">Módulos principales</p>
                            <h2>Todo lo importante a un clic</h2>
                        </div>
                    </div>
                    <div className="intro-modules">
                        <ModuleCard
                            to="/dashboard/usuarios"
                            title="Usuarios"
                            description="Controla accesos, roles y perfiles administrativos."
                            metric="Identidad"
                        />
                        <ModuleCard
                            to="/dashboard/cuentas"
                            title="Cuentas bancarias"
                            description="Consulta estados, titulares y salud operativa de cuentas."
                            metric="Core"
                            accent="green"
                        />
                        <ModuleCard
                            to="/dashboard/transacciones"
                            title="Transacciones"
                            description="Supervisa movimientos, auditoría y actividad financiera."
                            metric="En vivo"
                            accent="blue"
                        />
                        <ModuleCard
                            to="/dashboard/productos"
                            title="Productos financieros"
                            description="Gestiona el portafolio de servicios bancarios."
                            metric="Portafolio"
                            accent="amber"
                        />
                    </div>
                </article>

                <aside className="bank-panel intro-status animate-fadeInUp delay-300">
                    <p className="dash-label">Estado de plataforma</p>
                    <h2>Operación estable</h2>
                    <div className="status-orb">
                        <span />
                        <strong>98</strong>
                    </div>
                    <p>
                        Seguridad, autenticación y navegación administrativa funcionando dentro de
                        parámetros normales.
                    </p>
                </aside>
            </div>

            <article className="bank-panel intro-flow animate-fadeInUp delay-400">
                <div className="panel-heading">
                    <div>
                        <p className="dash-label">Cómo fluye GestionBanco</p>
                        <h2>De acceso seguro a operación bancaria</h2>
                    </div>
                </div>
                <div className="flow-grid">
                    <FlowStep number="01" title="Autenticación" text="Ingreso con token seguro, refresh y roles administrativos." />
                    <FlowStep number="02" title="Gestión" text="Administra usuarios, cuentas, productos y divisas desde el panel." />
                    <FlowStep number="03" title="Operación" text="Supervisa transacciones y movimientos clave del banco." />
                    <FlowStep number="04" title="Control" text="Mantén visibilidad ejecutiva con una interfaz clara y futurista." />
                </div>
            </article>
        </section>
    );
};
