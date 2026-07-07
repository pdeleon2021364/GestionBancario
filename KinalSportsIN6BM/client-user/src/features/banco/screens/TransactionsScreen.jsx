import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback, useEffect } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getMyTransactionsApi, createTransactionApi, getAccountsApi, searchAccountByNumberApi, getCategoriasApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const TYPE_COLORS = {
    retiro: "#fb7185",
    transferencia: "#38bdf8",
};

const CATEGORY_COLORS = {
    alimentos: "#34d399", transporte: "#38bdf8", servicios: "#fbbf24",
    entretenimiento: "#a78bfa", salud: "#fb7185", educacion: "#60a5fa",
    vivienda: "#f472b6", ropa: "#f97316", ahorro: "#4ade80", otros: "#94a3b8",
};

const CATEGORY_ICONS = {
    alimentos: "restaurant", transporte: "directions-bus", servicios: "receipt",
    entretenimiento: "movie", salud: "local-hospital", educacion: "school",
    vivienda: "home", ropa: "checkroom", ahorro: "savings", otros: "category",
};

const TransactionsScreen = ({ route }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategoria, setSelectedCategoria] = useState("otros");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ desde: "", hasta: "", tipo: "", categoria: "" });
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [destinoNumero, setDestinoNumero] = useState("");
    const [form, setForm] = useState({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" });

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const load = async () => {
        try {
            const params = {};
            if (filters.tipo) params.tipo = filters.tipo;
            if (filters.desde) params.fechaInicio = filters.desde;
            if (filters.hasta) params.fechaFin = filters.hasta;
            const [txData, accData, catData] = await Promise.all([
                getMyTransactionsApi(params),
                getAccountsApi(),
                getCategoriasApi(),
            ]);
            let list = Array.isArray(txData) ? txData : [];
            if (filters.categoria) {
                list = list.filter((tx) => tx.categoria === filters.categoria);
            }
            setTransactions(list);
            setAccounts(Array.isArray(accData) ? accData : []);
            setCategorias(Array.isArray(catData) ? catData : []);
        } catch {} finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load();
        }, []),
    );

    useEffect(() => {
        if (route.params?.openTransfer) {
            setForm((f) => ({ ...f, tipo: "transferencia" }));
            if (route.params?.sourceAccountId) {
                setForm((f) => ({ ...f, cuentaOrigen: route.params.sourceAccountId }));
            }
            setShowModal(true);
        } else if (route.params?.openWithdraw) {
            setForm((f) => ({ ...f, tipo: "retiro" }));
            if (route.params?.sourceAccountId) {
                setForm((f) => ({ ...f, cuentaOrigen: route.params.sourceAccountId }));
            }
            setShowModal(true);
        }
    }, [route.params]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const handleSearchDestino = async () => {
        if (!destinoNumero.trim()) return;
        try {
            setSearching(true);
            const result = await searchAccountByNumberApi(destinoNumero.trim());
            setSearchResult(result);
        } catch {
            setSearchResult(null);
            Alert.alert("Error", "Cuenta no encontrada");
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!form.monto || Number(form.monto) <= 0) {
            return Alert.alert("Error", "Ingresa un monto válido");
        }
        if (form.tipo === "transferencia" && !form.cuentaDestino) {
            return Alert.alert("Error", "Selecciona o busca una cuenta destino");
        }
        if (form.tipo === "retiro" && !form.cuentaOrigen) {
            return Alert.alert("Error", "Selecciona la cuenta origen");
        }
        const sourceAccount = accounts.find((a) => (a._id || a.id) === form.cuentaOrigen);
        if (sourceAccount && Number(form.monto) > Number(sourceAccount.saldo)) {
            return Alert.alert("Saldo insuficiente", `Tu saldo es ${money(sourceAccount.saldo)}`);
        }
        try {
            setCreating(true);
            const payload = {
                tipo: form.tipo,
                monto: Number(form.monto),
                cuentaOrigen: form.cuentaOrigen || undefined,
                cuentaDestino: form.cuentaDestino || undefined,
            };
            if (form.tipo === "transferencia") payload.categoria = selectedCategoria;
            await createTransactionApi(payload);
            setShowModal(false);
            setForm({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" });
            setDestinoNumero("");
            setSearchResult(null);
            setSelectedCategoria("otros");
            Alert.alert("Éxito", "Transacción creada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear transacción");
        } finally {
            setCreating(false);
        }
    };

    const applyFilters = () => {
        setLoading(true);
        load();
    };

    const clearFilters = () => {
        setFilters({ desde: "", hasta: "", tipo: "", categoria: "" });
        setShowFilters(false);
    };

    const dateText = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("es-GT", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const activeFilterCount = [filters.tipo, filters.categoria, filters.desde, filters.hasta].filter(Boolean).length;

    const totalAmount = transactions.reduce((s, tx) => s + Number(tx.monto || 0), 0);
    const transferCount = transactions.filter((tx) => tx.tipo === "transferencia").length;
    const retiroCount = transactions.filter((tx) => tx.tipo === "retiro").length;

    const renderTx = ({ item }) => (
        <View style={styles.txCard}>
            <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[item.tipo] || COLORS.textMuted) + "20" }]}>
                    <MaterialIcons
                        name={item.tipo === "retiro" ? "arrow-upward" : "swap-horiz"}
                        size={18}
                        color={TYPE_COLORS[item.tipo] || COLORS.textMuted}
                    />
                </View>
                <View style={styles.txInfo}>
                    <Text style={styles.txType}>{item.tipo === "transferencia" ? "Transferencia" : "Retiro"}</Text>
                    <Text style={styles.txDate}>{dateText(item.createdAt)}</Text>
                    {item.categoria && (
                        <View style={styles.catRow}>
                            <MaterialIcons name={CATEGORY_ICONS[item.categoria] || "category"} size={10} color={CATEGORY_COLORS[item.categoria] || COLORS.textMuted} />
                            <Text style={[styles.catText, { color: CATEGORY_COLORS[item.categoria] || COLORS.textMuted }]}>
                                {item.categoria}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <Text style={[styles.txAmount, { color: COLORS.error }]}>
                -{money(item.monto)}
            </Text>
        </View>
    );

    const activeAccounts = accounts.filter((a) => a.estado === "activa");

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderTx}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Movimientos</Text>
                                <Text style={styles.count}>{transactions.length} transacción(es)</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                                <TouchableOpacity style={[styles.headerBtn, showFilters && styles.headerBtnActive]} onPress={() => setShowFilters(!showFilters)}>
                                    <MaterialIcons name="filter-list" size={22} color={showFilters ? COLORS.primary : COLORS.textMuted} />
                                    {activeFilterCount > 0 && (
                                        <View style={styles.filterDot}>
                                            <Text style={styles.filterDotText}>{activeFilterCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                                    <MaterialIcons name="add" size={22} color={COLORS.surface} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {transactions.length > 0 && (
                            <View style={styles.statsCard}>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{transactions.length}</Text>
                                        <Text style={styles.statLabel}>Total</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{transferCount}</Text>
                                        <Text style={styles.statLabel}>Transferencias</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: COLORS.error }]}>{retiroCount}</Text>
                                        <Text style={styles.statLabel}>Retiros</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{money(totalAmount)}</Text>
                                        <Text style={styles.statLabel}>Total en Q</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {showFilters && (
                            <View style={styles.filterPanel}>
                                <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.filterLabel}>Desde</Text>
                                        <TextInput
                                            style={styles.filterInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={filters.desde}
                                            onChangeText={(v) => setFilters((f) => ({ ...f, desde: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.filterLabel}>Hasta</Text>
                                        <TextInput
                                            style={styles.filterInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={filters.hasta}
                                            onChangeText={(v) => setFilters((f) => ({ ...f, hasta: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.filterLabel, { marginTop: SPACING.sm }]}>Tipo</Text>
                                <View style={styles.tipoRow}>
                                    {["", "retiro", "transferencia"].map((t) => (
                                        <TouchableOpacity
                                            key={t || "todos"}
                                            style={[styles.tipoBtn, filters.tipo === t && styles.tipoBtnActive]}
                                            onPress={() => setFilters((f) => ({ ...f, tipo: t }))}
                                        >
                                            <Text style={[styles.tipoBtnText, filters.tipo === t && styles.tipoBtnTextActive]}>
                                                {t ? (t.charAt(0).toUpperCase() + t.slice(1)) : "Todos"}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={[styles.filterLabel, { marginTop: SPACING.sm }]}>Categoría</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                                    <View style={{ flexDirection: "row", gap: 6 }}>
                                        {["", ...categorias].map((c) => (
                                            <TouchableOpacity
                                                key={c || "todas"}
                                                style={[styles.catChip, filters.categoria === c && styles.catChipActive]}
                                                onPress={() => setFilters((f) => ({ ...f, categoria: c }))}
                                            >
                                                <Text style={[styles.catChipText, filters.categoria === c && styles.catChipTextActive]}>
                                                    {c || "Todas"}
                                                </Text>
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
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersRow}>
                                {filters.tipo ? (
                                    <View style={styles.activeChip}>
                                        <Text style={styles.activeChipText}>Tipo: {filters.tipo}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, tipo: "" }))}>
                                            <MaterialIcons name="close" size={14} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.categoria ? (
                                    <View style={styles.activeChip}>
                                        <Text style={styles.activeChipText}>Cat: {filters.categoria}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, categoria: "" }))}>
                                            <MaterialIcons name="close" size={14} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.desde ? (
                                    <View style={styles.activeChip}>
                                        <Text style={styles.activeChipText}>Desde: {filters.desde}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, desde: "" }))}>
                                            <MaterialIcons name="close" size={14} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                                {filters.hasta ? (
                                    <View style={styles.activeChip}>
                                        <Text style={styles.activeChipText}>Hasta: {filters.hasta}</Text>
                                        <TouchableOpacity onPress={() => setFilters((f) => ({ ...f, hasta: "" }))}>
                                            <MaterialIcons name="close" size={14} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </ScrollView>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="receipt-long" size={56} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin movimientos</Text>
                            <Text style={styles.emptySubtext}>Realiza una transferencia o retiro para ver movimientos aquí</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                                <MaterialIcons name="add" size={18} color={COLORS.surface} />
                                <Text style={styles.emptyBtnText}>Nuevo movimiento</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {form.tipo === "retiro" ? "Nuevo Retiro" : "Nueva Transferencia"}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setShowModal(false);
                                setForm({ tipo: "transferencia", monto: "", cuentaOrigen: "", cuentaDestino: "" });
                                setDestinoNumero("");
                                setSearchResult(null);
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tipoSelector}>
                            {["transferencia", "retiro"].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.tipoOption, form.tipo === t && styles.tipoOptionActive]}
                                    onPress={() => setForm((f) => ({ ...f, tipo: t, cuentaDestino: "" }))}
                                >
                                    <MaterialIcons
                                        name={t === "transferencia" ? "swap-horiz" : "arrow-upward"}
                                        size={20}
                                        color={form.tipo === t ? COLORS.surface : COLORS.textMuted}
                                    />
                                    <Text style={[styles.tipoOptionText, form.tipo === t && styles.tipoOptionTextActive]}>
                                        {t === "transferencia" ? "Transferencia" : "Retiro"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Cuenta Origen</Text>
                            {activeAccounts.map((a) => (
                                <TouchableOpacity
                                    key={a._id || a.id}
                                    style={[styles.optionBtn, form.cuentaOrigen === (a._id || a.id) && styles.optionBtnActive]}
                                    onPress={() => setForm((f) => ({ ...f, cuentaOrigen: a._id || a.id }))}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionText, form.cuentaOrigen === (a._id || a.id) && styles.optionTextActive]}>
                                            {a.nombre} - {a.numeroCuenta}
                                        </Text>
                                        <Text style={styles.optionSubtext}>{money(a.saldo)} disponibles</Text>
                                    </View>
                                    {form.cuentaOrigen === (a._id || a.id) && (
                                        <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {form.tipo === "transferencia" && (
                            <>
                                <Input
                                    label="Número de Cuenta Destino"
                                    placeholder="Buscar por número de cuenta"
                                    value={destinoNumero}
                                    onChangeText={(v) => {
                                        setDestinoNumero(v);
                                        setSearchResult(null);
                                    }}
                                />
                                <Button
                                    title={searching ? "Buscando..." : "Buscar Cuenta"}
                                    onPress={handleSearchDestino}
                                    loading={searching}
                                    variant="secondary"
                                    style={{ marginBottom: SPACING.md }}
                                />

                                {searchResult && (
                                    <TouchableOpacity
                                        style={styles.searchResultCard}
                                        onPress={() => setForm((f) => ({ ...f, cuentaDestino: searchResult._id || searchResult.id }))}
                                    >
                                        <MaterialIcons name="check-circle" size={20} color={form.cuentaDestino === (searchResult._id || searchResult.id) ? COLORS.success : COLORS.textMuted} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.searchResultText}>
                                                {searchResult.nombre} - {searchResult.numeroCuenta}
                                            </Text>
                                            <Text style={styles.searchResultSubtext}>
                                                {searchResult.tipoCuenta} | Saldo: {money(searchResult.saldo)}
                                            </Text>
                                        </View>
                                        {form.cuentaDestino === (searchResult._id || searchResult.id) && (
                                            <MaterialIcons name="check" size={20} color={COLORS.success} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <Input
                            label="Monto"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={form.monto}
                            onChangeText={(v) => setForm((f) => ({ ...f, monto: v }))}
                        />

                        {form.tipo === "transferencia" && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Categoría</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: "row", gap: 6 }}>
                                        {categorias.length > 0 ? categorias : ["alimentos", "transporte", "servicios", "entretenimiento", "salud", "educacion", "vivienda", "ropa", "ahorro", "otros"].map((c) => (
                                            <TouchableOpacity
                                                key={c}
                                                style={[styles.catOption, selectedCategoria === c && { backgroundColor: CATEGORY_COLORS[c] || COLORS.primary, borderColor: CATEGORY_COLORS[c] || COLORS.primary }]}
                                                onPress={() => setSelectedCategoria(c)}
                                            >
                                                <MaterialIcons name={CATEGORY_ICONS[c] || "category"} size={16} color={selectedCategoria === c ? COLORS.surface : (CATEGORY_COLORS[c] || COLORS.textMuted)} />
                                                <Text style={[styles.catOptionText, selectedCategoria === c && styles.catOptionTextActive]}>
                                                    {c}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        <Button
                            title={form.tipo === "retiro" ? "Realizar Retiro" : "Realizar Transferencia"}
                            onPress={handleCreate}
                            loading={creating}
                            style={{ marginTop: SPACING.sm }}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
    headerBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
    filterDot: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
    filterDotText: { fontSize: 10, color: COLORS.surface, fontWeight: "700" },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.sm },
    statsCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statItem: { flex: 1, alignItems: "center", gap: 2 },
    statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
    statValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    filterPanel: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
    filterLabel: { fontSize: FONT_SIZE.xs, fontWeight: "600", color: COLORS.textMuted, marginBottom: 4 },
    filterInput: { backgroundColor: COLORS.surfaceAlt, borderRadius: 10, padding: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
    tipoRow: { flexDirection: "row", gap: 6, marginBottom: SPACING.sm },
    tipoBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    tipoBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    tipoBtnText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "600" },
    tipoBtnTextActive: { color: COLORS.primary },
    catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    catChipText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    catChipTextActive: { color: COLORS.primary, fontWeight: "600" },
    activeFiltersRow: { flexDirection: "row", marginBottom: SPACING.sm, gap: 6 },
    activeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "30" },
    activeChipText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: "500" },
    txCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs },
    txLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, flex: 1 },
    txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    txInfo: { flex: 1 },
    txType: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
    txDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    catRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
    catText: { fontSize: FONT_SIZE.xs, fontWeight: "500" },
    txAmount: { fontSize: FONT_SIZE.md, fontWeight: "700" },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: "center", paddingHorizontal: SPACING.xl },
    emptyBtn: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 14, ...SHADOWS.sm },
    emptyBtnText: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.surface },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    tipoSelector: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    tipoOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: SPACING.md, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    tipoOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tipoOptionText: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textMuted },
    tipoOptionTextActive: { color: COLORS.surface },
    fieldGroup: { marginBottom: SPACING.md },
    fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.xs },
    optionBtn: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4, backgroundColor: COLORS.surfaceAlt },
    optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
    optionText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
    optionTextActive: { color: COLORS.primary, fontWeight: "600" },
    optionSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    searchResultCard: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderStrong, padding: SPACING.md, marginBottom: SPACING.md },
    searchResultText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: "600" },
    searchResultSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    catOption: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    catOptionText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "500" },
    catOptionTextActive: { color: COLORS.surface, fontWeight: "600" },
});

export default TransactionsScreen;
