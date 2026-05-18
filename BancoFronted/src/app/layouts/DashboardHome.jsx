import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useState, useMemo, useEffect } from "react";
import { exchangeRatesApi, currenciesApi } from "../../shared/api/admin.js";

const getId = (item) => item?._id ?? item?.id;

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

const AdminCalculadora = () => {
    const [currencies, setCurrencies] = useState([]);
    const [calcForm, setCalcForm] = useState({ divisaBaseId: "", divisaDestinoId: "", monto: 1 });
    const [calcResult, setCalcResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState(null);

    useEffect(() => {
        currenciesApi.list().then((data) => setCurrencies(Array.isArray(data) ? data : [])).catch(() => {});
    }, []);

    const handleConvert = async (e) => {
        e.preventDefault();
        setCalcError(null);
        setCalcResult(null);
        setCalcLoading(true);
        try {
            const result = await exchangeRatesApi.convert(calcForm);
            setCalcResult(result);
        } catch (err) {
            setCalcError(err?.response?.data?.message || "No se pudo realizar la conversión.");
        } finally {
            setCalcLoading(false);
        }
    };

    const baseLabel = useMemo(() => {
        const c = currencies.find((x) => getId(x) === calcForm.divisaBaseId);
        return c ? `${c.codigo} (${c.simbolo})` : "—";
    }, [currencies, calcForm.divisaBaseId]);

    const destLabel = useMemo(() => {
        const c = currencies.find((x) => getId(x) === calcForm.divisaDestinoId);
        return c ? `${c.codigo} (${c.simbolo})` : "—";
    }, [currencies, calcForm.divisaDestinoId]);

    return (
        <aside className="bank-panel intro-status animate-fadeInUp delay-300">
            <p className="dash-label">Herramienta</p>
            <h2>Calculadora de conversión</h2>

            <form className="entity-mini-form" onSubmit={handleConvert} style={{ gap: "0.75rem", marginTop: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <small style={{ color: "var(--text-secondary)" }}>Monto</small>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={calcForm.monto}
                        onChange={(e) => setCalcForm((f) => ({ ...f, monto: e.target.value }))}
                        placeholder="Ej: 100"
                        required
                    />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <small style={{ color: "var(--text-secondary)" }}>Divisa origen</small>
                    <select
                        value={calcForm.divisaBaseId}
                        onChange={(e) => setCalcForm((f) => ({ ...f, divisaBaseId: e.target.value }))}
                        required
                    >
                        <option value="">Seleccionar</option>
                        {currencies.map((c) => (
                            <option key={getId(c)} value={getId(c)}>{c.codigo} — {c.nombre}</option>
                        ))}
                    </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <small style={{ color: "var(--text-secondary)" }}>Divisa destino</small>
                    <select
                        value={calcForm.divisaDestinoId}
                        onChange={(e) => setCalcForm((f) => ({ ...f, divisaDestinoId: e.target.value }))}
                        required
                    >
                        <option value="">Seleccionar</option>
                        {currencies.map((c) => (
                            <option key={getId(c)} value={getId(c)}>{c.codigo} — {c.nombre}</option>
                        ))}
                    </select>
                </label>

                <button type="submit" className="btn-primary" disabled={calcLoading} style={{ marginTop: "0.5rem" }}>
                    {calcLoading ? "Convirtiendo…" : "Convertir"}
                </button>
            </form>

            {calcError && (
                <p style={{ color: "#f87171", marginTop: "0.75rem", fontSize: "0.85rem" }}>{calcError}</p>
            )}

            {calcResult && !calcError && (
                <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(34,211,238,0.07)",
                    border: "1px solid rgba(34,211,238,0.2)",
                }}>
                    <p className="dash-label">Resultado</p>
                    <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--cyan-glow)", lineHeight: 1.2 }}>
                        {typeof calcResult === "object"
                            ? (calcResult.resultado ?? calcResult.montoConvertido ?? calcResult.converted ?? calcResult.convertedAmount ?? JSON.stringify(calcResult))
                            : calcResult}
                    </p>
                    <small style={{ color: "var(--text-secondary)" }}>
                        {calcForm.monto} {baseLabel} → {destLabel}
                    </small>
                </div>
            )}
        </aside>
    );
};

export const DashboardHome = () => {
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === "ADMIN_ROLE";
    const displayName = user?.name || user?.username || (isAdmin ? "Administrador" : "Usuario");

    if (!isAdmin) {
        return (
            <section className="dashboard-home intro-home">
                <div className="intro-hero animate-fadeInUp">
                    <div className="intro-copy">
                        <p className="dash-label">GestionBanco — Portal de Usuario</p>
                        <h1>Bienvenido, {displayName}.</h1>
                        <p>
                            Consulta divisas, tipos de cambio, tus cuentas bancarias y productos
                            financieros disponibles. Convierte montos con nuestra calculadora y
                            revisa tu historial de operaciones en cualquier momento.
                        </p>
                        <div className="intro-actions">
                            <Link to="/dashboard/tipos-cambio" className="intro-primary">
                                Ver tipos de cambio
                            </Link>
                            <Link to="/dashboard/historial" className="intro-secondary">
                                Mi historial
                            </Link>
                        </div>
                    </div>

                    <div className="bank-holo" aria-hidden="true">
                        <div className="holo-card holo-main">
                            <span>GestionBanco</span>
                            <strong>Portal</strong>
                            <small>Cuenta activa</small>
                        </div>
                        <div className="holo-card holo-float top">
                            <span>Divisas</span>
                            <small>Disponibles</small>
                        </div>
                        <div className="holo-card holo-float bottom">
                            <span>Seguro</span>
                            <small>JWT activo</small>
                        </div>
                        <div className="holo-grid" />
                    </div>
                </div>

                <div className="intro-strip animate-fadeInUp delay-100">
                    <span>Cuenta activa</span>
                    <span>JWT protegido</span>
                    <span>Consulta en tiempo real</span>
                    <span>Solo lectura segura</span>
                </div>

                <div className="intro-layout">
                    <article className="bank-panel intro-panel animate-fadeInUp delay-200">
                        <div className="panel-heading">
                            <div>
                                <p className="dash-label">Mis módulos</p>
                                <h2>Lo que tenés disponible</h2>
                            </div>
                        </div>
                        <div className="intro-modules">
                            <ModuleCard
                                to="/dashboard/divisas"
                                title="Divisas"
                                description="Consulta el catálogo de monedas registradas en el sistema."
                                metric="Monedas"
                                accent="cyan"
                            />
                            <ModuleCard
                                to="/dashboard/tipos-cambio"
                                title="Tipos de cambio"
                                description="Revisa tasas de conversión disponibles."
                                metric="ExchangeRate"
                                accent="green"
                            />
                            <ModuleCard
                                to="/dashboard/cuentas"
                                title="Mis cuentas"
                                description="Consulta el saldo y estado de tus cuentas bancarias."
                                metric="BankAccount"
                                accent="blue"
                            />
                            <ModuleCard
                                to="/dashboard/productos"
                                title="Productos financieros"
                                description="Explora el portafolio de productos bancarios disponibles."
                                metric="Portafolio"
                                accent="amber"
                            />
                            <ModuleCard
                                to="/dashboard/historial"
                                title="Mi historial"
                                description="Consultá tus registros, transacciones y el estado de tus cuentas."
                                metric="Record"
                                accent="blue"
                            />
                            <ModuleCard
                                to="/dashboard/perfil"
                                title="Mi perfil"
                                description="Revisá y actualizá tu información personal y foto de perfil."
                                metric="Perfil"
                                accent="amber"
                            />
                        </div>
                    </article>

                    <aside className="bank-panel intro-status animate-fadeInUp delay-300">
                        <p className="dash-label">Estado de tu cuenta</p>
                        <h2>Sesión activa</h2>
                        <div className="status-orb">
                            <span />
                            <strong>OK</strong>
                        </div>
                        <p>
                            Tu sesión está protegida con JWT. Podés consultar divisas, tipos de
                            cambio e historial con total seguridad.
                        </p>
                    </aside>
                </div>
            </section>
        );
    }

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
                        <ModuleCard to="/dashboard/usuarios" title="Usuarios" description="Controla accesos, roles y perfiles administrativos." metric="Identidad" />
                        <ModuleCard to="/dashboard/cuentas" title="Cuentas bancarias" description="Consulta estados, titulares y salud operativa de cuentas." metric="Core" accent="green" />
                        <ModuleCard to="/dashboard/transacciones" title="Transacciones" description="Supervisa movimientos, auditoría y actividad financiera." metric="En vivo" accent="blue" />
                        <ModuleCard to="/dashboard/productos" title="Productos financieros" description="Gestiona el portafolio de servicios bancarios." metric="Portafolio" accent="amber" />
                        <ModuleCard to="/dashboard/divisas" title="Divisas" description="Administra monedas disponibles para operaciones y conversiones." metric="Monedas" accent="blue" />
                        <ModuleCard to="/dashboard/tipos-cambio" title="Tipos de cambio" description="Controla pares, tasas, spreads y conversiones favoritas." metric="ExchangeRate" accent="green" />
                        <ModuleCard to="/dashboard/historial" title="Historial operativo" description="Consulta registros de auditoria y trazabilidad del sistema." metric="Record" />
                    </div>
                </article>

                <AdminCalculadora />
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