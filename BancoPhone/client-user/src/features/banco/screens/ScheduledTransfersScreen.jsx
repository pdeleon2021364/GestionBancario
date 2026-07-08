import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getScheduledTransfersApi, createScheduledTransferApi, cancelScheduledTransferApi, getAccountsApi, searchAccountByNumberApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const FREQ_MAP = {
    unica: "Única",
    diaria: "Diaria",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
};

const FREQ_ICONS = {
    unica: "looks-one",
    diaria: "today",
    semanal: "date-range",
    quincenal: "repeat",
    mensual: "calendar-month",
};

const FREQ_OPTIONS = ["unica", "diaria", "semanal", "quincenal", "mensual"];

const STATUS_BADGE = {
    activa: { label: "Activa", color: COLORS.success },
    pausada: { label: "Pausada", color: COLORS.warning },
    completada: { label: "Completada", color: COLORS.primary },
    cancelada: { label: "Cancelada", color: COLORS.error },
};

const ScheduledTransfersScreen = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [form, setForm] = useState({
        nombre: "",
        cuentaOrigen: "",
        cuentaDestinoNumero: "",
        monto: "",
        frecuencia: "unica",
        proximaEjecucion: "",
        descripcion: "",
    });

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const dateText = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("es-GT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getDaysUntil = (dateStr) => {
        if (!dateStr) return null;
        const now = new Date();
        const target = new Date(dateStr);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const load = async () => {
        try {
            const [txData, accData] = await Promise.all([
                getScheduledTransfersApi(),
                getAccountsApi(),
            ]);
            setTransfers(Array.isArray(txData) ? txData : []);
            setAccounts(Array.isArray(accData) ? accData : []);
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

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const handleSearchDestination = async () => {
        if (!form.cuentaDestinoNumero.trim()) return;
        try {
            setSearching(true);
            const result = await searchAccountByNumberApi(form.cuentaDestinoNumero.trim());
            setSearchResult(result);
        } catch (err) {
            Alert.alert("Error", "Cuenta destino no encontrada");
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!form.nombre.trim()) {
            return Alert.alert("Error", "Ingresa un nombre para la transferencia");
        }
        if (!form.cuentaOrigen) {
            return Alert.alert("Error", "Selecciona una cuenta origen");
        }
        if (!form.cuentaDestinoNumero.trim()) {
            return Alert.alert("Error", "Ingresa el número de cuenta destino");
        }
        if (!form.monto || Number(form.monto) <= 0) {
            return Alert.alert("Error", "Ingresa un monto válido");
        }
        if (!form.proximaEjecucion.trim()) {
            return Alert.alert("Error", "Ingresa la fecha de próxima ejecución");
        }
        try {
            setCreating(true);
            await createScheduledTransferApi({
                nombre: form.nombre.trim(),
                cuentaOrigen: form.cuentaOrigen,
                cuentaDestinoNumero: form.cuentaDestinoNumero.trim(),
                monto: Number(form.monto),
                frecuencia: form.frecuencia,
                proximaEjecucion: form.proximaEjecucion.trim(),
                descripcion: form.descripcion.trim() || undefined,
            });
            setShowModal(false);
            setForm({
                nombre: "",
                cuentaOrigen: "",
                cuentaDestinoNumero: "",
                monto: "",
                frecuencia: "unica",
                proximaEjecucion: "",
                descripcion: "",
            });
            setSearchResult(null);
            Alert.alert("Éxito", "Transferencia programada creada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear transferencia");
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = (item) => {
        Alert.alert("Cancelar Transferencia", `¿Cancelar "${item.nombre}"? Esta acción no se puede deshacer.`, [
            { text: "No", style: "cancel" },
            {
                text: "Sí, cancelar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await cancelScheduledTransferApi(item._id || item.id);
                        load();
                    } catch (err) {
                        Alert.alert("Error", err.response?.data?.message || "Error al cancelar");
                    }
                },
            },
        ]);
    };

    const activeTransfers = transfers.filter((t) => t.estado === "activa").length;
    const monthlyTotal = transfers.filter((t) => t.estado === "activa").reduce((s, t) => s + Number(t.monto || 0), 0);

    const renderTransfer = ({ item }) => {
        const status = STATUS_BADGE[item.estado] || { label: item.estado || "Activa", color: COLORS.textMuted };
        const daysLeft = getDaysUntil(item.proximaEjecucion);

        return (
            <View style={styles.txCard}>
                <View style={styles.txHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <MaterialIcons name={FREQ_ICONS[item.frecuencia] || "schedule"} size={20} color={COLORS.primary} />
                        <Text style={styles.txName}>{item.nombre}</Text>
                    </View>
                    {item.estado !== "cancelada" && item.estado !== "completada" && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                            <MaterialIcons name="cancel" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.txDetail}>
                    <MaterialIcons name="account-balance" size={14} color={COLORS.textMuted} />
                    <Text style={styles.txDetailText}>
                        Origen: {item.cuentaOrigen?.nombre || "—"} ({item.cuentaOrigen?.numeroCuenta || "—"})
                    </Text>
                </View>

                <View style={styles.txDetail}>
                    <MaterialIcons name="arrow-forward" size={14} color={COLORS.textMuted} />
                    <Text style={styles.txDetailText}>
                        Destino: {item.cuentaDestinoNumero}
                    </Text>
                </View>

                <View style={styles.txRow}>
                    <Text style={styles.txAmount}>{money(item.monto)}</Text>
                    <View style={[styles.freqBadge, { backgroundColor: COLORS.primary + "15" }]}>
                        <MaterialIcons name={FREQ_ICONS[item.frecuencia] || "schedule"} size={12} color={COLORS.primary} />
                        <Text style={styles.freqText}>{FREQ_MAP[item.frecuencia] || item.frecuencia}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {item.proximaEjecucion && (
                    <View style={styles.dateRow}>
                        <MaterialIcons name="event" size={14} color={COLORS.textMuted} />
                        <Text style={styles.txDate}>
                            Próxima: {dateText(item.proximaEjecucion)}
                        </Text>
                        {daysLeft !== null && daysLeft >= 0 && item.estado === "activa" && (
                            <View style={[styles.daysBadge, daysLeft <= 2 ? { backgroundColor: COLORS.warning + "20" } : { backgroundColor: COLORS.success + "15" }]}>
                                <Text style={[styles.daysText, { color: daysLeft <= 2 ? COLORS.warning : COLORS.success }]}>
                                    {daysLeft === 0 ? "Hoy" : daysLeft === 1 ? "Mañana" : `${daysLeft} días`}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {item.descripcion && (
                    <Text style={styles.txDesc}>{item.descripcion}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={transfers}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderTransfer}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Programadas</Text>
                                <Text style={styles.count}>{transfers.length} transferencia(s)</Text>
                            </View>
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                                <MaterialIcons name="add" size={24} color={COLORS.surface} />
                            </TouchableOpacity>
                        </View>
                        {transfers.length > 0 && (
                            <View style={styles.statsRow}>
                                <View style={styles.statCard}>
                                    <MaterialIcons name="play-circle" size={18} color={COLORS.success} />
                                    <Text style={styles.statValue}>{activeTransfers}</Text>
                                    <Text style={styles.statLabel}>Activas</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <MaterialIcons name="payments" size={18} color={COLORS.primary} />
                                    <Text style={[styles.statValue, { fontSize: FONT_SIZE.sm }]}>{money(monthlyTotal)}</Text>
                                    <Text style={styles.statLabel}>Total mensual</Text>
                                </View>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="schedule" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin transferencias programadas</Text>
                            <Text style={styles.emptySubtext}>Programa una transferencia recurrente</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva Transferencia Programada</Text>
                            <TouchableOpacity onPress={() => {
                                setShowModal(false);
                                setForm({
                                    nombre: "",
                                    cuentaOrigen: "",
                                    cuentaDestinoNumero: "",
                                    monto: "",
                                    frecuencia: "unica",
                                    proximaEjecucion: "",
                                    descripcion: "",
                                });
                                setSearchResult(null);
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Nombre"
                            placeholder="Ej: Pago de renta"
                            value={form.nombre}
                            onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Cuenta Origen</Text>
                            {accounts
                                .filter((a) => a.estado === "activa" || !a.estado)
                                .map((a) => (
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

                        <Input
                            label="Número de Cuenta Destino"
                            placeholder="Ingresa el número de cuenta"
                            value={form.cuentaDestinoNumero}
                            onChangeText={(v) => {
                                setForm((f) => ({ ...f, cuentaDestinoNumero: v }));
                                setSearchResult(null);
                            }}
                        />
                        <Button
                            title={searching ? "Buscando..." : "Buscar Cuenta Destino"}
                            onPress={handleSearchDestination}
                            loading={searching}
                            variant="secondary"
                            style={{ marginBottom: SPACING.md }}
                        />

                        {searchResult && (
                            <View style={styles.searchResultCard}>
                                <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.searchResultText}>
                                        {searchResult.nombre} - {searchResult.numeroCuenta}
                                    </Text>
                                    <Text style={styles.searchResultSubtext}>
                                        {searchResult.tipoCuenta} | Saldo: {money(searchResult.saldo)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <Input
                            label="Monto"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={form.monto}
                            onChangeText={(v) => setForm((f) => ({ ...f, monto: v }))}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Frecuencia</Text>
                            <View style={styles.freqRow}>
                                {FREQ_OPTIONS.map((f) => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.freqBtn, form.frecuencia === f && styles.freqBtnActive]}
                                        onPress={() => setForm((prev) => ({ ...prev, frecuencia: f }))}
                                    >
                                        <MaterialIcons name={FREQ_ICONS[f] || "schedule"} size={16} color={form.frecuencia === f ? COLORS.primary : COLORS.textMuted} />
                                        <Text style={[styles.freqBtnText, form.frecuencia === f && styles.freqBtnTextActive]}>
                                            {FREQ_MAP[f]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Input
                            label="Próxima Ejecución"
                            placeholder="YYYY-MM-DD"
                            value={form.proximaEjecucion}
                            onChangeText={(v) => setForm((f) => ({ ...f, proximaEjecucion: v }))}
                        />

                        <Input
                            label="Descripción (opcional)"
                            placeholder="Notas adicionales"
                            value={form.descripcion}
                            onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                        />

                        <Button
                            title="Crear Transferencia Programada"
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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    addBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.md },
    statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 4, ...SHADOWS.sm },
    statValue: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    txCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
    txHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
    txName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, flex: 1 },
    cancelBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.error + "15", alignItems: "center", justifyContent: "center" },
    txDetail: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    txDetailText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
    txRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: SPACING.sm },
    txAmount: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    freqBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    freqText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: "600" },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: "auto" },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.xs },
    txDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    daysBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
    daysText: { fontSize: 9, fontWeight: "600" },
    txDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, fontStyle: "italic", marginTop: SPACING.xs, paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.border },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.sm },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
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
    freqRow: { flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" },
    freqBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    freqBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    freqBtnText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "600" },
    freqBtnTextActive: { color: COLORS.primary },
});

export default ScheduledTransfersScreen;
