import { Link } from "react-router-dom";
import { useAuthStore } from "../../auth/store/authStore.js";

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
    <section className="dashboard-home intro-home animate-fadeInUp">
      <div className="intro-hero">
        <div className="intro-copy">
          <p className="dash-label">Kinal Sports • Panel administrativo</p>
          <h1>Bienvenido, {displayName}.</h1>
          <p>
            Gestiona usuarios, torneos, equipos, canchas y reservas desde una
            vista moderna, clara y preparada para operaciones diarias.
          </p>
          <div className="intro-actions">
            <Link to="/dashboard/users" className="intro-primary">
              Gestionar usuarios
            </Link>
            <Link to="/dashboard/tournaments" className="intro-secondary">
              Ver torneos
            </Link>
          </div>
        </div>

        <div className="bank-holo" aria-hidden="true">
          <div className="holo-card holo-main">
            <span>Panel</span>
            <strong>Central</strong>
            <small>Operación activa</small>
          </div>
          <div className="holo-card holo-float top">
            <span>Seguridad</span>
            <small>JWT activo</small>
          </div>
          <div className="holo-card holo-float bottom">
            <span>Monitoreo</span>
            <small>En tiempo real</small>
          </div>
          <div className="holo-grid" />
        </div>
      </div>

      <div className="intro-strip animate-fadeInUp delay-100">
        <span>Acceso seguro</span>
        <span>Gestión centralizada</span>
        <span>Panel intuitivo</span>
        <span>Operaciones ágiles</span>
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
              to="/dashboard/users"
              title="Usuarios"
              description="Revisa perfiles, roles y actividad registrada del sistema."
              metric="Identidad"
              accent="blue"
            />
            <ModuleCard
              to="/dashboard/teams"
              title="Equipos"
              description="Administra equipos y sus responsables en una sola vista."
              metric="Club"
              accent="green"
            />
            <ModuleCard
              to="/dashboard/tournaments"
              title="Torneos"
              description="Controla competiciones, estados y organización de eventos."
              metric="Competencia"
              accent="cyan"
            />
            <ModuleCard
              to="/dashboard/fields"
              title="Canchas"
              description="Consulta disponibilidad y configuración de cada sede."
              metric="Espacios"
              accent="amber"
            />
            <ModuleCard
              to="/dashboard/reservations"
              title="Reservaciones"
              description="Supervisa reservas, estados y seguimiento de operaciones."
              metric="Movimientos"
              accent="blue"
            />
          </div>
        </article>

        <aside className="bank-panel intro-status animate-fadeInUp delay-300">
          <p className="dash-label">Estado del sistema</p>
          <h2>Todo listo para operar</h2>
          <div className="status-orb">
            <span />
            <strong>OK</strong>
          </div>
          <p>
            Tu sesión está protegida y los módulos principales están listos para
            gestionar la operación del día a día.
          </p>
        </aside>
      </div>

      <article className="bank-panel intro-flow animate-fadeInUp delay-400">
        <div className="panel-heading">
          <div>
            <p className="dash-label">Cómo fluye el panel</p>
            <h2>De la gestión a la operación</h2>
          </div>
        </div>
        <div className="flow-grid">
          <FlowStep number="01" title="Autenticación" text="Ingreso con sesión segura y permisos de administrador." />
          <FlowStep number="02" title="Gestión" text="Administra usuarios, equipos, canchas y torneos desde el tablero." />
          <FlowStep number="03" title="Operación" text="Supervisa reservaciones y estados en tiempo real." />
          <FlowStep number="04" title="Control" text="Mantén la visibilidad del negocio con una interfaz clara." />
        </div>
      </article>
    </section>
  );
};
