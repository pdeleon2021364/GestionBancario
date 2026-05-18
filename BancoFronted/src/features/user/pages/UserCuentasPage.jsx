import { useEffect, useState, useMemo } from "react";
import { bankAccountsApi } from "../../../shared/api/admin.js";
import { showError } from "../../../shared/utils/toast.js";

const getId = (item) => item?._id ?? item?.id;

const money = (v) =>
    `Q ${Number(v || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";

const EstadoChip = ({ estado }) => {
    const tone = estado === "activa" ? "good" : estado === "inactiva" ? "warn" : "muted";
    return <span className={`entity-chip ${tone}`}>{estado ?? "—"}</span>;
};

const TipoCuentaChip = ({ tipo }) => (
    <span className="entity-chip muted">{tipo ?? "—"}</span>
);

export const UserCuentasPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filterEstado, setFilterEstado] = useState("todos");

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await bankAccountsApi.list();
            setAccounts(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar las cuentas bancarias. Intenta de nuevo.");
            showError("No se pudieron cargar las cuentas bancarias.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        let result = accounts;
        if (filterEstado !== "todos") result = result.filter((a) => a.estado === filterEstado);
        const term = query.trim().toLowerCase();
        if (term) {
            result = result.filter((a) =>
                a.numeroCuenta?.toLowerCase().includes(term) ||
                a.nombre?.toLowerCase().includes(term) ||
                a.tipoCuenta?.toLowerCase().includes(term) ||
                a.estado?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [accounts, query, filterEstado]);

    const activas    = useMemo(() => accounts.filter((a) => a.estado === "activa"), [accounts]);
    const saldoTotal = useMemo(() => accounts.reduce((acc, a) => acc + Number(a.saldo || 0), 0), [accounts]);
    const estados    = useMemo(() => {
        const set = new Set(accounts.map((a) => a.estado).filter(Boolean));
        return ["todos", ...Array.from(set)];
    }, [accounts]);

    return (
        <section className="entity-page entity-cyan animate-fadeInUp">

            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">BankAccount</p>
                    <h1>Mis cuentas bancarias</h1>
                    <p>Consulta el estado y saldo de tus cuentas. Las cuentas son creadas por el administrador.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>CONSULTA</strong>
                    <small>solo lectura</small>
                </div>
            </header>

            {/* Métricas */}
            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Total cuentas</small>
                    <strong>{accounts.length}</strong>
                    <span>registradas</span>
                </article>
                <article className="entity-metric">
                    <small>Cuentas activas</small>
                    <strong>{activas.length}</strong>
                    <span>disponibles</span>
                </article>
                <article className="entity-metric">
                    <small>Saldo total</small>
                    <strong>{money(saldoTotal)}</strong>
                    <span>consolidado</span>
                </article>
                <article className="entity-metric">
                    <small>Resultados</small>
                    <strong>{filtered.length}</strong>
                    <span>encontrados</span>
                </article>
            </div>

            {/* Toolbar — sin botón de crear */}
            <div className="entity-toolbar">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por número, nombre o tipo…"
                />
                <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(56,189,248,0.2)",
                        borderRadius: "0.5rem",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                    }}
                >
                    {estados.map((e) => (
                        <option key={e} value={e}>{e === "todos" ? "Todos los estados" : e}</option>
                    ))}
                </select>
                <button type="button" onClick={load}>Actualizar</button>
            </div>

            {/* Tabla — solo lectura */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Cuentas</p>
                        <h2>{filtered.length} cuenta(s)</h2>
                    </div>
                </div>

                {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

                <div className="entity-table-wrap">
                    <table className="entity-table">
                        <thead>
                            <tr>
                                <th>Número de cuenta</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Saldo</th>
                                <th>Estado</th>
                                <th>Creada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6}>Cargando cuentas…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}>No se encontraron cuentas bancarias.</td></tr>
                            ) : (
                                filtered.map((acc) => (
                                    <tr key={getId(acc)}>
                                        <td style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
                                            {acc.numeroCuenta ?? "—"}
                                        </td>
                                        <td>{acc.nombre ?? "—"}</td>
                                        <td><TipoCuentaChip tipo={acc.tipoCuenta} /></td>
                                        <td style={{ fontWeight: 700, color: "var(--cyan-glow)" }}>
                                            {money(acc.saldo)}
                                        </td>
                                        <td><EstadoChip estado={acc.estado} /></td>
                                        <td>{dateText(acc.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </article>
        </section>
    );
};
