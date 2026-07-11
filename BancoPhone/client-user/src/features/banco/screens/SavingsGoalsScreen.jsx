import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getSavingsGoalsApi, createSavingGoalApi, addFundsToGoalApi, deleteSavingGoalApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useCurrencyStore } from "../../../shared/store/useCurrencyStore";
import { formatMoney } from "../../../shared/utils/formatMoney";

const PRESET_COLORS = ["#0ea5e9", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#f97316", "#ec4899"];

const STATUS_MAP = {
    activa: { label: "Activa", color: COLORS.success },
    completada: { label: "Completada", color: COLORS.primary },
    cancelada: { label: "Cancelada", color: COLORS.error },
};

const SavingsGoalsScreen = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFundsModal, setShowFundsModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [addingFunds, setAddingFunds] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [createForm, setCreateForm] = useState({
        nombre: "",
        metaAmount: "",
        deadline: "",
        color: PRESET_COLORS[0],
    });
    const [fundsForm, setFundsForm] = useState({
        monto: "",
    });

    const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
    const exchangeRates = useCurrencyStore((s) => s.exchangeRates);
    const money = (value) => formatMoney(value, selectedCurrency, exchangeRates);

    const load = async () => {
        try {
            const data = await getSavingsGoalsApi();
            setGoals(Array.isArray(data) ? data : []);
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

    const handleCreate = async () => {
        if (!createForm.nombre.trim()) {
            return Alert.alert("Error", "Ingresa un nombre para la meta");
        }
        if (!createForm.metaAmount || Number(createForm.metaAmount) <= 0) {
            return Alert.alert("Error", "Ingresa un monto meta válido");
        }
        try {
            setCreating(true);
            await createSavingGoalApi({
                nombre: createForm.nombre.trim(),
                metaAmount: Number(createForm.metaAmount),
                deadline: createForm.deadline.trim() || undefined,
                color: createForm.color,
            });
            setShowCreateModal(false);
            setCreateForm({
                nombre: "",
                metaAmount: "",
                deadline: "",
                color: PRESET_COLORS[0],
            });
            Alert.alert("Éxito", "Meta de ahorro creada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear meta");
        } finally {
            setCreating(false);
        }
    };

    const openAddFunds = (goal) => {
        setSelectedGoal(goal);
        setFundsForm({ monto: "" });
        setShowFundsModal(true);
    };

    const handleAddFunds = async () => {
        if (!fundsForm.monto || Number(fundsForm.monto) <= 0) {
            return Alert.alert("Error", "Ingresa un monto válido");
        }
        const remaining = (selectedGoal.metaAmount || 0) - (selectedGoal.currentAmount || 0);
        if (Number(fundsForm.monto) > remaining) {
            return Alert.alert("Error", `El monto excede lo restante (${money(remaining)})`);
        }
        try {
            setAddingFunds(true);
            await addFundsToGoalApi(selectedGoal._id || selectedGoal.id, {
                monto: Number(fundsForm.monto),
            });
            setShowFundsModal(false);
            setSelectedGoal(null);
            Alert.alert("Éxito", "Fondos agregados correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al agregar fondos");
        } finally {
            setAddingFunds(false);
        }
    };

    const handleDelete = (goal) => {
        Alert.alert("Eliminar Meta", `¿Eliminar "${goal.nombre}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteSavingGoalApi(goal._id || goal.id);
                        load();
                    } catch (err) {
                        Alert.alert("Error", err.response?.data?.message || "Error al eliminar");
                    }
                },
            },
        ]);
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const end = new Date(deadline);
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalGoals = goals.reduce((sum, g) => sum + (g.metaAmount || 0), 0);
    const activeGoals = goals.filter((g) => g.estado === "activa").length;
    const completedGoals = goals.filter((g) => g.estado === "completada").length;

    const renderGoal = ({ item }) => {
        const current = item.currentAmount || 0;
        const target = item.metaAmount || 1;
        const pct = Math.min((current / target) * 100, 100);
        const status = STATUS_MAP[item.estado] || { label: item.estado || "Activa", color: COLORS.textMuted };
        const daysLeft = getDaysRemaining(item.deadline);

        return (
            <TouchableOpacity style={styles.goalCard} onPress={() => openAddFunds(item)} activeOpacity={0.7}>
                <View style={styles.goalTop}>
                    <View style={styles.goalHeaderRow}>
                        <View style={[styles.colorBar, { backgroundColor: item.color || COLORS.primary }]} />
                        <View style={styles.goalInfo}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={styles.goalName}>{item.nombre}</Text>
                                {item.estado === "completada" && (
                                    <MaterialIcons name="celebration" size={16} color={COLORS.primary} />
                                )}
                            </View>
                            <Text style={styles.goalAmount}>
                                {money(current)} / {money(target)}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.goalDeleteBtn} onPress={() => handleDelete(item)}>
                            <MaterialIcons name="delete-outline" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: item.color || COLORS.primary }]} />
                    </View>
                    <View style={styles.goalFooter}>
                        <Text style={[styles.goalPct, { color: item.color || COLORS.primary }]}>{pct.toFixed(1)}%</Text>
                        {daysLeft !== null && daysLeft > 0 && (
                            <View style={styles.daysBadge}>
                                <MaterialIcons name="schedule" size={12} color={COLORS.warning} />
                                <Text style={styles.daysText}>{daysLeft} días</Text>
                            </View>
                        )}
                        {daysLeft !== null && daysLeft <= 0 && item.estado === "activa" && (
                            <View style={[styles.daysBadge, { backgroundColor: COLORS.error + "20" }]}>
                                <MaterialIcons name="warning" size={12} color={COLORS.error} />
                                <Text style={[styles.daysText, { color: COLORS.error }]}>Vencida</Text>
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={goals}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderGoal}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Metas de Ahorro</Text>
                                <Text style={styles.count}>{goals.length} meta(s)</Text>
                            </View>
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
                                <MaterialIcons name="add" size={24} color={COLORS.surface} />
                            </TouchableOpacity>
                        </View>
                        {goals.length > 0 && (
                            <>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>Total Ahorrado</Text>
                                    <Text style={styles.summaryValue}>{money(totalSaved)}</Text>
                                    <View style={styles.summaryBarBg}>
                                        <View style={[styles.summaryBarFill, { width: `${totalGoals > 0 ? Math.min((totalSaved / totalGoals) * 100, 100) : 0}%` }]} />
                                    </View>
                                    <Text style={styles.summarySubtext}>de {money(totalGoals)} en metas</Text>
                                </View>
                                <View style={styles.metaStatsRow}>
                                    <View style={styles.metaStatCard}>
                                        <MaterialIcons name="track-changes" size={18} color={COLORS.primary} />
                                        <Text style={styles.metaStatValue}>{activeGoals}</Text>
                                        <Text style={styles.metaStatLabel}>Activas</Text>
                                    </View>
                                    <View style={styles.metaStatCard}>
                                        <MaterialIcons name="celebration" size={18} color={COLORS.success} />
                                        <Text style={[styles.metaStatValue, { color: COLORS.success }]}>{completedGoals}</Text>
                                        <Text style={styles.metaStatLabel}>Completadas</Text>
                                    </View>
                                    <View style={styles.metaStatCard}>
                                        <MaterialIcons name="percent" size={18} color={COLORS.secondary} />
                                        <Text style={styles.metaStatValue}>{totalGoals > 0 ? Math.round((totalSaved / totalGoals) * 100) : 0}%</Text>
                                        <Text style={styles.metaStatLabel}>Progreso</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="savings" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin metas de ahorro</Text>
                            <Text style={styles.emptySubtext}>Crea tu primera meta para empezar a ahorrar</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>
                            <TouchableOpacity onPress={() => {
                                setShowCreateModal(false);
                                setCreateForm({ nombre: "", metaAmount: "", deadline: "", color: PRESET_COLORS[0] });
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Nombre"
                            placeholder="Ej: Viaje a la playa"
                            value={createForm.nombre}
                            onChangeText={(v) => setCreateForm((f) => ({ ...f, nombre: v }))}
                        />

                        <Input
                            label="Monto Meta"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={createForm.metaAmount}
                            onChangeText={(v) => setCreateForm((f) => ({ ...f, metaAmount: v }))}
                        />

                        <Input
                            label="Fecha Límite (opcional)"
                            placeholder="YYYY-MM-DD"
                            value={createForm.deadline}
                            onChangeText={(v) => setCreateForm((f) => ({ ...f, deadline: v }))}
                        />

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Color</Text>
                            <View style={styles.colorRow}>
                                {PRESET_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: c },
                                            createForm.color === c && styles.colorCircleActive,
                                        ]}
                                        onPress={() => setCreateForm((f) => ({ ...f, color: c }))}
                                    />
                                ))}
                            </View>
                        </View>

                        <Button
                            title="Crear Meta"
                            onPress={handleCreate}
                            loading={creating}
                            style={{ marginTop: SPACING.sm }}
                        />
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={showFundsModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Agregar Fondos</Text>
                            <TouchableOpacity onPress={() => {
                                setShowFundsModal(false);
                                setSelectedGoal(null);
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedGoal && (
                            <View style={styles.fundsInfoCard}>
                                <View style={[styles.fundsColorBar, { backgroundColor: selectedGoal.color || COLORS.primary }]} />
                                <View style={styles.fundsInfoText}>
                                    <Text style={styles.fundsGoalName}>{selectedGoal.nombre}</Text>
                                    <Text style={styles.fundsProgress}>
                                        {money(selectedGoal.currentAmount || 0)} / {money(selectedGoal.metaAmount || 0)}
                                    </Text>
                                    <Text style={styles.fundsRemaining}>
                                        Restante: {money((selectedGoal.metaAmount || 0) - (selectedGoal.currentAmount || 0))}
                                    </Text>
                                    {selectedGoal.deadline && (
                                        <View style={styles.fundsDeadlineRow}>
                                            <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                            <Text style={styles.fundsDeadlineText}>
                                                Vence: {new Date(selectedGoal.deadline).toLocaleDateString("es-GT")}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        <Input
                            label="Monto a agregar"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={fundsForm.monto}
                            onChangeText={(v) => setFundsForm((f) => ({ ...f, monto: v }))}
                        />

                        <Button
                            title="Agregar Fondos"
                            onPress={handleAddFunds}
                            loading={addingFunds}
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
    addBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.md },
    summaryCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm },
    summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1 },
    summaryValue: { fontSize: FONT_SIZE.huge, fontWeight: "700", color: COLORS.text, marginVertical: SPACING.xs },
    summaryBarBg: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, marginBottom: SPACING.xs, overflow: "hidden" },
    summaryBarFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
    summarySubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    metaStatsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    metaStatCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, alignItems: "center", gap: 4 },
    metaStatValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    metaStatLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    goalCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
    goalTop: { gap: SPACING.sm },
    goalHeaderRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    colorBar: { width: 4, height: 40, borderRadius: 2 },
    goalInfo: { flex: 1 },
    goalName: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
    goalAmount: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 1 },
    goalDeleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.error + "15", alignItems: "center", justifyContent: "center" },
    progressBarBg: { height: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: 4, overflow: "hidden" },
    progressBarFill: { height: "100%", borderRadius: 4 },
    goalFooter: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    goalPct: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    daysBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: COLORS.warning + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    daysText: { fontSize: FONT_SIZE.xs, color: COLORS.warning, fontWeight: "600" },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: "auto" },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.sm },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    fieldGroup: { marginBottom: SPACING.md },
    fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.xs },
    colorRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
    colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent" },
    colorCircleActive: { borderColor: COLORS.text, borderWidth: 3 },
    fundsInfoCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.lg },
    fundsColorBar: { width: 4, height: 44, borderRadius: 2 },
    fundsInfoText: { flex: 1 },
    fundsGoalName: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
    fundsProgress: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 1 },
    fundsRemaining: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    fundsDeadlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    fundsDeadlineText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});

export default SavingsGoalsScreen;
