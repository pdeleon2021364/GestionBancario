import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useUsersStore } from "../store/useUsersStore";
import { getAllAccountsApi } from "../../../shared/api/adminApi";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const ROLES = ["USER_ROLE", "ADMIN_ROLE", "CAJERO_ROLE", "AUDITOR_ROLE"];

const AdminUsersScreen = () => {
    const { users, usersLoading, fetchUsers, createUser, updateUser, deleteUser } = useUsersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "USER_ROLE" });

    useFocusEffect(useCallback(() => { fetchUsers(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre: "", email: "", password: "", rol: "USER_ROLE" });
        setModalVisible(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({ nombre: user.nombre || "", email: user.email || "", password: "", rol: "" });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.email.trim()) {
            Alert.alert("Error", "Nombre y email son requeridos");
            return;
        }
        try {
            if (editing) {
                await updateUser(editing.id || editing._id, { nombre: form.nombre.trim(), email: form.email.trim() });
                setModalVisible(false);
                Alert.alert("Éxito", "Usuario actualizado");
            } else {
                const payload = { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, rol: form.rol };
                await createUser(payload);
                setModalVisible(false);
                Alert.alert("Éxito", "Usuario creado");
            }
        } catch { Alert.alert("Error", "No se pudo guardar"); }
    };

    const handleDelete = (user) => {
        Alert.alert(
            "Eliminar Usuario",
            "Se verificará que el usuario no tenga saldos pendientes",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Verificar y Eliminar", style: "destructive", onPress: async () => {
                    try {
                        const accounts = await getAllAccountsApi({ limit: 1000 });
                        const userAccounts = Array.isArray(accounts)
                            ? accounts.filter((a) => String(a.usuarioId) === String(user.id || user._id))
                            : [];
                        const hasBalance = userAccounts.some((a) => Number(a.saldo || 0) > 0);
                        if (hasBalance) {
                            return Alert.alert(
                                "No se puede eliminar",
                                `El usuario tiene ${userAccounts.filter((a) => Number(a.saldo || 0) > 0).length} cuenta(s) con saldo mayor a Q0.00. Saldo total: Q ${userAccounts.reduce((s, a) => s + Number(a.saldo || 0), 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
                            );
                        }
                        Alert.alert(
                            "Confirmar eliminación",
                            `¿Eliminar a ${user.nombre || user.email}? Todas sus cuentas tienen saldo Q0.00.`,
                            [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Eliminar", style: "destructive", onPress: async () => {
                                    try {
                                        await deleteUser(user.id || user._id);
                                        Alert.alert("Eliminado", "Usuario eliminado correctamente");
                                    } catch { Alert.alert("Error", "No se pudo eliminar"); }
                                }},
                            ]
                        );
                    } catch {
                        Alert.alert("Error", "No se pudo verificar el saldo del usuario");
                    }
                }},
            ]
        );
    };

    const openProfile = (user) => {
        setSelectedUser(user);
        setProfileModalVisible(true);
    };

    const userFields = [
        { key: "ID", value: selectedUser?.id || selectedUser?._id, icon: "fingerprint" },
        { key: "Nombre", value: selectedUser?.nombre, icon: "person" },
        { key: "Email", value: selectedUser?.email, icon: "email" },
        { key: "Rol", value: (selectedUser?.rol || selectedUser?.role || "USER_ROLE").replace("_ROLE", ""), icon: "badge" },
        { key: "Email verificado", value: selectedUser?.emailVerified ? "Sí" : "No", icon: selectedUser?.emailVerified ? "verified" : "cancel" },
        { key: "Foto de perfil", value: selectedUser?.profilePicture ? "Disponible" : "Sin foto", icon: "photo-camera" },
        { key: "Creado", value: selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleString("es-GT") : "-", icon: "calendar-today" },
        { key: "Actualizado", value: selectedUser?.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString("es-GT") : "-", icon: "update" },
    ];

    const renderItem = ({ item }) => {
        const role = item.rol || item.role || "USER_ROLE";
        return (
            <TouchableOpacity style={styles.card} onPress={() => openProfile(item)} activeOpacity={0.7}>
                <View style={styles.cardRow}>
                    {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialIcons name="person" size={28} color={COLORS.textMuted} />
                        </View>
                    )}
                    <View style={styles.cardBody}>
                        <Text style={styles.cardName}>{item.nombre || "Sin nombre"}</Text>
                        <Text style={styles.cardEmail}>{item.email}</Text>
                        <View style={styles.badgesRow}>
                            <View style={styles.roleBadge}>
                                <MaterialIcons name="badge" size={14} color={role === "ADMIN_ROLE" ? COLORS.warning : COLORS.primary} />
                                <Text style={[styles.roleText, { color: role === "ADMIN_ROLE" ? COLORS.warning : COLORS.primary }]}>
                                    {role.replace("_ROLE", "")}
                                </Text>
                            </View>
                            {item.emailVerified && (
                                <View style={styles.verifiedBadge}>
                                    <MaterialIcons name="verified" size={12} color={COLORS.success} />
                                    <Text style={[styles.roleText, { color: COLORS.success }]}>Verificado</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                                <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error + "40" }]} onPress={() => handleDelete(item)}>
                                <MaterialIcons name="delete" size={18} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.profileHint}>
                    <MaterialIcons name="touch-app" size={14} color={COLORS.textMuted} />
                    <Text style={styles.profileHintText}>Toca para ver perfil completo</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (usersLoading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(users) ? users : []}
                keyExtractor={(item) => String(item._id || item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Usuarios</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                            <MaterialIcons name="add" size={22} color={COLORS.surface} />
                            <Text style={styles.addBtnText}>Nuevo</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={!usersLoading ? <EmptyState message="No hay usuarios" /> : null}
            />

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Usuario" : "Nuevo Usuario"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={COLORS.textMuted} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
                        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textMuted} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
                        {editing ? (
                            <View style={styles.editNote}>
                                <MaterialIcons name="info" size={16} color={COLORS.warning} />
                                <Text style={styles.editNoteText}>Solo se puede editar nombre y correo</Text>
                            </View>
                        ) : (
                            <>
                                <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={COLORS.textMuted} value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} secureTextEntry />
                                <Text style={styles.label}>Rol</Text>
                                <View style={styles.pickerRow}>
                                    {ROLES.map((r) => (
                                        <TouchableOpacity key={r} style={[styles.pickerOption, form.rol === r && styles.pickerActive]} onPress={() => setForm({ ...form, rol: r })}>
                                            <Text style={[styles.pickerText, form.rol === r && styles.pickerTextActive]}>{r.replace("_ROLE", "")}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                        <Button title={editing ? "Actualizar" : "Crear Usuario"} onPress={handleSave} />
                    </View>
                </View>
            </Modal>

            <Modal visible={profileModalVisible} transparent animationType="slide" onRequestClose={() => setProfileModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Perfil Completo</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        {selectedUser?.profilePicture ? (
                            <Image source={{ uri: selectedUser.profilePicture }} style={styles.profileAvatar} />
                        ) : (
                            <View style={styles.profileAvatarPlaceholder}>
                                <MaterialIcons name="person" size={48} color={COLORS.textMuted} />
                            </View>
                        )}
                        <View style={styles.fieldsList}>
                            {userFields.map((f) => (
                                <View key={f.key} style={styles.fieldRow}>
                                    <MaterialIcons name={f.icon} size={18} color={COLORS.primary} />
                                    <Text style={styles.fieldKey}>{f.key}</Text>
                                    <Text style={styles.fieldValue}>{f.value || "-"}</Text>
                                </View>
                            ))}
                        </View>
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
    cardRow: { flexDirection: "row", gap: SPACING.md },
    avatar: { width: 52, height: 52, borderRadius: 26, resizeMode: "cover" },
    avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    cardBody: { flex: 1 },
    cardName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    cardEmail: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
    badgesRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: 6 },
    roleBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    roleText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    profileHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
    profileHintText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    label: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.sm },
    input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.sm },
    pickerRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: "wrap" },
    pickerOption: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.surfaceAlt },
    pickerActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "20" },
    pickerText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: "600" },
    pickerTextActive: { color: COLORS.primary },
    editNote: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.warning + "15", borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.md },
    editNoteText: { fontSize: FONT_SIZE.xs, color: COLORS.warning, fontWeight: "500", flex: 1 },
    profileAvatar: { width: 80, height: 80, borderRadius: 40, resizeMode: "cover", alignSelf: "center", marginBottom: SPACING.md },
    profileAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, alignSelf: "center", marginBottom: SPACING.md },
    fieldsList: { gap: SPACING.sm },
    fieldRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    fieldKey: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, width: 120 },
    fieldValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, flex: 1, textAlign: "right" },
});

export default AdminUsersScreen;
