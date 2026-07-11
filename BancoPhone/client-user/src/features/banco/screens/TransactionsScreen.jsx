import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback, useEffect, useMemo } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getMyTransactionsApi, createTransactionApi, getAccountsApi, searchAccountByNumberApi, getCategoriasApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useCurrencyStore } from "../../../shared/store/useCurrencyStore";
import { formatMoney } from "../../../shared/utils/formatMoney";

const CATEGORY_CONFIG = {
    alimentos: { icon: "restaurant", color: "#34d399", label: "Alimentos" },
    transporte: { icon: "directions-bus", color: "#38bdf8", label: "Transporte" },
    servicios: { icon: "receipt", color: "#fbbf24", label: "Servicios" },
    entretenimiento: { icon: "movie", color: "#a78bfa", label: "Entretenimiento" },
    salud: { icon: "local-hospital", color: "#fb7185", label: "Salud" },
    educacion: { icon: "school", color: "#60a5fa", label: "Educación" },
    vivienda: { icon: "home", color: "#f472b6", label: "Vivienda" },
    ropa: { icon: "checkroom", color: "#f97316", label: "Ropa" },
    ahorro: { icon: "savings", color: "#4ade80", label: "Ahorro" },
    otros: { icon: "category", color: "#94a3b8", label: "Otros" },
};

const TRANSACTION_COLORS = {
    retiro: "#fb7185",
    transferencia: "#38bdf8",
    deposito: "#34d399",
};

const PERIODS = [
    { key: "day", label: "Hoy" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "all", label: "Todo" },
];

function groupByDate(list) {
    if (!list.length) return [];
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    list.forEach((tx) => {
        const d = new Date(tx.createdAt);
        let key;
        if (d.toDateString() === today.toDateString()) key = "Hoy";
        else if (d.toDateString() === yesterday.toDateString()) key = "Ayer";
        else key = d.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
    });
    return Object.entries(groups);
}

function PeriodBar({ active, onChange }) {
    return (
        <View style={s.periodRow}>
            {PERIODS.map((p) => (
                <TouchableOpacity
                    key={p.key}
                    style={[s.periodBtn, active === p.key && s.periodBtnActive]}
                    onPress={() => onChange(p.key)}
                >
                    <Text style={[s.periodBtnText, active === p.key && s.periodBtnTextActive]}>
                        {p.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function StatsBar({ list, money }) {
    if (!list.length) return null;
    const total = list.reduce((s, tx) => s + Number(tx.monto || 0), 0);
    const transfers = list.filter((tx) => tx.tipo === "transferencia").length;
    const withdrawals = list.filter((tx) => tx.tipo === "retiro").length;
    return (
        <View style={s.statsCard}>
            <View style={s.statsRow}>
                <View style={s.statItem}>
                    <Text style={s.statValue}>{list.length}</Text>
                    <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                    <Text style={[s.statValue, { color: COLORS.primary }]}>{transfers}</Text>
                    <Text style={s.statLabel}>Transferencias</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                    <Text style={[s.statValue, { color: COLORS.error }]}>{withdrawals}</Text>
                    <Text style={s.statLabel}>Retiros</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                    <Text style={s.statValue}>{money(total)}</Text>
                    <Text style={s.statLabel}>Total</Text>
                </View>
            </View>
        </View>
    );
}

function TransactionRow({ item, money }) {
    const catCfg = CATEGORY_CONFIG[item.categoria] || CATEGORY_CONFIG.otros;
    const txColor = TRANSACTION_COLORS[item.tipo] || COLORS.textMuted;
    return (
        <View style={s.txCard}>
            <View style={s.txLeft}>
                <View style={[s.txIcon, { backgroundColor: txColor + "20" }]}>
                    <MaterialIcons
                        name={item.tipo === "retiro" ? "arrow-upward" : "swap-horiz"}
                        size={18}
                        color={txColor}
                    />
                </View>
                <View style={s.txInfo}>
                    <Text style={s.txType}>{item.tipo === "transferencia" ? "Transferencia" : "Retiro"}</Text>
                    <Text style={s.txDate}>
                        {new Date(item.createdAt).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    {item.categoria && (
                        <View style={s.catRow}>
                            <MaterialIcons name={catCfg.icon} size={10} color={catCfg.color} />
                            <Text style={[s.catText, { color: catCfg.color }]}>{catCfg.label}</Text>
                        </View>
                    )}
                </View>
            </View>
            <Text style={[s.txAmount, { color: COLORS.error }]}>-{money(item.monto)}</Text>
        </View>
    );
}

function SectionHeader({ label, total, money }) {
    const isToday = label === "Hoy";
    return (
        <View style={[s.sectionHeader, isToday && s.sectionHeaderToday]}>
            <View style={s.sectionLabelRow}>
                <View style={[s.sectionDot, isToday && s.sectionDotToday]} />
                <Text style={[s.sectionLabel, isToday && s.sectionLabelToday]}>{label}</Text>
            </View>
            <Text style={[s.sectionTotal, isToday && s.sectionTotalToday]}>{money(total)}</Text>
        </View>
    );
}

export default function TransactionsScreen({ route }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategoria, setSelectedCategoria] = useState("otros");
    const [showFilters, setShowFilters] = useState(false);
    const [period, setPeriod] = useState("all");
    const [filters, setFilters] = useState({ desde: "", hasta: "", tipo: "", categoria: "" });
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [destinoNumero, setDestinoNumero] = useState("");
    const [form, setForm] = useState({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" });

    const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
    const exchangeRates = useCurrencyStore((s) => s.exchangeRates);
    const money = (v) => formatMoney(v, selectedCurrency, exchangeRates);

    const load = useCallback(async () => {
        try {
            const params = {};
            if (filters.tipo) params.tipo = filters.tipo;
            if (filters.desde) params.fechaInicio = filters.desde;
            if (filters.hasta) params.fechaFin = filters.hasta;

            const [txResult, accResult, catResult] = await Promise.allSettled([
                getMyTransactionsApi(params),
                getAccountsApi(),
                getCategoriasApi(),
            ]);

            if (txResult.status === "fulfilled") {
                let list = Array.isArray(txResult.value) ? txResult.value : [];
                if (filters.categoria) list = list.filter((tx) => tx.categoria === filters.categoria);
                if (period !== "all") {
                    const now = new Date();
                    list = list.filter((tx) => {
                        const d = new Date(tx.createdAt);
                        if (period === "day") return d.toDateString() === now.toDateString();
                        if (period === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
                        if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        return true;
                    });
                }
                setTransactions(list);
            }

            if (accResult.status === "fulfilled") {
                setAccounts(Array.isArray(accResult.value) ? accResult.value : []);
            }

            if (catResult.status === "fulfilled") {
                setCategorias(Array.isArray(catResult.value) ? catResult.value : []);
            }
        } catch { } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters, period]);

    useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

    useEffect(() => {
        if (route.params?.openTransfer) {
            setForm((f) => ({ ...f, tipo: "transferencia" }));
            if (route.params?.sourceAccountId) setForm((f) => ({ ...f, cuentaOrigen: route.params.sourceAccountId }));
            setShowModal(true);
        } else if (route.params?.openWithdraw) {
            setForm((f) => ({ ...f, tipo: "retiro" }));
            if (route.params?.sourceAccountId) setForm((f) => ({ ...f, cuentaOrigen: route.params.sourceAccountId }));
            setShowModal(true);
        }
    }, [route.params]);

    const onRefresh = () => { setRefreshing(true); load(); };

    const activeFilterCount = [filters.tipo, filters.categoria, filters.desde, filters.hasta].filter(Boolean).length;

    const handleSearchDestino = async () => {
        if (!destinoNumero.trim()) return;
        try { setSearching(true); const r = await searchAccountByNumberApi(destinoNumero.trim()); setSearchResult(r); }
        catch { setSearchResult(null); Alert.alert("Error", "Cuenta no encontrada"); }
        finally { setSearching(false); }
    };

    const handleCreate = async () => {
        if (!form.monto || Number(form.monto) <= 0) return Alert.alert("Error", "Ingresa un monto válido");
        if (form.tipo === "transferencia" && !form.cuentaDestino) return Alert.alert("Error", "Selecciona o busca una cuenta destino");
        if (form.tipo === "retiro" && !form.cuentaOrigen) return Alert.alert("Error", "Selecciona la cuenta origen");
        const src = accounts.find((a) => (a._id || a.id) === form.cuentaOrigen);
        if (src && Number(form.monto) > Number(src.saldo)) return Alert.alert("Saldo insuficiente", `Tu saldo es ${money(src.saldo)}`);
        try {
            setCreating(true);
            const payload = { tipo: form.tipo, monto: Number(form.monto), cuentaOrigen: form.cuentaOrigen || undefined, cuentaDestino: form.cuentaDestino || undefined };
            if (form.tipo === "transferencia") payload.categoria = selectedCategoria;
            await createTransactionApi(payload);
            setShowModal(false);
            setForm({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" });
            setDestinoNumero(""); setSearchResult(null); setSelectedCategoria("otros");
            Alert.alert("Éxito", "Transacción creada correctamente");
            load();
        } catch (err) { Alert.alert("Error", err.response?.data?.message || "Error al crear transacción"); }
        finally { setCreating(false); }
    };

    const applyFilters = () => { setLoading(true); load(); };
    const clearFilters = () => { setFilters({ desde: "", hasta: "", tipo: "", categoria: "" }); setShowFilters(false); };

    const grouped = useMemo(() => groupByDate(transactions), [transactions]);
    const activeAccounts = accounts.filter((a) => a.estado === "activa");

    const sections = useMemo(() => {
        const items = [];
        grouped.forEach(([label, txs]) => {
            const total = txs.reduce((s, tx) => s + Number(tx.monto || 0), 0);
            items.push({ type: "section", label, total });
            txs.forEach((tx) => items.push({ type: "tx", data: tx }));
        });
        return items;
    }, [grouped]);

    const renderItem = useCallback(({ item }) => {
        if (item.type === "section") return <SectionHeader label={item.label} total={item.total} money={money} />;
        return <TransactionRow item={item.data} money={money} />;
    }, [money]);

    return (
        <View style={s.container}>
            <FlatList
                data={sections}
                keyExtractor={(item, idx) => item.type === "section" ? `s-${item.label}` : `tx-${item.data._id || item.data.id || idx}`}
                renderItem={renderItem}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View>
                        <View style={s.header}>
                            <View>
                                <Text style={s.title}>Movimientos</Text>
                                <Text style={s.count}>{transactions.length} transacción(es)</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                                <TouchableOpacity style={[s.headerBtn, showFilters && s.headerBtnActive]} onPress={() => setShowFilters(!showFilters)}>
                                    <MaterialIcons name="filter-list" size={22} color={showFilters ? COLORS.primary : COLORS.textMuted} />
                                    {activeFilterCount > 0 && (
                                        <View style={s.filterDot}><Text style={s.filterDotText}>{activeFilterCount}</Text></View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
                                    <MaterialIcons name="add" size={22} color={COLORS.surface} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <PeriodBar active={period} onChange={(k) => { setPeriod(k); setLoading(true); }} />

                        <StatsBar list={transactions} money={money} />

                        {showFilters && (
                            <View style={s.filterPanel}>
                                <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.filterLabel}>Desde</Text>
                                        <TextInput style={s.filterInput} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} value={filters.desde} onChangeText={(v) => setFilters((f) => ({ ...f, desde: v }))} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.filterLabel}>Hasta</Text>
                                        <TextInput style={s.filterInput} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} value={filters.hasta} onChangeText={(v) => setFilters((f) => ({ ...f, hasta: v }))} />
                                    </View>
                                </View>
                                <Text style={[s.filterLabel, { marginTop: SPACING.sm }]}>Tipo</Text>
                                <View style={s.tipoRow}>
                                    {["", "retiro", "transferencia"].map((t) => (
                                        <TouchableOpacity key={t || "todos"} style={[s.tipoBtn, filters.tipo === t && s.tipoBtnActive]} onPress={() => setFilters((f) => ({ ...f, tipo: t }))}>
                                            <Text style={[s.tipoBtnText, filters.tipo === t && s.tipoBtnTextActive]}>{t ? (t.charAt(0).toUpperCase() + t.slice(1)) : "Todos"}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={[s.filterLabel, { marginTop: SPACING.sm }]}>Categoría</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                                    <View style={{ flexDirection: "row", gap: 6 }}>
                                        {["", ...categorias].map((c) => (
                                            <TouchableOpacity key={c || "todas"} style={[s.catChip, filters.categoria === c && s.catChipActive]} onPress={() => setFilters((f) => ({ ...f, categoria: c }))}>
                                                <Text style={[s.catChipText, filters.categoria === c && s.catChipTextActive]}>{c || "Todas"}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                                <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                                    <Button title="Aplicar" onPress={applyFilters} style={{ flex: 1 }} />
                                    <Button title="Limpiar" variant="secondary" onPress={clearFilters} style={{ flex: 1 }} />
                                </View>
                            </View>
                        )}

                        {activeFilterCount > 0 && !showFilters && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.activeFiltersRow}>
                                {filters.tipo ? (
                                    <View style={s.activeChip}>
                                        <Text style={s.activeChipText}>Tipo: {filters.tipo}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, tipo: "" }))}><MaterialIcons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.categoria ? (
                                    <View style={s.activeChip}>
                                        <Text style={s.activeChipText}>Cat: {filters.categoria}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, categoria: "" }))}><MaterialIcons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.desde ? (
                                    <View style={s.activeChip}>
                                        <Text style={s.activeChipText}>Desde: {filters.desde}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, desde: "" }))}><MaterialIcons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.hasta ? (
                                    <View style={s.activeChip}>
                                        <Text style={s.activeChipText}>Hasta: {filters.hasta}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, hasta: "" }))}><MaterialIcons name="close" size={14} color={COLORS.primary} /></TouchableOpacity>
                                    </View>
                                ) : null}
                            </ScrollView>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={s.empty}>
                            <MaterialIcons name="receipt-long" size={56} color={COLORS.textMuted} />
                            <Text style={s.emptyText}>Sin movimientos</Text>
                            <Text style={s.emptySubtext}>Realiza una transferencia o retiro para ver movimientos aquí</Text>
                            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)}>
                                <MaterialIcons name="add" size={18} color={COLORS.surface} />
                                <Text style={s.emptyBtnText}>Nuevo movimiento</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <ScrollView style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{form.tipo === "retiro" ? "Nuevo Retiro" : "Nueva Transferencia"}</Text>
                            <TouchableOpacity onPress={() => { setShowModal(false); setForm({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" }); setDestinoNumero(""); setSearchResult(null); }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.tipoSelector}>
                            {["transferencia", "retiro"].map((t) => (
                                <TouchableOpacity key={t} style={[s.tipoOption, form.tipo === t && s.tipoOptionActive]} onPress={() => setForm((f) => ({ ...f, tipo: t, cuentaDestino: "" }))}>
                                    <MaterialIcons name={t === "transferencia" ? "swap-horiz" : "arrow-upward"} size={20} color={form.tipo === t ? COLORS.surface : COLORS.textMuted} />
                                    <Text style={[s.tipoOptionText, form.tipo === t && s.tipoOptionTextActive]}>{t === "transferencia" ? "Transferencia" : "Retiro"}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={s.fieldLabel}>Cuenta Origen</Text>
                            {activeAccounts.map((a) => (
                                <TouchableOpacity key={a._id || a.id} style={[s.optionBtn, form.cuentaOrigen === (a._id || a.id) && s.optionBtnActive]} onPress={() => setForm((f) => ({ ...f, cuentaOrigen: a._id || a.id }))}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.optionText, form.cuentaOrigen === (a._id || a.id) && s.optionTextActive]}>{a.nombre} - {a.numeroCuenta}</Text>
                                        <Text style={s.optionSubtext}>{money(a.saldo)} disponibles</Text>
                                    </View>
                                    {form.cuentaOrigen === (a._id || a.id) && <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {form.tipo === "transferencia" && (
                            <>
                                <Input label="Número de Cuenta Destino" placeholder="Buscar por número de cuenta" value={destinoNumero} onChangeText={(v) => { setDestinoNumero(v); setSearchResult(null); }} />
                                <Button title={searching ? "Buscando..." : "Buscar Cuenta"} onPress={handleSearchDestino} loading={searching} variant="secondary" style={{ marginBottom: SPACING.md }} />
                                {searchResult && (
                                    <TouchableOpacity style={s.searchResultCard} onPress={() => setForm((f) => ({ ...f, cuentaDestino: searchResult._id || searchResult.id }))}>
                                        <MaterialIcons name="check-circle" size={20} color={form.cuentaDestino === (searchResult._id || searchResult.id) ? COLORS.success : COLORS.textMuted} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.searchResultText}>{searchResult.nombre} - {searchResult.numeroCuenta}</Text>
                                            <Text style={s.searchResultSubtext}>{searchResult.tipoCuenta} | Saldo: {money(searchResult.saldo)}</Text>
                                        </View>
                                        {form.cuentaDestino === (searchResult._id || searchResult.id) && <MaterialIcons name="check" size={20} color={COLORS.success} />}
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <Input label="Monto" placeholder="0.00" keyboardType="numeric" value={form.monto} onChangeText={(v) => setForm((f) => ({ ...f, monto: v }))} />

                        {form.tipo === "transferencia" && (
                            <View style={s.fieldGroup}>
                                <Text style={s.fieldLabel}>Categoría</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: "row", gap: 6 }}>
                                        {categorias.length > 0 ? categorias : Object.keys(CATEGORY_CONFIG).map((c) => {
                                            const cfg = CATEGORY_CONFIG[c];
                                            return (
                                                <TouchableOpacity key={c} style={[s.catOption, selectedCategoria === c && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => setSelectedCategoria(c)}>
                                                    <MaterialIcons name={cfg.icon} size={16} color={selectedCategoria === c ? COLORS.surface : cfg.color} />
                                                    <Text style={[s.catOptionText, selectedCategoria === c && s.catOptionTextActive]}>{cfg.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        <Button title={form.tipo === "retiro" ? "Realizar Retiro" : "Realizar Transferencia"} onPress={handleCreate} loading={creating} style={{ marginTop: SPACING.sm }} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
    count: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
    headerBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
    filterDot: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
    filterDotText: { fontSize: 9, color: COLORS.surface, fontWeight: "700" },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.sm },
    periodRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    periodBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    periodBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
    periodBtnTextActive: { color: COLORS.surface },
    statsCard: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, paddingVertical: 10, paddingHorizontal: 6 },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statItem: { flex: 1, alignItems: "center", gap: 1 },
    statDivider: { width: 1, height: 22, backgroundColor: COLORS.border },
    statValue: { fontSize: 15, fontWeight: "700", color: COLORS.text },
    statLabel: { fontSize: 11, color: COLORS.textLight },
    filterPanel: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
    filterLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 6 },
    filterInput: { backgroundColor: COLORS.surfaceAlt, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    tipoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    tipoBtn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    tipoBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    tipoBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
    tipoBtnTextActive: { color: COLORS.primary },
    catChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    catChipText: { fontSize: 13, color: COLORS.textMuted },
    catChipTextActive: { color: COLORS.primary, fontWeight: "600" },
    activeFiltersRow: { flexDirection: "row", marginBottom: 10, gap: 8 },
    activeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "30" },
    activeChipText: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8, marginBottom: 6 },
    sectionHeaderToday: { borderColor: COLORS.primary + "40", backgroundColor: COLORS.primary + "08" },
    sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textMuted },
    sectionDotToday: { backgroundColor: COLORS.primary, width: 8, height: 8, borderRadius: 4 },
    sectionLabel: { fontSize: 15, fontWeight: "700", color: COLORS.text },
    sectionLabelToday: { color: COLORS.primary },
    sectionTotal: { fontSize: 14, fontWeight: "600", color: COLORS.textLight },
    sectionTotalToday: { color: COLORS.primary },
    txCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 4 },
    txLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    txIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    txInfo: { flex: 1, flexShrink: 1 },
    txType: { fontSize: 14, fontWeight: "600", color: COLORS.text },
    txDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    catRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    catText: { fontSize: 11, fontWeight: "500" },
    txAmount: { fontSize: 15, fontWeight: "700" },
    empty: { alignItems: "center", paddingVertical: 100, gap: 16 },
    emptyText: { fontSize: 16, color: COLORS.textMuted },
    emptySubtext: { fontSize: 14, color: COLORS.textLight, textAlign: "center", paddingHorizontal: 40 },
    emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, ...SHADOWS.sm },
    emptyBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.surface },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
    tipoSelector: { flexDirection: "row", gap: 12, marginBottom: 20 },
    tipoOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    tipoOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tipoOptionText: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
    tipoOptionTextActive: { color: COLORS.surface },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textLight, marginBottom: 8 },
    optionBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6, backgroundColor: COLORS.surfaceAlt },
    optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
    optionText: { fontSize: 14, color: COLORS.textLight },
    optionTextActive: { color: COLORS.primary, fontWeight: "600" },
    optionSubtext: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    searchResultCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderStrong, padding: 14, marginBottom: 16 },
    searchResultText: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
    searchResultSubtext: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    catOption: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    catOptionText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
    catOptionTextActive: { color: COLORS.surface, fontWeight: "600" },
});
