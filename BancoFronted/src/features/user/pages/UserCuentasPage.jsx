import { useEffect, useState, useMemo } from "react";
import { bankAccountsApi } from "../../../shared/api/admin.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";
import { useAuthStore } from "../../auth/store/authStore.js";

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

const EMPTY_FORM = { nombre: "", numeroCuenta: "", tipoCuenta: "ahorro", saldo: 0, estado: "activa" };

export const UserCuentasPage = () => {
    const user = useAuthStore((state) => state.user);

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filterEstado, setFilterEstado] = useState("todos");

    // Modal
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

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

    // ── Filtrado ──────────────────────────────────────────────────────────────
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

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setOpen(true);
    };

    const openEdit = (acc) => {
        setEditing(acc);
        setForm({
            nombre:       acc.nombre       ?? "",
            numeroCuenta: acc.numeroCuenta ?? "",
            tipoCuenta:   acc.tipoCuenta   ?? "ahorro",
            saldo:        acc.saldo        ?? 0,
            estado:       acc.estado       ?? "activa",
        });
        setFormError(null);
        setOpen(true);
    };

    const closeModal = () => { setOpen(false); setEditing(null); setFormError(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === "saldo" ? Number(value) : value }));
    };

    // ── Guardar ───────────────────────────────────────────────────────────────
    const handleSave = async (e) => {
        e.preventDefault();
        setFormError(null);

        setSaving(true);
        try {
            const userId = String(user?.id ?? "");
            if (!userId) {
                setFormError("No se pudo identificar tu usuario. Vuelve a iniciar sesión.");
                setSaving(false);
                return;
            }

            const payload = {
                ...form,
                // user.id viene del auth-service; lo convertimos a string
                // para que coincida con el tipo Mixed del modelo Mongo
                usuarioId: userId,
            };
            if (editing) {
                await bankAccountsApi.update(getId(editing), payload);
                showSuccess("Cuenta actualizada correctamente.");
            } else {
                await bankAccountsApi.create(payload);
                showSuccess("Cuenta creada correctamente.");
            }
            closeModal();
            await load();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "No se pudo guardar la cuenta.";
            setFormError(msg);
            showError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="entity-page entity-cyan animate-fadeInUp">

            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">BankAccount</p>
                    <h1>Mis cuentas bancarias</h1>
                    <p>Crea, consulta y edita tus cuentas bancarias. No se permite eliminar cuentas.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>GESTIÓN</strong>
                    <small>crear · editar</small>
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

            {/* Toolbar */}
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
                <button type="button" className="btn-primary" onClick={openCreate}>
                    + Nueva cuenta
                </button>
            </div>

            {/* Tabla */}
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
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}>Cargando cuentas…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}>No se encontraron cuentas bancarias.</td></tr>
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
                                        <td>
                                            <div className="entity-actions">
                                                <button type="button" onClick={() => openEdit(acc)}>
                                                    Editar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </article>

            {/* Modal crear / editar */}
            {open && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <form className="user-modal edit-modal" onSubmit={handleSave}>
                        <button type="button" className="modal-close" onClick={closeModal}>
                            Cerrar
                        </button>
                        <p className="dash-label">BankAccount</p>
                        <h2>{editing ? "Editar cuenta" : "Nueva cuenta bancaria"}</h2>

                        <div className="edit-grid">
                            <label>
                                Nombre de la cuenta
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Cuenta principal"
                                    required
                                />
                            </label>

                            <label>
                                Número de cuenta
                                <input
                                    name="numeroCuenta"
                                    value={form.numeroCuenta}
                                    onChange={handleChange}
                                    placeholder="Ej: 001-001-00001"
                                    required
                                />
                            </label>

                            <label>
                                Tipo de cuenta
                                <select name="tipoCuenta" value={form.tipoCuenta} onChange={handleChange} required>
                                    <option value="ahorro">Ahorro</option>
                                    <option value="corriente">Corriente</option>
                                </select>
                            </label>

                            <label>
                                Saldo (Q)
                                <input
                                    name="saldo"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.saldo}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Estado
                                <select name="estado" value={form.estado} onChange={handleChange} required>
                                    <option value="activa">Activa</option>
                                    <option value="inactiva">Inactiva</option>
                                </select>
                            </label>
                        </div>

                        {formError && (
                            <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                {formError}
                            </p>
                        )}

                        <button type="submit" className="btn-primary save-user" disabled={saving}>
                            {saving ? "Guardando…" : editing ? "Actualizar cuenta" : "Crear cuenta"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
};
