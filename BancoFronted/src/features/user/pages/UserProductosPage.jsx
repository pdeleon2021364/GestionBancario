import { useEffect, useState, useMemo } from "react";
import { financialProductsApi, userProductsApi } from "../../../shared/api/admin.js";
import { showError, showSuccess } from "../../../shared/utils/toast.js";
import { useAuthStore } from "../../auth/store/authStore.js";

const getId = (item) => item?._id ?? item?.id;

const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";

const ActivoChip = ({ activo }) => (
    <span className={`entity-chip ${activo ? "good" : "warn"}`}>
        {activo ? "Disponible" : "No disponible"}
    </span>
);

const EstadoChip = ({ estado }) => {
    const tone =
        estado === "activo"    ? "good"
        : estado === "pendiente" ? "warn"
        : estado === "rechazado" ? "warn"
        : "muted";
    return <span className={`entity-chip ${tone}`}>{estado ?? "—"}</span>;
};

const TABS = ["catalogo", "mis-productos"];

export const UserProductosPage = () => {
    const user = useAuthStore((state) => state.user);

    const [tab, setTab] = useState("catalogo");
    const [products, setProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(null);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filterTipo, setFilterTipo] = useState("todos");

    const loadCatalog = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await financialProductsApi.list({ limit: 100 });
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar los productos.");
            showError("No se pudieron cargar los productos.");
        } finally {
            setLoading(false);
        }
    };

    const loadMyProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userProductsApi.myProducts();
            setMyProducts(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar tus productos.");
            showError("No se pudieron cargar tus productos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tab === "catalogo") loadCatalog();
        else loadMyProducts();
    }, [tab]);

    const tipos = useMemo(() => {
        const set = new Set(products.filter((p) => p.activo).map((p) => p.tipoProducto).filter(Boolean));
        return ["todos", ...Array.from(set)];
    }, [products]);

    const availableProducts = useMemo(() => {
        let result = products.filter((p) => p.activo);
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

    const handleRequest = async (productoId) => {
        setRequesting(productoId);
        try {
            const result = await userProductsApi.request({ productoId });
            showSuccess(result?.message || "Producto solicitado exitosamente.");
            if (tab === "mis-productos") await loadMyProducts();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "No se pudo solicitar el producto.";
            showError(msg);
        } finally {
            setRequesting(null);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Cancelar esta solicitud?")) return;
        try {
            await userProductsApi.cancel(id);
            showSuccess("Solicitud cancelada.");
            await loadMyProducts();
        } catch (err) {
            showError(err?.response?.data?.message || "No se pudo cancelar.");
        }
    };

    return (
        <section className="entity-page entity-amber animate-fadeInUp">
            <header className="entity-hero">
                <div>
                    <p className="dash-label">FinancialProduct</p>
                    <h1>Productos financieros</h1>
                    <p>Explorá los productos disponibles y solicitá los que te interesen.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>{user?.name || "Usuario"}</span>
                    <strong>CATALOGO</strong>
                    <small>solicitar · consultar</small>
                </div>
            </header>

            {/* Tabs */}
            <div className="entity-tabs" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={tab === t ? "btn-primary" : ""}
                        onClick={() => setTab(t)}
                        style={{
                            padding: "0.5rem 1.25rem",
                            borderRadius: "0.5rem",
                            border: tab === t ? "none" : "1px solid rgba(251,191,36,0.2)",
                            background: tab === t ? "var(--main-amber, #f59e0b)" : "var(--surface-2)",
                            color: tab === t ? "#fff" : "var(--text-primary)",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                        }}
                    >
                        {t === "catalogo" ? "Catalogo" : "Mis productos"}
                    </button>
                ))}
            </div>

            {tab === "catalogo" && (
                <>
                    {/* Toolbar */}
                    <div className="entity-toolbar">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, descripcion o tipo…"
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
                        <button type="button" onClick={loadCatalog}>Actualizar</button>
                    </div>

                    {/* Grid de productos */}
                    <div className="entity-table-panel">
                        <div className="entity-panel-heading">
                            <div>
                                <p className="dash-label">Catalogo</p>
                                <h2>{availableProducts.length} producto(s) disponible(s)</h2>
                            </div>
                        </div>

                        {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

                        <div className="entity-table-wrap">
                            <table className="entity-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Tipo</th>
                                        <th>Descripcion</th>
                                        <th>Tasa</th>
                                        <th>Requiere aprob.</th>
                                        <th>Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6}>Cargando catalogo…</td></tr>
                                    ) : availableProducts.length === 0 ? (
                                        <tr><td colSpan={6}>No hay productos disponibles en este momento.</td></tr>
                                    ) : (
                                        availableProducts.map((p) => (
                                            <tr key={getId(p)}>
                                                <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                                <td><span className="entity-chip muted">{p.tipoProducto}</span></td>
                                                <td style={{ maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-secondary)", fontSize: "0.85rem" }} title={p.descripcion}>
                                                    {p.descripcion ?? "—"}
                                                </td>
                                                <td style={{ fontWeight: 600, color: "var(--amber-glow, #fbbf24)" }}>
                                                    {p.tasaInteres != null ? `${p.tasaInteres}%` : "—"}
                                                </td>
                                                <td>
                                                    {p.requiereAprobacion
                                                        ? <span className="entity-chip warn">Si</span>
                                                        : <span className="entity-chip good">No</span>
                                                    }
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-primary"
                                                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                                                        onClick={() => handleRequest(getId(p))}
                                                        disabled={requesting === getId(p)}
                                                    >
                                                        {requesting === getId(p) ? "Solicitando…" : "Solicitar"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {tab === "mis-productos" && (
                <div className="entity-table-panel">
                    <div className="entity-panel-heading">
                        <div>
                            <p className="dash-label">Mis productos</p>
                            <h2>{myProducts.length} producto(s) adquirido(s)</h2>
                        </div>
                    </div>

                    {error && <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>}

                    <div className="entity-table-wrap">
                        <table className="entity-table">
                            <thead>
                                <tr>
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
                                    <tr><td colSpan={6}>Cargando tus productos…</td></tr>
                                ) : myProducts.length === 0 ? (
                                    <tr><td colSpan={6}>No has solicitado ningun producto aun.</td></tr>
                                ) : (
                                    myProducts.map((up) => {
                                        const prod = up.productoId || {};
                                        const cuenta = up.cuentaId || {};
                                        return (
                                            <tr key={getId(up)}>
                                                <td style={{ fontWeight: 600 }}>{prod.nombre ?? "—"}</td>
                                                <td><span className="entity-chip muted">{prod.tipoProducto ?? "—"}</span></td>
                                                <td><EstadoChip estado={up.estado} /></td>
                                                <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                                                    {cuenta.numeroCuenta ?? "—"}
                                                </td>
                                                <td>{dateText(up.fechaSolicitud ?? up.createdAt)}</td>
                                                <td>
                                                    {up.estado === "pendiente" && (
                                                        <button
                                                            type="button"
                                                            className="danger"
                                                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                                                            onClick={() => handleCancel(getId(up))}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                    {up.estado === "rechazado" && up.motivoRechazo && (
                                                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}
                                                            title={up.motivoRechazo}>
                                                            Ver motivo
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
                </div>
            )}
        </section>
    );
};
