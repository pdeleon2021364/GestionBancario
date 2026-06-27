import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bankAccountsApi, transactionsApi } from "../../../shared/api/admin.js";
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

const unwrapRef = (value, fallback = "—") => {
    if (!value) return fallback;
    if (typeof value === "object")
        return value.nombre ?? value.numeroCuenta ?? value.codigo ?? value._id ?? fallback;
    return value;
};

const TipoChip = ({ tipo }) => {
    const t = String(tipo ?? "").toLowerCase();
    const tone =
        t === "deposito"      ? "good"
        : t === "retiro"      ? "warn"
        : t === "transferencia" ? "muted"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{tipo ?? "—"}</span>;
};

const SECTION_KEYS = ["todos", "movimientos", "depositos", "transferencias"];

export const UserCuentaDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [section, setSection] = useState("todos");

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const [accData, txData] = await Promise.all([
                bankAccountsApi.getUserAccount(id),
                transactionsApi.byAccount(id).catch(() => []),
            ]);
            setAccount(accData);
            setTransactions(Array.isArray(txData) ? txData : []);
        } catch (err) {
            const msg = err?.response?.data?.message || "No se pudo cargar la cuenta.";
            setError(msg);
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (id) load(); }, [id]);

    const filtered = useMemo(() => {
        if (section === "todos") return transactions;
        const map = {
            movimientos: ["deposito", "retiro", "transferencia"],
            depositos: ["deposito"],
            transferencias: ["transferencia"],
        };
        const tipos = map[section] || [];
        return transactions.filter((t) => tipos.includes(t.tipo));
    }, [transactions, section]);

    const totalDepositos = useMemo(
        () => transactions.filter((t) => t.tipo === "deposito").reduce((s, t) => s + Number(t.monto || 0), 0),
        [transactions]
    );
    const totalRetiros = useMemo(
        () => transactions.filter((t) => t.tipo === "retiro").reduce((s, t) => s + Number(t.monto || 0), 0),
        [transactions]
    );

    if (loading) {
        return (
            <section className="entity-page entity-cyan animate-fadeInUp">
                <p style={{ padding: "2rem" }}>Cargando cuenta…</p>
            </section>
        );
    }

    if (error || !account) {
        return (
            <section className="entity-page entity-cyan animate-fadeInUp">
                <p style={{ color: "#f87171", padding: "2rem" }}>{error || "Cuenta no encontrada."}</p>
                <button type="button" onClick={() => navigate("/user/cuentas")} style={{ marginLeft: "2rem" }}>
                    Volver a mis cuentas
                </button>
            </section>
        );
    }

    const sobregiroDisponible = account.tipoCuenta === "corriente"
        ? Number(account.limiteSobregiro || 0) + account.saldo
        : null;

    return (
        <section className="entity-page entity-cyan animate-fadeInUp">

            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">BankAccount</p>
                    <h1>{account.nombre || "Cuenta bancaria"}</h1>
                    <p>
                        Detalle de la cuenta <strong>{account.numeroCuenta}</strong>
                    </p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>DETALLE</strong>
                    <small>consulta</small>
                </div>
            </header>

            {/* Account info card */}
            <article className="entity-table-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Informacion</p>
                        <h2>{account.numeroCuenta}</h2>
                    </div>
                    <button type="button" onClick={() => navigate("/user/cuentas")}>
                        Volver
                    </button>
                </div>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1.25rem",
                    padding: "1.25rem",
                }}>
                    <div>
                        <small style={{ opacity: 0.6 }}>Saldo</small>
                        <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--cyan-glow)", margin: "0.25rem 0 0" }}>
                            {money(account.saldo)}
                        </p>
                    </div>
                    <div>
                        <small style={{ opacity: 0.6 }}>Tipo de cuenta</small>
                        <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.25rem 0 0" }}>
                            {account.tipoCuenta === "ahorro" ? "Ahorro" : "Corriente"}
                        </p>
                    </div>
                    <div>
                        <small style={{ opacity: 0.6 }}>Estado</small>
                        <div style={{ marginTop: "0.25rem" }}>
                            <EstadoChip estado={account.estado} />
                        </div>
                    </div>
                    <div>
                        <small style={{ opacity: 0.6 }}>Creada</small>
                        <p style={{ fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                            {dateText(account.fechaCreacion || account.createdAt)}
                        </p>
                    </div>
                    {account.tipoCuenta === "ahorro" && Number(account.tasaInteresAnual) > 0 && (
                        <div>
                            <small style={{ opacity: 0.6 }}>Tasa de interes anual</small>
                            <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.25rem 0 0", color: "var(--green-glow)" }}>
                                {account.tasaInteresAnual}%
                            </p>
                        </div>
                    )}
                    {account.tipoCuenta === "corriente" && (
                        <>
                            <div>
                                <small style={{ opacity: 0.6 }}>Limite de sobregiro</small>
                                <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.25rem 0 0" }}>
                                    {money(account.limiteSobregiro || 0)}
                                </p>
                            </div>
                            <div>
                                <small style={{ opacity: 0.6 }}>Disponible con sobregiro</small>
                                <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.25rem 0 0", color: "var(--amber-glow)" }}>
                                    {money(sobregiroDisponible)}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </article>

            {/* Metrics */}
            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Transacciones</small>
                    <strong>{transactions.length}</strong>
                    <span>totales</span>
                </article>
                <article className="entity-metric">
                    <small>Depositos</small>
                    <strong>{money(totalDepositos)}</strong>
                    <span>recibidos</span>
                </article>
                <article className="entity-metric">
                    <small>Retiros</small>
                    <strong>{money(totalRetiros)}</strong>
                    <span>realizados</span>
                </article>
            </div>

            {/* Section filter tabs */}
            <div className="entity-toolbar">
                {SECTION_KEYS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setSection(key)}
                        style={{
                            background: section === key ? "var(--cyan-glow)" : "var(--surface-2)",
                            color: section === key ? "#fff" : "var(--text-primary)",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.45rem 0.95rem",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            fontWeight: section === key ? 700 : 400,
                        }}
                    >
                        {key === "todos" ? "Todos"
                            : key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                ))}
                <button type="button" onClick={load} style={{ marginLeft: "auto" }}>
                    Actualizar
                </button>
            </div>

            {/* Transactions table */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Transactions</p>
                        <h2>
                            {section === "todos" ? "Todos los movimientos"
                                : section === "movimientos" ? "Movimientos"
                                : section === "depositos" ? "Depositos"
                                : "Transferencias"}
                            {" "}({filtered.length})
                        </h2>
                    </div>
                </div>

                <div className="entity-table-wrap">
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
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6}>No se encontraron transacciones para esta cuenta.</td></tr>
                            ) : (
                                filtered.map((tx) => (
                                    <tr key={getId(tx)}>
                                        <td><TipoChip tipo={tx.tipo} /></td>
                                        <td style={{ fontWeight: 700, color: "var(--cyan-glow)" }}>
                                            {money(tx.monto)}
                                        </td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                            {unwrapRef(tx.cuentaOrigen)}
                                        </td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                            {unwrapRef(tx.cuentaDestino)}
                                        </td>
                                        <td><EstadoChip estado={tx.estado} /></td>
                                        <td>{dateText(tx.createdAt ?? tx.updatedAt)}</td>
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
