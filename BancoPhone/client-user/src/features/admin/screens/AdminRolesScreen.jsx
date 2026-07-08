import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const AdminRolesScreen = () => {
    const { roles, rolesLoading, createRole, updateRole, deleteRole, fetchRoles } = useAdminStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nombre: "", permisos: "" });

    useFocusEffect(useCallback(() => { fetchRoles(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRoles();
        setRefreshing(false);
    }, []);

    const openCreate = () => { setEditing(null); setForm({ nombre: "", permisos: "" }); setModalVisible(true); };
    const openEdit = (item) => { setEditing(item); setForm({ nombre: item.nombre || item.name || "", permisos: item.permisos || "" }); setModalVisible(true); };

    const handleSave = async () => {
        if (!form.nombre.trim()) { Alert.alert("Error", "Nombre requerido"); return; }
        try {
            if (editing) await updateRole(editing._id || editing.id, form);
            else await createRole(form);
            setModalVisible(false);
            Alert.alert("Éxito", editing ? "Rol actualizado" : "Rol creado");
        } catch { Alert.alert("Error"); }
    };

    const handleDelete = (item) => {
        Alert.alert("Eliminar", `¿Eliminar rol ${item.nombre || item.name}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => { try { await deleteRole(item._id || item.id); Alert.alert("Eliminado"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(roles) ? roles : []}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialIcons name="admin-panel-settings" size={24} color={COLORS.secondary} />
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.nombre || item.name}</Text>
                                {item.permisos ? <Text style={styles.cardPerm}>{item.permisos}</Text> : null}
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><MaterialIcons name="edit" size={18} color={COLORS.primary} /></TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error + "40" }]} onPress={() => handleDelete(item)}><MaterialIcons name="delete" size={18} color={COLORS.error} /></TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Roles</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><MaterialIcons name="add" size={22} color={COLORS.surface} /><Text style={styles.addBtnText}>Nuevo</Text></TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={!rolesLoading ? <EmptyState message="No hay roles" /> : null}
            />
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Rol" : "Nuevo Rol"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre del rol" placeholderTextColor={COLORS.textMuted} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Permisos" placeholderTextColor={COLORS.textMuted} value={form.permisos} onChangeText={(t) => setForm({ ...form, permisos: t })} multiline />
                        <Button title={editing ? "Actualizar" : "Crear Rol"} onPress={handleSave} />
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
    cardRow: { flexDirection: "row", gap: SPACING.md, alignItems: "center" },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    cardPerm: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: "70%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.sm },
    textArea: { minHeight: 80, textAlignVertical: "top" },
});

export default AdminRolesScreen;
