import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { DashboardPage } from "../layouts/DashboardPage.jsx";
import { DashboardHome } from "../layouts/DashboardHome.jsx";
import { RoleGuard } from "./RoleGuard.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { UnauthorizedPage } from "../../features/auth/pages/UnauthorizedPage.jsx";
import { UsersPage } from "../layouts/UsersPage.jsx";
import { ProfilePage } from "../layouts/ProfilePage.jsx";
import { showError, showSuccess } from "../../shared/utils/toast.js";
import { useAuthStore } from "../../features/auth/store/authStore.js";

// User pages
import { UserDivisasPage }       from "../../features/user/pages/UserDivisasPage.jsx";
import { UserTiposCambioPage }   from "../../features/user/pages/UserTiposCambioPage.jsx";
import { UserHistorialPage }     from "../../features/user/pages/UserHistorialPage.jsx";
import { UserCuentasPage }       from "../../features/user/pages/UserCuentasPage.jsx";
import { UserTransaccionesPage } from "../../features/user/pages/UserTransaccionesPage.jsx";

import {
    bankAccountsApi,
    currenciesApi,
    exchangeRatesApi,
    favoritesApi,
    financialProductsApi,
    recordsApi,
    transactionsApi,
} from "../../shared/api/admin.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers compartidos (solo usados por el CRUD admin)
// ─────────────────────────────────────────────────────────────────────────────
const auditKey = "gestionbanco-admin-audit";
const getId = (item) => item?._id ?? item?.id;
const unwrapRef = (value, fallback = "Sin referencia") => {
    if (!value) return fallback;
    if (typeof value === "object") return value.nombre ?? value.numeroCuenta ?? value.codigo ?? value._id ?? fallback;
    return value;
};
const money    = (value) => `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
const dateText = (value) => value ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";

const readAudit  = () => { try { return JSON.parse(localStorage.getItem(auditKey) || "[]"); } catch { return []; } };
const writeAudit = (entry) => {
    const next = [{ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry }, ...readAudit()].slice(0, 120);
    localStorage.setItem(auditKey, JSON.stringify(next));
};

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de entidades ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const entityConfigs = {
    cuentas: {
        label: "bankAccount",
        title: "Cuentas bancarias",
        description: "CRUD administrativo de cuentas, saldos, titulares, estado y reportes por correo.",
        accent: "green",
        api: bankAccountsApi,
        fields: [
            { name: "nombre",       label: "Nombre",           required: true },
            { name: "numeroCuenta", label: "Numero de cuenta", required: true },
            { name: "tipoCuenta",   label: "Tipo",             type: "select", options: ["ahorro", "corriente"], required: true },
            { name: "saldo",        label: "Saldo",            type: "number", required: true },
            { name: "usuarioId",    label: "Usuario ID",       type: "number", required: true },
            { name: "estado",       label: "Estado",           type: "select", options: ["activa", "inactiva"], required: true },
        ],
        columns: [
            { label: "Cuenta",  value: (x) => x.numeroCuenta },
            { label: "Nombre",  value: (x) => x.nombre },
            { label: "Tipo",    value: (x) => x.tipoCuenta },
            { label: "Saldo",   value: (x) => money(x.saldo) },
            { label: "Estado",  value: (x) => x.estado, chip: true },
        ],
        empty: { nombre: "", numeroCuenta: "", tipoCuenta: "ahorro", saldo: 0, usuarioId: 1, estado: "activa" },
    },
    transacciones: {
        label: "transactions",
        title: "Transacciones",
        description: "CRUD de movimientos, filtros por tipo y transferencia rapida usando favoritos.",
        accent: "blue",
        api: transactionsApi,
        related: ["accounts", "favorites"],
        fields: [
            { name: "tipo",          label: "Tipo",          type: "select", options: ["deposito", "retiro", "transferencia"], required: true },
            { name: "monto",         label: "Monto",         type: "number", required: true },
            { name: "cuentaOrigen",  label: "Cuenta origen", type: "account" },
            { name: "cuentaDestino", label: "Cuenta destino",type: "account" },
        ],
        columns: [
            { label: "Tipo",    value: (x) => x.tipo, chip: true },
            { label: "Monto",   value: (x) => money(x.monto) },
            { label: "Origen",  value: (x) => unwrapRef(x.cuentaOrigen) },
            { label: "Destino", value: (x) => unwrapRef(x.cuentaDestino) },
            { label: "Estado",  value: (x) => x.estado ?? "completado", chip: true },
        ],
        empty: { tipo: "deposito", monto: 0, cuentaOrigen: "", cuentaDestino: "" },
    },
    productos: {
        label: "financialproduct",
        title: "Productos financieros",
        description: "CRUD del portafolio financiero: productos, tasas, descripciones, tipos y disponibilidad.",
        accent: "amber",
        api: financialProductsApi,
        fields: [
            { name: "nombre",       label: "Nombre",        required: true },
            { name: "descripcion",  label: "Descripcion",   required: true },
            { name: "tasaInteres",  label: "Tasa interes",  type: "number", required: true },
            { name: "tipoProducto", label: "Tipo producto", required: true },
            { name: "activo",       label: "Activo",        type: "checkbox" },
        ],
        columns: [
            { label: "Producto",    value: (x) => x.nombre },
            { label: "Tipo",        value: (x) => x.tipoProducto },
            { label: "Tasa",        value: (x) => `${x.tasaInteres}%` },
            { label: "Descripcion", value: (x) => x.descripcion },
            { label: "Estado",      value: (x) => x.activo ? "Activo" : "Inactivo", chip: true },
        ],
        empty: { nombre: "", descripcion: "", tasaInteres: 0, tipoProducto: "", activo: true },
    },
    divisas: {
        label: "Currency",
        title: "Divisas",
        description: "CRUD del catalogo de monedas usadas por cuentas, conversiones y tasas.",
        accent: "cyan",
        api: currenciesApi,
        fields: [
            { name: "nombre",  label: "Nombre",  required: true },
            { name: "codigo",  label: "Codigo",  required: true },
            { name: "simbolo", label: "Simbolo", required: true },
        ],
        columns: [
            { label: "Nombre",  value: (x) => x.nombre },
            { label: "Codigo",  value: (x) => x.codigo, chip: true },
            { label: "Simbolo", value: (x) => x.simbolo },
            { label: "Creado",  value: (x) => dateText(x.createdAt) },
        ],
        empty: { nombre: "", codigo: "", simbolo: "" },
    },
    tiposCambio: {
        label: "ExchangeRate",
        title: "Tipos de cambio",
        description: "CRUD de pares de divisas, tasas y conversiones administrativas.",
        accent: "green",
        api: exchangeRatesApi,
        related: ["currencies", "favorites"],
        fields: [
            { name: "nameDestiny",   label: "Nombre",        required: true },
            { name: "divisaBase",    label: "Divisa base",   type: "currency", required: true },
            { name: "divisaDestino", label: "Divisa destino",type: "currency", required: true },
            { name: "tasa",          label: "Tasa",          type: "number",   required: true },
        ],
        columns: [
            { label: "Nombre",      value: (x) => x.nameDestiny },
            { label: "Base",        value: (x) => unwrapRef(x.divisaBase) },
            { label: "Destino",     value: (x) => unwrapRef(x.divisaDestino) },
            { label: "Tasa",        value: (x) => x.tasa },
            { label: "Actualizado", value: (x) => dateText(x.updatedAt) },
        ],
        empty: { nameDestiny: "", divisaBase: "", divisaDestino: "", tasa: 1 },
    },
    historial: {
        label: "record",
        title: "Historial operativo",
        description: "Historial real de cuentas/transacciones y auditoria local de acciones por entidad.",
        accent: "blue",
        api: recordsApi,
        related: ["accounts", "transactions"],
        fields: [
            { name: "cuentaId",           label: "Cuenta",      type: "account",      required: true },
            { name: "listaTransacciones", label: "Transaccion", type: "transaction" },
        ],
        columns: [
            { label: "Cuenta",       value: (x) => unwrapRef(x.cuentaId) },
            { label: "Transaccion",  value: (x) => unwrapRef(x.listaTransacciones) },
            { label: "Actualizacion",value: (x) => dateText(x.fechaActualizacion ?? x.updatedAt) },
        ],
        empty: { cuentaId: "", listaTransacciones: "" },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Componentes internos del CRUD admin
// ─────────────────────────────────────────────────────────────────────────────
const StatusChip = ({ value }) => {
    const status = String(value).toLowerCase();
    const tone = status.includes("activa") || status.includes("activo") || status.includes("aprobada") || status.includes("completado") || status.includes("deposito")
        ? "good"
        : status.includes("pendiente") || status.includes("revision") || status.includes("retiro")
            ? "warn"
            : "muted";
    return <span className={`entity-chip ${tone}`}>{String(value)}</span>;
};

const FieldInput = ({ field, value, onChange, related }) => {
    const baseProps = {
        name: field.name,
        value: field.type === "checkbox" ? undefined : value ?? "",
        checked: field.type === "checkbox" ? Boolean(value) : undefined,
        required: field.required,
        onChange: (event) => onChange(field.name, field.type === "checkbox" ? event.target.checked : event.target.value),
    };
    if (field.type === "select")      return <select {...baseProps}>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
    if (field.type === "account")     return <select {...baseProps}><option value="">Seleccionar cuenta</option>{related.accounts.map((x) => <option key={getId(x)} value={getId(x)}>{x.numeroCuenta} - {x.nombre}</option>)}</select>;
    if (field.type === "currency")    return <select {...baseProps}><option value="">Seleccionar divisa</option>{related.currencies.map((x) => <option key={getId(x)} value={getId(x)}>{x.codigo} - {x.nombre}</option>)}</select>;
    if (field.type === "transaction") return <select {...baseProps}><option value="">Seleccionar transaccion</option>{related.transactions.map((x) => <option key={getId(x)} value={getId(x)}>{x.tipo} - {money(x.monto)}</option>)}</select>;
    return <input {...baseProps} type={field.type || "text"} step={field.type === "number" ? "0.01" : undefined} />;
};

const ModuleCrudPage = ({ config }) => {
    const [items, setItems]     = useState([]);
    const [related, setRelated] = useState({ accounts: [], currencies: [], transactions: [], favorites: [] });
    const [form, setForm]       = useState(config.empty);
    const [editing, setEditing] = useState(null);
    const [open, setOpen]       = useState(false);
    const [loading, setLoading] = useState(true);
    const [query, setQuery]     = useState("");
    const [audit, setAudit]     = useState(readAudit);
    const [convertForm, setConvertForm]   = useState({ divisaBaseId: "", divisaDestinoId: "", monto: 1 });
    const [convertResult, setConvertResult] = useState(null);
    const [favoriteForm, setFavoriteForm] = useState({ alias: "", bankAccount: "" });

    const loadRelated = async () => {
        const next = { accounts: [], currencies: [], transactions: [], favorites: [] };
        if (config.related?.includes("accounts"))     next.accounts     = await bankAccountsApi.list();
        if (config.related?.includes("currencies"))   next.currencies   = await currenciesApi.list();
        if (config.related?.includes("transactions")) next.transactions = await transactionsApi.list();
        if (config.related?.includes("favorites"))    { try { next.favorites = await favoritesApi.list(); } catch { next.favorites = []; } }
        setRelated(next);
    };

    const load = async () => {
        try {
            setLoading(true);
            const [data] = await Promise.all([config.api.list(), loadRelated()]);
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudieron cargar los registros");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [config.label]);

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) return items;
        return items.filter((item) => JSON.stringify(item).toLowerCase().includes(search));
    }, [items, query]);

    const metrics = [
        { label: "Registros",    value: items.length,                                                              trend: "total" },
        { label: "Activos",      value: items.filter((x) => x.estado === "activa" || x.activo === true).length,   trend: "operativos" },
        { label: "Actualizados", value: items.filter((x) => x.updatedAt).length,                                  trend: "con auditoria" },
        { label: "Modulo",       value: "CRUD",                                                                    trend: "admin" },
    ];

    const resetForm = () => { setEditing(null); setForm(config.empty); setOpen(true); };

    const editItem = (item) => {
        const next = {};
        config.fields.forEach((field) => {
            const value = item[field.name];
            next[field.name] = typeof value === "object" && value !== null ? getId(value) : value ?? config.empty[field.name] ?? "";
        });
        setEditing(item); setForm(next); setOpen(true);
    };

    const save = async (event) => {
        event.preventDefault();
        try {
            const saved = editing ? await config.api.update(getId(editing), form) : await config.api.create(form);
            writeAudit({ entity: config.label, action: editing ? "actualizo" : "creo", detail: saved?.nombre ?? saved?.numeroCuenta ?? saved?.nameDestiny ?? getId(saved) });
            setAudit(readAudit());
            showSuccess(editing ? "Registro actualizado" : "Registro creado");
            setOpen(false);
            await load();
        } catch (error) {
            showError(error?.response?.data?.message || error?.response?.data?.error || "No se pudo guardar");
        }
    };

    const remove = async (item) => {
        if (!window.confirm("Eliminar este registro?")) return;
        try {
            await config.api.remove(getId(item));
            writeAudit({ entity: config.label, action: "elimino", detail: item.nombre ?? item.numeroCuenta ?? item.nameDestiny ?? getId(item) });
            setAudit(readAudit());
            showSuccess("Registro eliminado");
            await load();
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudo eliminar");
        }
    };

    const createFavorite = async (event) => {
        event.preventDefault();
        try {
            await favoritesApi.create(favoriteForm);
            writeAudit({ entity: "favorites", action: "creo", detail: favoriteForm.alias });
            setFavoriteForm({ alias: "", bankAccount: "" });
            showSuccess("Favorito creado");
            await load();
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudo crear el favorito");
        }
    };

    const convert = async (event) => {
        event.preventDefault();
        try {
            const result = await exchangeRatesApi.convert(convertForm);
            setConvertResult(result);
            writeAudit({ entity: "ExchangeRate", action: "convirtio", detail: `${convertForm.monto}` });
            setAudit(readAudit());
        } catch (error) {
            showError(error?.response?.data?.message || "No se pudo convertir");
        }
    };

    const auditByEntity = useMemo(() => {
        const groups = {};
        audit.forEach((entry) => { groups[entry.entity] = groups[entry.entity] || []; groups[entry.entity].push(entry); });
        return groups;
    }, [audit]);

    return (
        <section className={`entity-page entity-${config.accent} animate-fadeInUp`}>
            <header className="entity-hero">
                <div>
                    <p className="dash-label">{config.label}</p>
                    <h1>{config.title}</h1>
                    <p>{config.description}</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Admin</span>
                    <strong>CRUD</strong>
                    <small>funcional</small>
                </div>
            </header>

            <div className="entity-metrics">
                {metrics.map((metric) => (
                    <article className="entity-metric" key={metric.label}>
                        <small>{metric.label}</small>
                        <strong>{metric.value}</strong>
                        <span>{metric.trend}</span>
                    </article>
                ))}
            </div>

            <div className="entity-toolbar">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar registros" />
                <button type="button" onClick={load}>Actualizar</button>
                <button type="button" onClick={resetForm}>Nuevo</button>
            </div>

            <div className="entity-layout">
                <article className="entity-table-panel">
                    <div className="entity-panel-heading">
                        <div>
                            <p className="dash-label">Registros</p>
                            <h2>{filtered.length} resultado(s)</h2>
                        </div>
                    </div>
                    <div className="entity-table-wrap">
                        <table className="entity-table">
                            <thead><tr>{config.columns.map((col) => <th key={col.label}>{col.label}</th>)}<th>Acciones</th></tr></thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={config.columns.length + 1}>Cargando...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={config.columns.length + 1}>Sin registros</td></tr>
                                ) : filtered.map((item) => (
                                    <tr key={getId(item)}>
                                        {config.columns.map((col) => {
                                            const val = col.value(item);
                                            return <td key={col.label}>{col.chip ? <StatusChip value={val} /> : val}</td>;
                                        })}
                                        <td>
                                            <div className="entity-actions">
                                                <button type="button" onClick={() => editItem(item)}>Editar</button>
                                                <button type="button" className="danger" onClick={() => remove(item)}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <aside className="entity-side-panel">
                    <p className="dash-label">Historial</p>
                    <h2>Acciones por entidad</h2>
                    <div className="entity-timeline">
                        {(auditByEntity[config.label] || []).slice(0, 4).map((entry) => (
                            <div className="entity-step" key={entry.id}>
                                <span>{entry.action.slice(0, 2).toUpperCase()}</span>
                                <p>{entry.action} {entry.detail || "registro"} - {dateText(entry.at)}</p>
                            </div>
                        ))}
                        {(auditByEntity[config.label] || []).length === 0 && <p className="entity-muted">Sin acciones registradas todavia.</p>}
                    </div>

                    {config.related?.includes("favorites") && (
                        <div className="entity-favorites">
                            <p className="dash-label">Favoritos</p>
                            {related.favorites.map((fav) => <span key={getId(fav)}>{fav.alias}</span>)}
                            <form className="entity-mini-form" onSubmit={createFavorite}>
                                <input value={favoriteForm.alias} onChange={(e) => setFavoriteForm((x) => ({ ...x, alias: e.target.value }))} placeholder="Alias" required />
                                <select value={favoriteForm.bankAccount} onChange={(e) => setFavoriteForm((x) => ({ ...x, bankAccount: e.target.value }))} required>
                                    <option value="">Cuenta favorita</option>
                                    {related.accounts.map((acc) => <option key={getId(acc)} value={getId(acc)}>{acc.numeroCuenta}</option>)}
                                </select>
                                <button type="submit">Guardar favorito</button>
                            </form>
                        </div>
                    )}

                    {config.label === "ExchangeRate" && (
                        <form className="entity-mini-form" onSubmit={convert}>
                            <p className="dash-label">Conversion</p>
                            <input type="number" step="0.01" value={convertForm.monto} onChange={(e) => setConvertForm((x) => ({ ...x, monto: e.target.value }))} />
                            <select value={convertForm.divisaBaseId} onChange={(e) => setConvertForm((x) => ({ ...x, divisaBaseId: e.target.value }))} required>
                                <option value="">Base</option>
                                {related.currencies.map((c) => <option key={getId(c)} value={getId(c)}>{c.codigo}</option>)}
                            </select>
                            <select value={convertForm.divisaDestinoId} onChange={(e) => setConvertForm((x) => ({ ...x, divisaDestinoId: e.target.value }))} required>
                                <option value="">Destino</option>
                                {related.currencies.map((c) => <option key={getId(c)} value={getId(c)}>{c.codigo}</option>)}
                            </select>
                            <button type="submit">Convertir</button>
                            {convertResult && <span className="entity-result">{JSON.stringify(convertResult)}</span>}
                        </form>
                    )}

                    {config.label === "record" && (
                        <div className="entity-audit-groups">
                            {Object.entries(auditByEntity).map(([entity, entries]) => (
                                <div key={entity}>
                                    <strong>{entity}</strong>
                                    <small>{entries.length} accion(es)</small>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            {open && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <form className="user-modal edit-modal" onSubmit={save}>
                        <button type="button" className="modal-close" onClick={() => setOpen(false)}>Cerrar</button>
                        <p className="dash-label">{editing ? "Editar" : "Crear"} {config.title}</p>
                        <h2>{editing ? "Actualizar registro" : "Nuevo registro"}</h2>
                        <div className="edit-grid">
                            {config.fields.map((field) => (
                                <label key={field.name}>
                                    {field.label}
                                    <FieldInput field={field} value={form[field.name]} related={related} onChange={(name, value) => setForm((cur) => ({ ...cur, [name]: value }))} />
                                </label>
                            ))}
                        </div>
                        <button type="submit" className="btn-primary save-user">Guardar</button>
                    </form>
                </div>
            )}
        </section>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Guards de acceso
// ─────────────────────────────────────────────────────────────────────────────
const AdminOnly = ({ children }) => <RoleGuard allowedRoles={["ADMIN_ROLE"]}>{children}</RoleGuard>;
const UserOnly  = ({ children }) => <RoleGuard allowedRoles={["USER_ROLE"]}>{children}</RoleGuard>;

// ─────────────────────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────────────────────
export const AppRoutes = () => {
    return (
        <Routes>
            {/* Pública */}
            <Route path="/"             element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="unauthorized"  element={<UnauthorizedPage />} />

            {/* ── DASHBOARD ADMIN (/dashboard) ───────────────────────────── */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminOnly>
                            <DashboardPage />
                        </AdminOnly>
                    </ProtectedRoute>
                }
            >
                <Route index                  element={<DashboardHome />} />
                <Route path="perfil"          element={<ProfilePage />} />
                <Route path="usuarios"        element={<UsersPage />} />
                <Route path="cuentas"         element={<ModuleCrudPage config={entityConfigs.cuentas} />} />
                <Route path="transacciones"   element={<ModuleCrudPage config={entityConfigs.transacciones} />} />
                <Route path="productos"       element={<ModuleCrudPage config={entityConfigs.productos} />} />
                <Route path="divisas"         element={<ModuleCrudPage config={entityConfigs.divisas} />} />
                <Route path="tipos-cambio"    element={<ModuleCrudPage config={entityConfigs.tiposCambio} />} />
                <Route path="historial"       element={<ModuleCrudPage config={entityConfigs.historial} />} />
            </Route>

            {/* ── PORTAL USUARIO (/user) ─────────────────────────────────── */}
            <Route
                path="/user"
                element={
                    <ProtectedRoute>
                        <UserOnly>
                            <DashboardPage />
                        </UserOnly>
                    </ProtectedRoute>
                }
            >
                <Route index               element={<DashboardHome />} />
                <Route path="perfil"       element={<ProfilePage />} />
                <Route path="transacciones"element={<UserTransaccionesPage />} />
                <Route path="historial"    element={<UserHistorialPage />} />
                <Route path="tipos-cambio" element={<UserTiposCambioPage />} />
                <Route path="divisas"      element={<UserDivisasPage />} />
                <Route path="cuentas"      element={<UserCuentasPage />} />
            </Route>
        </Routes>
    );
};
