import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useUsersStore } from "../store/useUsersStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const ROLES = ["USER_ROLE", "ADMIN_ROLE", "CAJERO_ROLE", "AUDITOR_ROLE"];

const AdminUsersScreen = () => {
    const { users, usersLoading, fetchUsers, createUser, updateUser, deleteUser } = useUsersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
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
        setForm({ nombre: user.nombre || "", email: user.email || "", password: "", rol: user.rol || user.role || "USER_ROLE" });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.email.trim()) {
            Alert.alert("Error", "Nombre y email son requeridos");
            return;
        }
        const payload = { nombre: form.nombre.trim(), email: form.email.trim(), rol: form.rol };
        if (form.password) payload.password = form.password;
        try {
            if (editing) await updateUser(editing.id || editing._id, payload);
            else await createUser(payload);
            setModalVisible(false);
            Alert.alert("Éxito", editing ? "Usuario actualizado" : "Usuario creado");
        } catch { Alert.alert("Error", "No se pudo guardar"); }
    };

    const handleDelete = (user) => {
        Alert.alert("Eliminar Usuario", `¿Eliminar a ${user.nombre || user.email}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => {
                try { await deleteUser(user.id || user._id); Alert.alert("Eliminado"); }
                catch { Alert.alert("Error", "No se pudo eliminar"); }
            }},
        ]);
    };

    const renderItem = ({ item }) => {
        const role = item.rol || item.role || "USER_ROLE";
        return (
            <View style={styles.card}>
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
            </View>
        );
    };

    if (usersLoading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(users) ? users : []}
                keyExtractor={(item) => item._id || item.id?.toString()}
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
                        <TextInput style={styles.input} placeholder={editing ? "Nueva contraseña (dejar vacío)" : "Contraseña"} placeholderTextColor={COLORS.textMuted} value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} secureTextEntry />
                        <Text style={styles.label}>Rol</Text>
                        <View style={styles.pickerRow}>
                            {ROLES.map((r) => (
                                <TouchableOpacity key={r} style={[styles.pickerOption, form.rol === r && styles.pickerActive]} onPress={() => setForm({ ...form, rol: r })}>
                                    <Text style={[styles.pickerText, form.rol === r && styles.pickerTextActive]}>{r.replace("_ROLE", "")}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Button title={editing ? "Actualizar" : "Crear Usuario"} onPress={handleSave} />
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
    roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    roleText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
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
});

export default AdminUsersScreen;
