import { useEffect, useState, useMemo } from "react";
import { userProductsApi, usuariosApi } from "../../../shared/api/admin.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";

const getId = (item) => item?._id ?? item?.id;

const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";

const EstadoChip = ({ estado }) => {
    const tone =
        estado === "activo"    ? "good"
        : estado === "pendiente" ? "warn"
        : estado === "rechazado" ? "warn"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{estado ?? "—"}</span>;
};

const FILTERS = ["todas", "pendiente", "activo", "rechazado", "cancelado"];

export const ProductSolicitudesPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [filter, setFilter] = useState("todas");
    const [error, setError] = useState(null);

    // Revisión modal
    const [reviewItem, setReviewItem] = useState(null);
    const [reviewUser, setReviewUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);

    // Modal rechazo (motivo)
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userProductsApi.list();
            setRequests(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar las solicitudes.");
            showError("No se pudieron cargar las solicitudes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (filter === "todas") return requests;
        return requests.filter((r) => r.estado === filter);
    }, [requests, filter]);

    const pendientes = useMemo(() => requests.filter((r) => r.estado === "pendiente"), [requests]);

    // Abrir modal de revisión con info del cliente
    const openReview = async (item) => {
        setReviewItem(item);
        setReviewUser(null);
        setLoadingUser(true);
        try {
            const user = await usuariosApi.get(item.usuarioId);
            setReviewUser(user);
        } catch {
            setReviewUser(null);
        } finally {
            setLoadingUser(false);
        }
    };

    // Aprobar desde el modal de revisión
    const handleApprove = async (id) => {
        setProcessing(id);
        try {
            await userProductsApi.approve(id);
            showSuccess("Solicitud aprobada.");
            setReviewItem(null);
            await load();
        } catch (err) {
            showError(err?.response?.data?.message || "No se pudo aprobar.");
        } finally {
            setProcessing(null);
        }
    };

    // Abrir modal de rechazo (motivo) desde el modal de revisión
    const openRejectFromReview = () => {
        if (!reviewItem) return;
        const id = getId(reviewItem);
        setReviewItem(null);
        setRejectTarget(id);
        setRejectReason("");
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            showError("Debes indicar un motivo de rechazo.");
            return;
        }
        setProcessing(rejectTarget);
        try {
            await userProductsApi.reject(rejectTarget, rejectReason.trim());
            showSuccess("Solicitud rechazada.");
            setRejectTarget(null);
            await load();
        } catch (err) {
            showError(err?.response?.data?.message || "No se pudo rechazar.");
        } finally {
            setProcessing(null);
        }
    };

    const prod = reviewItem?.productoId || {};

    return (
        <section className="entity-page entity-amber animate-fadeInUp">
            <header className="entity-hero">
                <div>
                    <p className="dash-label">Solicitudes</p>
                    <h1>Solicitudes de productos</h1>
                    <p>Revisa y aprueba o rechaza las solicitudes de productos de los usuarios.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Admin</span>
                    <strong>SOLICITUDES</strong>
                    <small>aprobar · rechazar</small>
                </div>
            </header>

            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Total solicitudes</small>
                    <strong>{requests.length}</strong>
                    <span>registradas</span>
                </article>
                <article className="entity-metric">
                    <small>Pendientes</small>
                    <strong>{pendientes.length}</strong>
                    <span>por revisar</span>
                </article>
                <article className="entity-metric">
                    <small>Aprobadas</small>
                    <strong>{requests.filter((r) => r.estado === "activo").length}</strong>
                    <span>activas</span>
                </article>
                <article className="entity-metric">
                    <small>Rechazadas</small>
                    <strong>{requests.filter((r) => r.estado === "rechazado").length}</strong>
                    <span>rechazadas</span>
                </article>
            </div>

            <div className="entity-toolbar">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
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
                    {FILTERS.map((f) => (
                        <option key={f} value={f}>
                            {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={load}>Actualizar</button>
            </div>

            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Solicitudes</p>
                        <h2>{filtered.length} solicitude(s)</h2>
                    </div>
                </div>

                {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

                <div className="entity-table-wrap">
                    <table className="entity-table">
                        <thead>
                            <tr>
                                <th>Usuario ID</th>
                                <th>Producto</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Cuenta asociada</th>
                                <th>Solicitado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}>Cargando solicitudes…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}>No hay solicitudes.</td></tr>
                            ) : (
                                filtered.map((r) => {
                                    const p = r.productoId || {};
                                    const cuenta = r.cuentaId || {};
                                    return (
                                        <tr key={getId(r)}>
                                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{r.usuarioId}</td>
                                            <td style={{ fontWeight: 600 }}>{p.nombre ?? "—"}</td>
                                            <td><span className="entity-chip muted">{p.tipoProducto ?? "—"}</span></td>
                                            <td><EstadoChip estado={r.estado} /></td>
                                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                                {cuenta.numeroCuenta ?? "—"}
                                            </td>
                                            <td>{dateText(r.fechaSolicitud ?? r.createdAt)}</td>
                                            <td>
                                                {r.estado === "pendiente" && (
                                                    <button
                                                        type="button"
                                                        className="btn-primary"
                                                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                                                        onClick={() => openReview(r)}
                                                        disabled={processing === getId(r)}
                                                    >
                                                        Revisar
                                                    </button>
                                                )}
                                                {r.estado === "rechazado" && r.motivoRechazo && (
                                                    <span
                                                        style={{ color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}
                                                        title={r.motivoRechazo}
                                                    >
                                                        {r.motivoRechazo.length > 20
                                                            ? r.motivoRechazo.slice(0, 20) + "…"
                                                            : r.motivoRechazo}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </article>

            {/* ─── Modal Revisión ─── */}
            {reviewItem && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="user-modal" style={{ maxWidth: "520px" }}>
                        <button type="button" className="modal-close" onClick={() => setReviewItem(null)}>
                            Cerrar
                        </button>
                        <p className="dash-label">Revisar solicitud</p>
                        <h2>{prod.nombre ?? "Producto"}</h2>

                        <div style={{ display: "grid", gap: "1rem", margin: "1.25rem 0", gridTemplateColumns: "1fr 1fr" }}>
                            {/* Cliente */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <strong style={{ color: "var(--amber-glow, #fbbf24)", fontSize: "0.85rem" }}>CLIENTE</strong>
                            </div>
                            {loadingUser ? (
                                <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)" }}>Cargando datos del cliente…</div>
                            ) : reviewUser ? (
                                <>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nombre</label>
                                        <p style={{ fontWeight: 600 }}>{reviewUser.nombre}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Email</label>
                                        <p>{reviewUser.email}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rol</label>
                                        <p>{reviewUser.rol === "ADMIN_ROLE" ? "Administrador" : "Usuario"}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID</label>
                                        <p style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{reviewUser.id}</p>
                                    </div>
                                </>
                            ) : (
                                <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)" }}>
                                    No se pudo cargar info del cliente (ID: {reviewItem.usuarioId})
                                </div>
                            )}

                            {/* Producto */}
                            <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                                <strong style={{ color: "var(--amber-glow, #fbbf24)", fontSize: "0.85rem" }}>PRODUCTO</strong>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nombre</label>
                                <p style={{ fontWeight: 600 }}>{prod.nombre ?? "—"}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tipo</label>
                                <p>{prod.tipoProducto ?? "—"}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tasa interés</label>
                                <p>{prod.tasaInteres != null ? `${prod.tasaInteres}%` : "—"}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Requiere aprobación</label>
                                <p>{reviewItem.requiereAprobacion ? "Si" : "No"}</p>
                            </div>
                            {prod.descripcion && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Descripción</label>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{prod.descripcion}</p>
                                </div>
                            )}

                            {/* Solicitud */}
                            <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                                <strong style={{ color: "var(--amber-glow, #fbbf24)", fontSize: "0.85rem" }}>SOLICITUD</strong>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Solicitado el</label>
                                <p>{dateText(reviewItem.fechaSolicitud ?? reviewItem.createdAt)}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Estado</label>
                                <p><EstadoChip estado={reviewItem.estado} /></p>
                            </div>
                        </div>

                        {/* Botones del modal */}
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: "0.5rem 1.25rem" }}
                                onClick={() => handleApprove(getId(reviewItem))}
                                disabled={processing === getId(reviewItem)}
                            >
                                {processing === getId(reviewItem) ? "Aprobando…" : "Aprobar"}
                            </button>
                            <button
                                type="button"
                                className="danger"
                                style={{ padding: "0.5rem 1.25rem" }}
                                onClick={openRejectFromReview}
                                disabled={processing === getId(reviewItem)}
                            >
                                Rechazar
                            </button>
                            <button
                                type="button"
                                style={{
                                    padding: "0.5rem 1.25rem",
                                    background: "transparent",
                                    border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                                    color: "var(--text-secondary)",
                                    borderRadius: "0.5rem",
                                    cursor: "pointer",
                                }}
                                onClick={() => setReviewItem(null)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal Rechazo (motivo) ─── */}
            {rejectTarget && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <form className="user-modal edit-modal" onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
                        <button type="button" className="modal-close" onClick={() => setRejectTarget(null)}>
                            Cerrar
                        </button>
                        <p className="dash-label">Rechazar solicitud</p>
                        <h2>Motivo de rechazo</h2>

                        <div className="edit-grid">
                            <label style={{ gridColumn: "1 / -1" }}>
                                Motivo
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Indica el motivo del rechazo…"
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

                        <button type="submit" className="btn-primary save-user" disabled={processing}>
                            {processing ? "Rechazando…" : "Confirmar rechazo"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
};
