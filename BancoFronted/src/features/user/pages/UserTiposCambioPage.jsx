import { useEffect, useState, useMemo } from "react";
import { exchangeRatesApi, currenciesApi } from "../../../shared/api/admin.js";
import { showError } from "../../../shared/utils/toast.js";

const getId = (item) => item?._id ?? item?.id;
const dateText = (value) =>
    value
        ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
        : "—";
const unwrapRef = (value, fallback = "—") => {
    if (!value) return fallback;
    if (typeof value === "object") return value.codigo ?? value.nombre ?? value._id ?? fallback;
    return value;
};

export const UserTiposCambioPage = () => {
    const [rates, setRates] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [ratesData, currData] = await Promise.all([
                exchangeRatesApi.list(),
                currenciesApi.list(),
            ]);
            setRates(Array.isArray(ratesData) ? ratesData : []);
            setCurrencies(Array.isArray(currData) ? currData : []);
        } catch {
            showError("No se pudieron cargar los tipos de cambio.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return rates;
        return rates.filter((r) => JSON.stringify(r).toLowerCase().includes(term));
    }, [rates, query]);

    return (
        <section className="entity-page entity-green animate-fadeInUp">
            <header className="entity-hero">
                <div>
                    <p className="dash-label">ExchangeRate</p>
                    <h1>Tipos de cambio</h1>
                    <p>Consulta las tasas de conversión disponibles en el sistema.</p>
                </div>
                <div className="entity-command" aria-hidden="true">
                    <span>Usuario</span>
                    <strong>CONSULTA</strong>
                    <small>solo lectura</small>
                </div>
            </header>

            <div className="entity-metrics">
                <article className="entity-metric">
                    <small>Pares disponibles</small>
                    <strong>{rates.length}</strong>
                    <span>tipos de cambio</span>
                </article>
                <article className="entity-metric">
                    <small>Divisas</small>
                    <strong>{currencies.length}</strong>
                    <span>monedas</span>
                </article>
                <article className="entity-metric">
                    <small>Filtrados</small>
                    <strong>{filtered.length}</strong>
                    <span>resultados</span>
                </article>
            </div>

            <div className="entity-toolbar" style={{ marginBottom: "1rem" }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar tipo de cambio…"
                />
                <button type="button" onClick={load}>Actualizar</button>
            </div>

            <div className="entity-panel-heading">
                <div>
                    <p className="dash-label">Tasas</p>
                    <h2>{filtered.length} par(es)</h2>
                </div>
            </div>

            <div className="entity-table-wrap">
                <table className="entity-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Base</th>
                            <th>Destino</th>
                            <th>Tasa</th>
                            <th>Actualizado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5}>Cargando tipos de cambio…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5}>Sin tipos de cambio disponibles.</td></tr>
                        ) : (
                            filtered.map((r) => (
                                <tr key={getId(r)}>
                                    <td>{r.nameDestiny}</td>
                                    <td><span className="entity-chip muted">{unwrapRef(r.divisaBase)}</span></td>
                                    <td><span className="entity-chip muted">{unwrapRef(r.divisaDestino)}</span></td>
                                    <td style={{ fontWeight: 700, color: "var(--cyan-glow)" }}>{r.tasa}</td>
                                    <td>{dateText(r.updatedAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};