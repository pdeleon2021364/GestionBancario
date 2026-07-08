import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const AdminExchangeRatesScreen = () => {
    const { exchangeRates, exchangeRatesLoading, fetchExchangeRates, createExchangeRate, updateExchangeRate, deleteExchangeRate } = useAdminStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nameDestiny: "", divisaBase: "", divisaDestino: "", tasa: "" });

    useFocusEffect(useCallback(() => { fetchExchangeRates(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchExchangeRates();
        setRefreshing(false);
    }, []);

    const openCreate = () => { setEditing(null); setForm({ nameDestiny: "", divisaBase: "", divisaDestino: "", tasa: "" }); setModalVisible(true); };
    const openEdit = (item) => {
        setEditing(item);
        setForm({
            nameDestiny: item.nameDestiny || "",
            divisaBase: item.divisaBase?.codigo || item.divisaBase || "",
            divisaDestino: item.divisaDestino?.codigo || item.divisaDestino || "",
            tasa: String(item.tasa || ""),
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nameDestiny.trim() || !form.tasa) { Alert.alert("Error", "Completa los campos"); return; }
        const payload = { nameDestiny: form.nameDestiny.trim(), tasa: Number(form.tasa) };
        if (form.divisaBase) payload.divisaBase = form.divisaBase;
        if (form.divisaDestino) payload.divisaDestino = form.divisaDestino;
        try {
            if (editing) await updateExchangeRate(editing._id || editing.id, payload);
            else await createExchangeRate(payload);
            setModalVisible(false);
            Alert.alert("Éxito", editing ? "Tasa actualizada" : "Tasa creada");
        } catch { Alert.alert("Error"); }
    };

    const handleDelete = (item) => {
        Alert.alert("Eliminar", `¿Eliminar tasa ${item.nameDestiny}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => { try { await deleteExchangeRate(item._id || item.id); Alert.alert("Eliminada"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const renderItem = ({ item }) => {
        const base = item.divisaBase?.codigo || item.divisaBase || "?";
        const dest = item.divisaDestino?.codigo || item.divisaDestino || "?";
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialIcons name="trending-up" size={22} color={COLORS.warning} />
                    <Text style={styles.cardTitle}>{item.nameDestiny || `${base} → ${dest}`}</Text>
                </View>
                <Text style={styles.cardRate}>{base} → {dest}</Text>
                <Text style={styles.cardTasa}>Tasa: {Number(item.tasa).toFixed(4)}</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><MaterialIcons name="edit" size={18} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error + "40" }]} onPress={() => handleDelete(item)}><MaterialIcons name="delete" size={18} color={COLORS.error} /></TouchableOpacity>
                </View>
            </View>
        );
    };

    if (exchangeRatesLoading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(exchangeRates) ? exchangeRates : []}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Tipos de Cambio</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><MaterialIcons name="add" size={22} color={COLORS.surface} /><Text style={styles.addBtnText}>Nueva</Text></TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={!exchangeRatesLoading ? <EmptyState message="No hay tasas" /> : null}
            />
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Tasa" : "Nueva Tasa"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre (ej. GTQ a USD)" placeholderTextColor={COLORS.textMuted} value={form.nameDestiny} onChangeText={(t) => setForm({ ...form, nameDestiny: t })} />
                        <TextInput style={styles.input} placeholder="Divisa base (ID o código)" placeholderTextColor={COLORS.textMuted} value={form.divisaBase} onChangeText={(t) => setForm({ ...form, divisaBase: t })} />
                        <TextInput style={styles.input} placeholder="Divisa destino (ID o código)" placeholderTextColor={COLORS.textMuted} value={form.divisaDestino} onChangeText={(t) => setForm({ ...form, divisaDestino: t })} />
                        <TextInput style={styles.input} placeholder="Tasa de cambio" placeholderTextColor={COLORS.textMuted} value={form.tasa} onChangeText={(t) => setForm({ ...form, tasa: t })} keyboardType="decimal-pad" />
                        <Button title={editing ? "Actualizar" : "Crear Tasa"} onPress={handleSave} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.md, paddingBottom: 100 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 12, gap: 4 },
    addBtnText: { color: COLORS.surface, fontWeight: "700", fontSize: FONT_SIZE.sm },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, padding: SPACING.md, ...SHADOWS.sm },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, flex: 1 },
    cardRate: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 4 },
    cardTasa: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.secondary, marginTop: 4 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: "75%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.sm },
});

export default AdminExchangeRatesScreen;
