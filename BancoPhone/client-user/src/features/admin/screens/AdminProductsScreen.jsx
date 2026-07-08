import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, SectionList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";
import Button from "../../../shared/components/Button";

const AdminProductsScreen = () => {
    const { products, productsLoading, fetchProducts, createProduct, updateProduct, deleteProduct, userProducts, userProductsLoading, fetchUserProducts, approveUserProduct, rejectUserProduct } = useAdminStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nombre: "", descripcion: "", tasaInteres: "", tipoProducto: "", activo: true, requiereAprobacion: false });
    const [tab, setTab] = useState("products");

    useFocusEffect(useCallback(() => { fetchProducts(); fetchUserProducts(); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchProducts(), fetchUserProducts()]);
        setRefreshing(false);
    }, []);

    const openCreate = () => { setEditing(null); setForm({ nombre: "", descripcion: "", tasaInteres: "", tipoProducto: "", activo: true, requiereAprobacion: false }); setModalVisible(true); };
    const openEdit = (item) => { setEditing(item); setForm({ nombre: item.nombre || "", descripcion: item.descripcion || "", tasaInteres: String(item.tasaInteres || ""), tipoProducto: item.tipoProducto || "", activo: item.activo !== false, requiereAprobacion: !!item.requiereAprobacion }); setModalVisible(true); };

    const handleSave = async () => {
        if (!form.nombre.trim()) { Alert.alert("Error", "Nombre requerido"); return; }
        try {
            if (editing) await updateProduct(editing._id || editing.id, form);
            else await createProduct(form);
            setModalVisible(false);
            Alert.alert("Éxito", editing ? "Producto actualizado" : "Producto creado");
        } catch { Alert.alert("Error"); }
    };

    const handleDelete = (item) => {
        Alert.alert("Eliminar", `¿Eliminar ${item.nombre}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => { try { await deleteProduct(item._id || item.id); Alert.alert("Eliminado"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const handleApprove = (item) => {
        Alert.alert("Aprobar", "¿Aprobar esta solicitud?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Aprobar", onPress: async () => { try { await approveUserProduct(item._id || item.id); Alert.alert("Aprobada"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const handleReject = (item) => {
        Alert.prompt("Rechazar", "Motivo del rechazo:", async (motivo) => {
            if (!motivo) return Alert.alert("Error", "Debes ingresar un motivo");
            try { await rejectUserProduct(item._id || item.id, motivo); Alert.alert("Rechazada"); } catch { Alert.alert("Error"); }
        });
    };

    const renderProduct = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <View style={[styles.badge, { backgroundColor: item.activo ? COLORS.success + "20" : COLORS.error + "20" }]}>
                        <Text style={[styles.badgeText, { color: item.activo ? COLORS.success : COLORS.error }]}>{item.activo ? "Activo" : "Inactivo"}</Text>
                    </View>
                </View>
                {item.tipoProducto ? <Text style={styles.cardSub}>{item.tipoProducto}</Text> : null}
                {item.tasaInteres ? <Text style={styles.cardRate}>Interés: {item.tasaInteres}%</Text> : null}
                {item.descripcion ? <Text style={styles.cardDesc}>{item.descripcion}</Text> : null}
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><MaterialIcons name="edit" size={18} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error + "40" }]} onPress={() => handleDelete(item)}><MaterialIcons name="delete" size={18} color={COLORS.error} /></TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderRequest = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Solicitud de {item.productoId?.nombre || "Producto"}</Text>
                <Text style={styles.cardSub}>Usuario ID: {item.usuarioId}</Text>
                <View style={[styles.badge, { backgroundColor: (item.estado === "pendiente" ? COLORS.warning : item.estado === "activo" ? COLORS.success : COLORS.error) + "20", alignSelf: "flex-start", marginTop: 4 }]}>
                    <Text style={[styles.badgeText, { color: item.estado === "pendiente" ? COLORS.warning : item.estado === "activo" ? COLORS.success : COLORS.error }]}>{item.estado}</Text>
                </View>
                {item.estado === "pendiente" && (
                    <View style={styles.requestActions}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                            <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
                            <Text style={{ color: COLORS.success, fontWeight: "600", fontSize: FONT_SIZE.sm }}>Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                            <MaterialIcons name="cancel" size={18} color={COLORS.error} />
                            <Text style={{ color: COLORS.error, fontWeight: "600", fontSize: FONT_SIZE.sm }}>Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    if (productsLoading && !refreshing) return <LoadingSpinner />;

    const data = tab === "products" ? (Array.isArray(products) ? products : []) : (Array.isArray(userProducts) ? userProducts : []);

    return (
        <View style={styles.container}>
            <View style={styles.tabRow}>
                <TouchableOpacity style={[styles.tab, tab === "products" && styles.tabActive]} onPress={() => setTab("products")}>
                    <Text style={[styles.tabText, tab === "products" && styles.tabTextActive]}>Productos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === "requests" && styles.tabActive]} onPress={() => setTab("requests")}>
                    <Text style={[styles.tabText, tab === "requests" && styles.tabTextActive]}>Solicitudes</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={data}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={tab === "products" ? renderProduct : renderRequest}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={
                    tab === "products" ? (
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>Productos Financieros</Text>
                            <TouchableOpacity style={styles.addBtn} onPress={openCreate}><MaterialIcons name="add" size={22} color={COLORS.surface} /><Text style={styles.addBtnText}>Nuevo</Text></TouchableOpacity>
                        </View>
                    ) : <Text style={styles.title}>Solicitudes de Productos</Text>
                }
                ListEmptyComponent={!productsLoading ? <EmptyState message={tab === "products" ? "No hay productos" : "No hay solicitudes"} /> : null}
            />
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? "Editar Producto" : "Nuevo Producto"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={COLORS.textMuted} value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
                        <TextInput style={styles.input} placeholder="Tipo (ej. Prestamo, Tarjeta)" placeholderTextColor={COLORS.textMuted} value={form.tipoProducto} onChangeText={(t) => setForm({ ...form, tipoProducto: t })} />
                        <TextInput style={styles.input} placeholder="Tasa de interés %" placeholderTextColor={COLORS.textMuted} value={form.tasaInteres} onChangeText={(t) => setForm({ ...form, tasaInteres: t })} keyboardType="decimal-pad" />
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Descripción" placeholderTextColor={COLORS.textMuted} value={form.descripcion} onChangeText={(t) => setForm({ ...form, descripcion: t })} multiline />
                        <Button title={editing ? "Actualizar" : "Crear Producto"} onPress={handleSave} />
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
    tabRow: { flexDirection: "row", backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, paddingVertical: SPACING.md, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: "600" },
    tabTextActive: { color: COLORS.primary },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, padding: SPACING.md, ...SHADOWS.sm },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, flex: 1 },
    badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 4 },
    cardRate: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.secondary, marginTop: 4 },
    cardDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 4 },
    cardActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
    actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    requestActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
    approveBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 10, backgroundColor: COLORS.success + "15" },
    rejectBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 10, backgroundColor: COLORS.error + "15" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.sm },
    textArea: { minHeight: 80, textAlignVertical: "top" },
});

export default AdminProductsScreen;
