import { useEffect, useState, useMemo } from "react";
import { transactionsApi, bankAccountsApi } from "../../../shared/api/admin.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";
import { useAuthStore } from "../../auth/store/authStore.js";

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
    const t = String(tipo ?? "").toLowerCase();
    const tone =
        t === "deposito"      ? "good"
        : t === "retiro"      ? "warn"
        : t === "transferencia" ? "muted"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{tipo ?? "—"}</span>;
};

const EstadoChip = ({ estado }) => {
    const tone = estado === "completado" || estado === "exitoso" ? "good"
        : estado === "pendiente" ? "warn"
        : estado === "fallido"   ? "warn"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{estado ?? "completado"}</span>;
};

const TIPOS = ["todos", "deposito", "retiro", "transferencia"];

const EMPTY_FORM = {
    tipo: "deposito",
    monto: "",
    cuentaOrigen: "",
    cuentaDestino: "",
};

export const UserTransaccionesPage = () => {
    const user = useAuthStore((state) => state.user);

    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filterTipo, setFilterTipo] = useState("todos");

    // Modal
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const [txData, accData] = await Promise.all([
                transactionsApi.list().catch(() => []),
                bankAccountsApi.list().catch(() => []),
            ]);
            setTransactions(Array.isArray(txData) ? txData : []);
            setAccounts(Array.isArray(accData) ? accData : []);
        } catch {
            setError("No se pudieron cargar las transacciones. Intenta de nuevo.");
            showError("No se pudieron cargar las transacciones.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let result = transactions;
        if (filterTipo !== "todos") result = result.filter((t) => t.tipo === filterTipo);
        const term = query.trim().toLowerCase();
        if (term) {
            result = result.filter((t) =>
                t.tipo?.toLowerCase().includes(term) ||
                t.estado?.toLowerCase().includes(term) ||
                String(t.monto).includes(term) ||
                unwrapRef(t.cuentaOrigen).toLowerCase().includes(term) ||
                unwrapRef(t.cuentaDestino).toLowerCase().includes(term)
            );
        }
        return result;
    }, [transactions, query, filterTipo]);

    // ── Métricas ──────────────────────────────────────────────────────────────
    const depositos      = useMemo(() => transactions.filter((t) => t.tipo === "deposito"), [transactions]);
    const retiros        = useMemo(() => transactions.filter((t) => t.tipo === "retiro"), [transactions]);
    const transferencias = useMemo(() => transactions.filter((t) => t.tipo === "transferencia"), [transactions]);
    const totalMonto     = useMemo(
        () => depositos.reduce((acc, t) => acc + Number(t.monto || 0), 0),
        [depositos]
    );

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openCreate = () => {
        setForm(EMPTY_FORM);
        setFormError(null);
        setOpen(true);
    };

    const closeModal = () => { setOpen(false); setFormError(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === "monto" ? value : value }));
    };

    // ── Guardar ───────────────────────────────────────────────────────────────
    const handleSave = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!form.monto || Number(form.monto) <= 0) {
            setFormError("El monto debe ser mayor a 0.");
            return;
        }
        if (form.tipo !== "deposito" && !form.cuentaOrigen) {
            setFormError("Debes seleccionar una cuenta de origen.");
            return;
        }
        if (form.tipo === "transferencia" && !form.cuentaDestino) {
            setFormError("Debes seleccionar una cuenta de destino para la transferencia.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                tipo:          form.tipo,
                monto:         Number(form.monto),
                cuentaOrigen:  form.cuentaOrigen  || undefined,
                cuentaDestino: form.cuentaDestino || undefined,
            };
            await transactionsApi.create(payload);
            showSuccess("Transacción registrada correctamente.");
            closeModal();
            await load();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "No se pudo registrar la transacción.";
            setFormError(msg);
            showError(msg);
        } finally {
            setSaving(false);
        }
    };

    const activeAccounts = useMemo(() => accounts.filter((a) => a.estado === "activa"), [accounts]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="entity-page entity-blue animate-fadeInUp">

            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">Transactions</p>
                    <h1>Mis transacciones</h1>
                    <p>Registra depósitos, retiros y transferencias entre tus cuentas bancarias.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>MOVIMIENTOS</strong>
                    <small>crear · consultar</small>
                </div>
            </header>

            {/* Métricas */}
            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Total transacciones</small>
                    <strong>{transactions.length}</strong>
                    <span>registradas</span>
                </article>
                <article className="entity-metric">
                    <small>Depósitos</small>
                    <strong>{depositos.length}</strong>
                    <span>{money(totalMonto)}</span>
                </article>
                <article className="entity-metric">
                    <small>Retiros</small>
                    <strong>{retiros.length}</strong>
                    <span>realizados</span>
                </article>
                <article className="entity-metric">
                    <small>Transferencias</small>
                    <strong>{transferencias.length}</strong>
                    <span>efectuadas</span>
                </article>
            </div>

            {/* Toolbar */}
            <div className="entity-toolbar">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por tipo, monto, cuenta…"
                />
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
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
                    {TIPOS.map((t) => (
                        <option key={t} value={t}>
                            {t === "todos" ? "Todos los tipos" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={load}>Actualizar</button>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    + Nueva transacción
                </button>
            </div>

            {/* Tabla */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Transactions</p>
                        <h2>{filtered.length} transacción(es)</h2>
                    </div>
                </div>

                {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

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
                            {loading ? (
                                <tr><td colSpan={6}>Cargando transacciones…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}>No se encontraron transacciones.</td></tr>
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

            {/* Modal nueva transacción */}
            {open && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <form className="user-modal edit-modal" onSubmit={handleSave}>
                        <button type="button" className="modal-close" onClick={closeModal}>
                            Cerrar
                        </button>
                        <p className="dash-label">Transactions</p>
                        <h2>Nueva transacción</h2>

                        <div className="edit-grid">
                            <label>
                                Tipo de transacción
                                <select name="tipo" value={form.tipo} onChange={handleChange} required>
                                    <option value="deposito">Depósito</option>
                                    <option value="retiro">Retiro</option>
                                    <option value="transferencia">Transferencia</option>
                                </select>
                            </label>

                            <label>
                                Monto (Q)
                                <input
                                    name="monto"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={form.monto}
                                    onChange={handleChange}
                                    placeholder="Ej: 500.00"
                                    required
                                />
                            </label>

                            {(form.tipo === "retiro" || form.tipo === "transferencia") && (
                                <label>
                                    Cuenta de origen
                                    <select name="cuentaOrigen" value={form.cuentaOrigen} onChange={handleChange} required>
                                        <option value="">Seleccionar cuenta…</option>
                                        {activeAccounts.map((acc) => (
                                            <option key={getId(acc)} value={getId(acc)}>
                                                {acc.numeroCuenta} — {acc.nombre} ({money(acc.saldo)})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {form.tipo === "deposito" && (
                                <label>
                                    Cuenta de destino
                                    <select name="cuentaDestino" value={form.cuentaDestino} onChange={handleChange} required>
                                        <option value="">Seleccionar cuenta…</option>
                                        {activeAccounts.map((acc) => (
                                            <option key={getId(acc)} value={getId(acc)}>
                                                {acc.numeroCuenta} — {acc.nombre} ({money(acc.saldo)})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {form.tipo === "transferencia" && (
                                <label>
                                    Cuenta de destino
                                    <select name="cuentaDestino" value={form.cuentaDestino} onChange={handleChange} required>
                                        <option value="">Seleccionar cuenta…</option>
                                        {activeAccounts
                                            .filter((acc) => getId(acc) !== form.cuentaOrigen)
                                            .map((acc) => (
                                                <option key={getId(acc)} value={getId(acc)}>
                                                    {acc.numeroCuenta} — {acc.nombre} ({money(acc.saldo)})
                                                </option>
                                            ))}
                                    </select>
                                </label>
                            )}
                        </div>

                        {formError && (
                            <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                {formError}
                            </p>
                        )}

                        <button type="submit" className="btn-primary save-user" disabled={saving}>
                            {saving ? "Registrando…" : "Registrar transacción"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
};
