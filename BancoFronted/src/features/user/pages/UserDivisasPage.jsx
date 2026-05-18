import { useEffect, useState, useMemo } from "react";
import { currenciesApi } from "../../../shared/api/admin.js";

const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";

export const UserDivisasPage = () => {
    const [divisas, setDivisas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await currenciesApi.list();
            setDivisas(Array.isArray(data) ? data : []);
        } catch {
            setError("No se pudieron cargar las divisas. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return divisas;
        return divisas.filter((d) =>
            d.nombre?.toLowerCase().includes(term) ||
            d.codigo?.toLowerCase().includes(term) ||
            d.simbolo?.toLowerCase().includes(term)
        );
    }, [divisas, query]);

    return (
        <section className="entity-page entity-cyan animate-fadeInUp">
            {/* Hero */}
            <header className="entity-hero">
                <div>
                    <p className="dash-label">Currency</p>
                    <h1>Divisas disponibles</h1>
                    <p>Consulta el catálogo de monedas registradas en el sistema.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>LECTURA</strong>
                    <small>solo consulta</small>
                </div>
            </header>

            {/* Métricas */}
            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Total divisas</small>
                    <strong>{divisas.length}</strong>
                    <span>registradas</span>
                </article>
                <article className="entity-metric">
                    <small>Resultados</small>
                    <strong>{filtered.length}</strong>
                    <span>encontrados</span>
                </article>
                <article className="entity-metric">
                    <small>Acceso</small>
                    <strong>Activo</strong>
                    <span>solo vista</span>
                </article>
            </div>

            {/* Barra de búsqueda */}
            <div className="entity-toolbar">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, código o símbolo…"
                />
                <button type="button" onClick={load}>
                    Actualizar
                </button>
            </div>

            {/* Tabla */}
            <article className="entity-table-panel">
                <div className="entity-panel-heading">
                    <div>
                        <p className="dash-label">Catálogo</p>
                        <h2>{filtered.length} divisa(s)</h2>
                    </div>
                </div>

                {error && (
                    <p style={{ color: "var(--cyan-glow)", padding: "1rem" }}>{error}</p>
                )}

                <div className="entity-table-wrap">
                    <table className="entity-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Símbolo</th>
                                <th>Registrada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4}>Cargando divisas…</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>No se encontraron divisas.</td>
                                </tr>
                            ) : (
                                filtered.map((d) => (
                                    <tr key={d._id ?? d.id}>
                                        <td>{d.nombre}</td>
                                        <td>
                                            <span className="entity-chip muted">{d.codigo}</span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: "var(--cyan-glow)" }}>
                                            {d.simbolo}
                                        </td>
                                        <td>{dateText(d.createdAt)}</td>
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