import { useEffect, useState, useMemo } from "react";
import { financialProductsUserApi as financialProductsApi } from "../../../shared/api/admin.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";

const getId = (item) => item?._id ?? item?.id;

const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";

const ActivoChip = ({ activo }) => {
    const on = activo === true || activo === "true" || activo === 1;
    return (
        <span className={`entity-chip ${on ? "good" : "warn"}`}>
            {on ? "Disponible" : "No disponible"}
        </span>
    );
};

const TipoChip = ({ tipo }) => (
    <span className="entity-chip muted">{tipo ?? "—"}</span>
);

// El usuario SOLO puede gestionar nombre, descripción y tipoProducto.
// tasaInteres y activo son exclusivos del administrador.
const EMPTY_FORM = { nombre: "", descripcion: "", tipoProducto: "" };

export const UserProductosPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filterTipo, setFilterTipo] = useState("todos");

    // Modal
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await financialProductsApi.list();
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar los productos financieros. Intenta de nuevo.");
            showError("No se pudieron cargar los productos financieros.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const tipos = useMemo(() => {
        const set = new Set(products.map((p) => p.tipoProducto).filter(Boolean));
        return ["todos", ...Array.from(set)];
    }, [products]);

    const filtered = useMemo(() => {
        let result = products;
        if (filterTipo !== "todos") result = result.filter((p) => p.tipoProducto === filterTipo);
        const term = query.trim().toLowerCase();
        if (term) {
            result = result.filter((p) =>
                p.nombre?.toLowerCase().includes(term) ||
                p.descripcion?.toLowerCase().includes(term) ||
                p.tipoProducto?.toLowerCase().includes(term)
            );
        }
        return result;
    }, [products, query, filterTipo]);

    const disponibles = useMemo(
        () => products.filter((p) => p.activo === true || p.activo === "true" || p.activo === 1),
        [products]
    );

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setOpen(true);
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({
            nombre:       p.nombre       ?? "",
            descripcion:  p.descripcion  ?? "",
            tipoProducto: p.tipoProducto ?? "",
        });
        setFormError(null);
        setOpen(true);
    };

    const closeModal = () => { setOpen(false); setEditing(null); setFormError(null); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    // ── Guardar ───────────────────────────────────────────────────────────────
    // Al crear, el backend requiere tasaInteres (campo obligatorio en el modelo).
    // Enviamos 0 como valor neutro ya que el usuario no puede fijarlo.
    // El admin podrá actualizarlo después desde su propio CRUD.
    const handleSave = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSaving(true);
        try {
            if (editing) {
                // En edición solo mandamos los campos que el usuario puede tocar;
                // tasaInteres y activo quedan sin cambios en el backend.
                await financialProductsApi.update(getId(editing), {
                    nombre:       form.nombre,
                    descripcion:  form.descripcion,
                    tipoProducto: form.tipoProducto,
                    // Preservamos los valores actuales para que el backend no los pise
                    tasaInteres:  editing.tasaInteres,
                    activo:       editing.activo,
                });
                showSuccess("Producto actualizado correctamente.");
            } else {
                await financialProductsApi.create({
                    ...form,
                    tasaInteres: 0,   // valor neutro; el admin lo ajusta después
                    activo:      true, // por defecto disponible al crearse
                });
                showSuccess("Producto creado correctamente.");
            }
            closeModal();
            await load();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "No se pudo guardar el producto.";
            setFormError(msg);
            showError(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="entity-page entity-amber animate-fadeInUp">

            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">FinancialProduct</p>
                    <h1>Productos financieros</h1>
                    <p>
                        Crea y edita productos del portafolio bancario. La tasa de interés y la
                        disponibilidad son gestionadas exclusivamente por el administrador.
                    </p>
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
                    <small>Total productos</small>
                    <strong>{products.length}</strong>
                    <span>en catálogo</span>
                </article>
                <article className="entity-metric">
                    <small>Disponibles</small>
                    <strong>{disponibles.length}</strong>
                    <span>activos</span>
                </article>
                <article className="entity-metric">
                    <small>Tipos distintos</small>
                    <strong>{tipos.length - 1}</strong>
                    <span>categorías</span>
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
                    placeholder="Buscar por nombre, descripción o tipo…"
                />
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(251,191,36,0.2)",
                        borderRadius: "0.5rem",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                    }}
                >
                    {tipos.map((t) => (
                        <option key={t} value={t}>{t === "todos" ? "Todos los tipos" : t}</option>
                    ))}
                </select>
                <button type="button" onClick={load}>Actualizar</button>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    + Nuevo producto
                </button>
            </div>

            {/* Tabla */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Portafolio</p>
                        <h2>{filtered.length} producto(s)</h2>
                    </div>
                </div>

                {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

                <div className="entity-table-wrap">
                    <table className="entity-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Tasa de interés</th>
                                <th>Disponibilidad</th>
                                <th>Registrado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}>Cargando productos financieros…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}>No se encontraron productos financieros.</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={getId(p)}>
                                        <td style={{ fontWeight: 600 }}>{p.nombre ?? "—"}</td>
                                        <td><TipoChip tipo={p.tipoProducto} /></td>
                                        <td
                                            style={{
                                                maxWidth: "240px",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                color: "var(--text-secondary)",
                                                fontSize: "0.85rem",
                                            }}
                                            title={p.descripcion}
                                        >
                                            {p.descripcion ?? "—"}
                                        </td>
                                        {/* Tasa e interés: solo lectura para el usuario */}
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                            {p.tasaInteres != null
                                                ? <span style={{ fontWeight: 600, color: "var(--amber-glow, #fbbf24)" }}>{p.tasaInteres}%</span>
                                                : <span style={{ fontStyle: "italic" }}>Sin definir</span>
                                            }
                                        </td>
                                        {/* Activo: solo lectura para el usuario */}
                                        <td><ActivoChip activo={p.activo} /></td>
                                        <td>{dateText(p.createdAt)}</td>
                                        <td>
                                            <div className="entity-actions">
                                                <button type="button" onClick={() => openEdit(p)}>
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
                        <p className="dash-label">FinancialProduct</p>
                        <h2>{editing ? "Editar producto" : "Nuevo producto financiero"}</h2>

                        <div className="edit-grid">
                            <label>
                                Nombre del producto
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Préstamo personal"
                                    required
                                />
                            </label>

                            <label>
                                Tipo de producto
                                <input
                                    name="tipoProducto"
                                    value={form.tipoProducto}
                                    onChange={handleChange}
                                    placeholder="Ej: prestamo, ahorro, inversión…"
                                    required
                                />
                            </label>

                            <label style={{ gridColumn: "1 / -1" }}>
                                Descripción
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    placeholder="Describe brevemente el producto financiero…"
                                    rows={3}
                                    required
                                    style={{
                                        resize: "vertical",
                                        background: "var(--surface-3, var(--surface-2))",
                                        color: "var(--text-primary)",
                                        border: "1px solid rgba(251,191,36,0.2)",
                                        borderRadius: "0.5rem",
                                        padding: "0.5rem 0.75rem",
                                        fontSize: "0.9rem",
                                        width: "100%",
                                    }}
                                />
                            </label>
                        </div>

                        {/* Aviso informativo sobre campos restringidos */}
                        <p style={{
                            marginTop: "0.75rem",
                            padding: "0.6rem 0.9rem",
                            borderRadius: "0.5rem",
                            background: "rgba(251,191,36,0.07)",
                            border: "1px solid rgba(251,191,36,0.2)",
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                        }}>
                            La <strong>tasa de interés</strong> y la <strong>disponibilidad</strong> solo
                            pueden ser configuradas por el administrador.
                        </p>

                        {formError && (
                            <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                {formError}
                            </p>
                        )}

                        <button type="submit" className="btn-primary save-user" disabled={saving}>
                            {saving ? "Guardando…" : editing ? "Actualizar producto" : "Crear producto"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
};
