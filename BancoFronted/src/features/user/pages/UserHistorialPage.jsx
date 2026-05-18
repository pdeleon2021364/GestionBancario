import { useEffect, useState, useMemo } from "react";
import { recordsApi, bankAccountsApi, transactionsApi } from "../../../shared/api/admin.js";
import { showError } from "../../../shared/utils/toast.js";

const getId = (item) => item?._id ?? item?.id;
const money = (v) =>
    `Q ${Number(v || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";
const unwrapRef = (value, fallback = "—") => {
    if (!value) return fallback;
    if (typeof value === "object")
        return value.nombre ?? value.numeroCuenta ?? value.codigo ?? value._id ?? fallback;
    return value;
};

const TipoChip = ({ tipo }) => {
    const t = String(tipo).toLowerCase();
    const tone =
        t === "deposito" ? "good"
        : t === "retiro"  ? "warn"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{tipo}</span>;
};

const TABS = [
    { id: "historial", label: "Historial de registros" },
    { id: "transacciones", label: "Transacciones" },
    { id: "cuentas", label: "Mis cuentas" },
];

export const UserHistorialPage = () => {
    const [tab, setTab] = useState("historial");
    const [records, setRecords] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [recData, txData, accData] = await Promise.all([
                recordsApi.list().catch(() => []),
                transactionsApi.list().catch(() => []),
                bankAccountsApi.list().catch(() => []),
            ]);
            setRecords(Array.isArray(recData) ? recData : []);
            setTransactions(Array.isArray(txData) ? txData : []);
            setAccounts(Array.isArray(accData) ? accData : []);
        } catch {
            showError("No se pudo cargar el historial.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Datos del tab activo
    const activeData = useMemo(() => {
        if (tab === "historial") return records;
        if (tab === "transacciones") return transactions;
        return accounts;
    }, [tab, records, transactions, accounts]);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return activeData;
        return activeData.filter((item) =>
            JSON.stringify(item).toLowerCase().includes(term)
        );
    }, [activeData, query]);

    // Resumen rápido de transacciones
    const txSummary = useMemo(() => {
        const depositos = transactions.filter((t) => t.tipo === "deposito");
        const retiros = transactions.filter((t) => t.tipo === "retiro");
        const transferencias = transactions.filter((t) => t.tipo === "transferencia");
        return { depositos, retiros, transferencias };
    }, [transactions]);

    return (
        <section className="entity-page entity-blue animate-fadeInUp">
            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">Record</p>
                    <h1>Historial operativo</h1>
                    <p>Consulta tus registros, transacciones y el estado de tus cuentas.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>HISTORIAL</strong>
                    <small>solo lectura</small>
                </div>
            </header>

            {/* Métricas */}
            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Registros</small>
                    <strong>{records.length}</strong>
                    <span>en historial</span>
                </article>
                <article className="entity-metric">
                    <small>Transacciones</small>
                    <strong>{transactions.length}</strong>
                    <span>total</span>
                </article>
                <article className="entity-metric">
                    <small>Depósitos</small>
                    <strong>{txSummary.depositos.length}</strong>
                    <span>registrados</span>
                </article>
                <article className="entity-metric">
                    <small>Retiros</small>
                    <strong>{txSummary.retiros.length}</strong>
                    <span>registrados</span>
                </article>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    borderBottom: "1px solid rgba(56,189,248,0.15)",
                    paddingBottom: "0.5rem",
                }}
            >
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTab(t.id); setQuery(""); }}
                        style={{
                            padding: "0.45rem 1rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: tab === t.id ? 700 : 400,
                            background: tab === t.id
                                ? "rgba(56,189,248,0.18)"
                                : "transparent",
                            color: tab === t.id
                                ? "var(--blue-mid)"
                                : "var(--text-muted)",
                            transition: "all 0.2s",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Barra búsqueda */}
            <div className="entity-toolbar">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Buscar en ${TABS.find((t) => t.id === tab)?.label.toLowerCase()}…`}
                />
                <button type="button" onClick={load}>Actualizar</button>
            </div>

            {/* Tabla según tab */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">{TABS.find((t) => t.id === tab)?.label}</p>
                        <h2>{filtered.length} resultado(s)</h2>
                    </div>
                </div>

                <div className="entity-table-wrap">
                    {/* Historial de registros */}
                    {tab === "historial" && (
                        <table className="entity-table">
                            <thead>
                                <tr>
                                    <th>Cuenta</th>
                                    <th>Transacción</th>
                                    <th>Última actualización</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={3}>Cargando historial…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={3}>Sin registros en el historial.</td></tr>
                                ) : (
                                    filtered.map((r) => (
                                        <tr key={getId(r)}>
                                            <td>{unwrapRef(r.cuentaId)}</td>
                                            <td>{unwrapRef(r.listaTransacciones)}</td>
                                            <td>{dateText(r.fechaActualizacion ?? r.updatedAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Transacciones */}
                    {tab === "transacciones" && (
                        <table className="entity-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                    <th>Cuenta origen</th>
                                    <th>Cuenta destino</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6}>Cargando transacciones…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6}>Sin transacciones registradas.</td></tr>
                                ) : (
                                    filtered.map((tx) => (
                                        <tr key={getId(tx)}>
                                            <td><TipoChip tipo={tx.tipo} /></td>
                                            <td style={{ fontWeight: 600 }}>{money(tx.monto)}</td>
                                            <td>{unwrapRef(tx.cuentaOrigen)}</td>
                                            <td>{unwrapRef(tx.cuentaDestino)}</td>
                                            <td>
                                                <span className="entity-chip good">
                                                    {tx.estado ?? "completado"}
                                                </span>
                                            </td>
                                            <td>{dateText(tx.createdAt ?? tx.updatedAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Cuentas */}
                    {tab === "cuentas" && (
                        <table className="entity-table">
                            <thead>
                                <tr>
                                    <th>Número de cuenta</th>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Saldo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5}>Cargando cuentas…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5}>Sin cuentas registradas.</td></tr>
                                ) : (
                                    filtered.map((acc) => (
                                        <tr key={getId(acc)}>
                                            <td style={{ fontFamily: "monospace" }}>{acc.numeroCuenta}</td>
                                            <td>{acc.nombre}</td>
                                            <td>
                                                <span className="entity-chip muted">{acc.tipoCuenta}</span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: "var(--cyan-glow)" }}>
                                                {money(acc.saldo)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`entity-chip ${
                                                        acc.estado === "activa" ? "good" : "warn"
                                                    }`}
                                                >
                                                    {acc.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </article>
        </section>
    );
};