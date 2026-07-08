import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { useUsersStore } from "../store/useUsersStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const ESTADOS = ["activa", "inactiva", "bloqueada", "cerrada"];
const TIPOS = ["ahorro", "corriente"];

const AdminAccountsScreen = () => {
    const { accounts, accountsLoading, fetchAccounts, createAccount, updateAccount, deleteAccount, toggleAccountStatus } = useAdminStore();
    const { users, fetchUsers } = useUsersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [userPickerVisible, setUserPickerVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nombre: "", tipoCuenta: "ahorro", saldo: "", usuarioId: "", numeroCuenta: "" });

    useFocusEffect(useCallback(() => { fetchAccounts({ limit: 100 }); fetchUsers(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAccounts({ limit: 100 });
        await fetchUsers();
        setRefreshing(false);
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre: "", tipoCuenta: "ahorro", saldo: "", usuarioId: "", numeroCuenta: "" });
        setModalVisible(true);
    };

    const openEdit = (acc) => {
        setEditing(acc);
        setForm({ nombre: acc.nombre || "", tipoCuenta: acc.tipoCuenta || "ahorro", saldo: "", usuarioId: String(acc.usuarioId || ""), numeroCuenta: acc.numeroCuenta || "" });
        setModalVisible(true);
    };

    const getUserName = (id) => {
        if (!id) return "Desconocido";
        const u = (Array.isArray(users) ? users : []).find((x) => String(x.id || x._id) === String(id));
        return u?.nombre || u?.email || String(id);
    };

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.usuarioId.trim()) {
            Alert.alert("Error", "Nombre y usuario son requeridos");
            return;
        }
        if (editing) {
            const payload = { nombre: form.nombre.trim(), tipoCuenta: form.tipoCuenta };
            try {
                await updateAccount(editing._id || editing.id, payload);
                setModalVisible(false);
                Alert.alert("Éxito", "Cuenta actualizada");
            } catch { Alert.alert("Error", "No se pudo actualizar"); }
        } else {
            const payload = { nombre: form.nombre.trim(), tipoCuenta: form.tipoCuenta, usuarioId: form.usuarioId.trim() };
            if (form.numeroCuenta) payload.numeroCuenta = form.numeroCuenta;
            if (form.saldo) payload.saldo = Number(form.saldo);
            try {
                await createAccount(payload);
                setModalVisible(false);
                Alert.alert("Éxito", "Cuenta creada y asignada al usuario");
            } catch { Alert.alert("Error", "No se pudo guardar"); }
        }
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
        Alert.alert("Cerrar Cuenta", `¿Cerrar cuenta ${acc.numeroCuenta}? Esta acción no se puede deshacer.`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar", style: "destructive", onPress: async () => { try { await deleteAccount(acc._id || acc.id); Alert.alert("Cuenta cerrada"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const selectUser = (user) => {
        setForm({ ...form, usuarioId: String(user.id || user._id) });
        setUserPickerVisible(false);
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
            <Text style={styles.cardUser}>Titular: {getUserName(item.usuarioId)}</Text>
            <Text style={styles.cardUser}>ID: {item.usuarioId}</Text>
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
                        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><MaterialIcons name="add" size={22} color={COLORS.surface} /><Text style={styles.addBtnText}>Asignar</Text></TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={!accountsLoading ? <EmptyState message="No hay cuentas" /> : null}
            />
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Cuenta" : "Asignar Nueva Cuenta"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre de la cuenta" placeholderTextColor={COLORS.textMuted} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
                        {editing ? (
                            <>
                                <Text style={styles.label}>Tipo de Cuenta</Text>
                                <View style={styles.pickerRow}>
                                    {TIPOS.map((t) => (
                                        <TouchableOpacity key={t} style={[styles.pickerOption, form.tipoCuenta === t && styles.pickerActive]} onPress={() => setForm({ ...form, tipoCuenta: t })}>
                                            <Text style={[styles.pickerText, form.tipoCuenta === t && styles.pickerTextActive]}>{t}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.editNote}>
                                    <MaterialIcons name="info" size={16} color={COLORS.warning} />
                                    <Text style={styles.editNoteText}>El saldo no se puede modificar</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.userSelector} onPress={() => { fetchUsers(); setUserPickerVisible(true); }}>
                                    <MaterialIcons name="person" size={20} color={form.usuarioId ? COLORS.primary : COLORS.textMuted} />
                                    <Text style={[styles.userSelectorText, !form.usuarioId && { color: COLORS.textMuted }]}>
                                        {form.usuarioId ? getUserName(form.usuarioId) : "Seleccionar usuario"}
                                    </Text>
                                    <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                                </TouchableOpacity>
                                <TextInput style={styles.input} placeholder="Número de cuenta (opcional)" placeholderTextColor={COLORS.textMuted} value={form.numeroCuenta} onChangeText={(t) => setForm({ ...form, numeroCuenta: t })} />
                                <TextInput style={styles.input} placeholder="Saldo inicial (Q100 - Q2000)" placeholderTextColor={COLORS.textMuted} value={form.saldo} onChangeText={(t) => setForm({ ...form, saldo: t })} keyboardType="numeric" />
                                <Text style={styles.label}>Tipo de Cuenta</Text>
                                <View style={styles.pickerRow}>
                                    {TIPOS.map((t) => (
                                        <TouchableOpacity key={t} style={[styles.pickerOption, form.tipoCuenta === t && styles.pickerActive]} onPress={() => setForm({ ...form, tipoCuenta: t })}>
                                            <Text style={[styles.pickerText, form.tipoCuenta === t && styles.pickerTextActive]}>{t}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                        <Button title={editing ? "Actualizar Cuenta" : "Asignar Cuenta"} onPress={handleSave} />
                    </View>
                </View>
            </Modal>
            <Modal visible={userPickerVisible} transparent animationType="slide" onRequestClose={() => setUserPickerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: "70%" }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Usuario</Text>
                            <TouchableOpacity onPress={() => setUserPickerVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        {Array.isArray(users) && users.length > 0 ? (
                            <FlatList
                                data={users}
                                keyExtractor={(item) => String(item.id || item._id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.userItem} onPress={() => selectUser(item)}>
                                        <View style={styles.userItemAvatar}>
                                            <MaterialIcons name="person" size={20} color={COLORS.primary} />
                                        </View>
                                        <View style={styles.userItemBody}>
                                            <Text style={styles.userItemName}>{item.nombre || "Sin nombre"}</Text>
                                            <Text style={styles.userItemEmail}>{item.email}</Text>
                                        </View>
                                        <MaterialIcons name="radio-button-unchecked" size={20} color={form.usuarioId === String(item.id || item._id) ? COLORS.primary : COLORS.textMuted} />
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <EmptyState message="No hay usuarios disponibles" />
                        )}
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
    cardUser: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
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
    editNote: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.warning + "15", borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.md },
    editNoteText: { fontSize: FONT_SIZE.xs, color: COLORS.warning, fontWeight: "500", flex: 1 },
    userSelector: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.sm },
    userSelectorText: { fontSize: FONT_SIZE.md, color: COLORS.text, flex: 1 },
    userItem: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    userItemAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    userItemBody: { flex: 1 },
    userItemName: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
    userItemEmail: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
});

export default AdminAccountsScreen;
