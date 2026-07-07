import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const ESTADOS = ["activa", "inactiva", "bloqueada", "cerrada"];
const TIPOS = ["ahorro", "corriente"];

const AdminAccountsScreen = () => {
    const { accounts, accountsLoading, fetchAccounts, createAccount, updateAccount, deleteAccount, toggleAccountStatus } = useAdminStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nombre: "", tipoCuenta: "ahorro", saldo: "", usuarioId: "", numeroCuenta: "" });

    useFocusEffect(useCallback(() => { fetchAccounts({ limit: 100 }); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAccounts({ limit: 100 });
        setRefreshing(false);
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre: "", tipoCuenta: "ahorro", saldo: "", usuarioId: "", numeroCuenta: "" });
        setModalVisible(true);
    };

    const openEdit = (acc) => {
        setEditing(acc);
        setForm({ nombre: acc.nombre || "", tipoCuenta: acc.tipoCuenta || "ahorro", saldo: String(acc.saldo || ""), usuarioId: String(acc.usuarioId || ""), numeroCuenta: acc.numeroCuenta || "" });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.usuarioId.trim()) {
            Alert.alert("Error", "Nombre y usuario son requeridos");
            return;
        }
        const payload = { nombre: form.nombre.trim(), tipoCuenta: form.tipoCuenta, usuarioId: form.usuarioId.trim() };
        if (form.numeroCuenta) payload.numeroCuenta = form.numeroCuenta;
        if (form.saldo) payload.saldo = Number(form.saldo);
        try {
            if (editing) await updateAccount(editing._id || editing.id, payload);
            else await createAccount(payload);
            setModalVisible(false);
            Alert.alert("Éxito", editing ? "Cuenta actualizada" : "Cuenta creada");
        } catch { Alert.alert("Error", "No se pudo guardar"); }
    };

    const handleToggleStatus = (acc) => {
        const current = acc.estado || "activa";
        const next = current === "activa" ? "inactiva" : "activa";
        Alert.alert("Cambiar Estado", `¿${next === "activa" ? "Activar" : "Inactivar"} cuenta ${acc.numeroCuenta}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Confirmar", onPress: async () => { try { await toggleAccountStatus(acc._id || acc.id, next); Alert.alert("Estado actualizado"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const handleDelete = (acc) => {
        Alert.alert("Eliminar Cuenta", `¿Cerrar cuenta ${acc.numeroCuenta}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar", style: "destructive", onPress: async () => { try { await deleteAccount(acc._id || acc.id); Alert.alert("Cuenta cerrada"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <MaterialIcons name="account-balance" size={22} color={COLORS.secondary} />
                <Text style={styles.cardTitle}>{item.nombre || "Cuenta"}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (item.estado === "activa" ? COLORS.success : COLORS.error) + "20" }]}>
                    <Text style={[styles.statusText, { color: item.estado === "activa" ? COLORS.success : COLORS.error }]}>{item.estado || "activa"}</Text>
                </View>
            </View>
            <Text style={styles.cardSub}>No. {item.numeroCuenta}</Text>
            <Text style={styles.cardType}>{item.tipoCuenta}</Text>
            <Text style={styles.cardBalance}>Q {Number(item.saldo || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.cardUser}>Usuario ID: {item.usuarioId}</Text>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><MaterialIcons name="edit" size={18} color={COLORS.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item)}><MaterialIcons name={item.estado === "activa" ? "pause-circle" : "play-circle"} size={18} color={COLORS.warning} /></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error + "40" }]} onPress={() => handleDelete(item)}><MaterialIcons name="delete" size={18} color={COLORS.error} /></TouchableOpacity>
            </View>
        </View>
    );

    if (accountsLoading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(accounts) ? accounts : []}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Cuentas Bancarias</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><MaterialIcons name="add" size={22} color={COLORS.surface} /><Text style={styles.addBtnText}>Nueva</Text></TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={!accountsLoading ? <EmptyState message="No hay cuentas" /> : null}
            />
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Cuenta" : "Nueva Cuenta"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre de cuenta" placeholderTextColor={COLORS.textMuted} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
                        <TextInput style={styles.input} placeholder="ID del usuario" placeholderTextColor={COLORS.textMuted} value={form.usuarioId} onChangeText={(t) => setForm({ ...form, usuarioId: t })} />
                        <TextInput style={styles.input} placeholder="Número de cuenta" placeholderTextColor={COLORS.textMuted} value={form.numeroCuenta} onChangeText={(t) => setForm({ ...form, numeroCuenta: t })} />
                        <TextInput style={styles.input} placeholder="Saldo inicial" placeholderTextColor={COLORS.textMuted} value={form.saldo} onChangeText={(t) => setForm({ ...form, saldo: t })} keyboardType="numeric" />
                        <Text style={styles.label}>Tipo de Cuenta</Text>
                        <View style={styles.pickerRow}>
                            {TIPOS.map((t) => (
                                <TouchableOpacity key={t} style={[styles.pickerOption, form.tipoCuenta === t && styles.pickerActive]} onPress={() => setForm({ ...form, tipoCuenta: t })}>
                                    <Text style={[styles.pickerText, form.tipoCuenta === t && styles.pickerTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Button title={editing ? "Actualizar" : "Crear Cuenta"} onPress={handleSave} />
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
    statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 8 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 4 },
    cardType: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
    cardBalance: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.secondary, marginTop: 8 },
    cardUser: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 4 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    label: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.sm },
    input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.sm },
    pickerRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
    pickerOption: { flex: 1, paddingVertical: SPACING.sm, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.surfaceAlt },
    pickerActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "20" },
    pickerText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "600" },
    pickerTextActive: { color: COLORS.primary },
});

export default AdminAccountsScreen;
