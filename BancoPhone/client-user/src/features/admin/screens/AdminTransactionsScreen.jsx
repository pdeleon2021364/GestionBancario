import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAdminStore } from "../store/useAdminStore";
import { LoadingSpinner, EmptyState } from "../../../shared/components/Common";

const TRANSACTION_COLORS = {
    deposito: { color: COLORS.success, icon: "arrow-downward" },
    retiro: { color: COLORS.error, icon: "arrow-upward" },
    transferencia: { color: COLORS.primary, icon: "swap-horiz" },
};

const AdminTransactionsScreen = () => {
    const { transactions, transactionsLoading, fetchTransactions, cancelTransaction } = useAdminStore();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(useCallback(() => { fetchTransactions({ limit: 100 }); }, []));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTransactions({ limit: 100 });
        setRefreshing(false);
    }, []);

    const handleCancel = (item) => {
        Alert.alert("Cancelar Transacción", `¿Cancelar transacción de Q${Number(item.monto).toFixed(2)}?`, [
            { text: "No", style: "cancel" },
            { text: "Cancelar", style: "destructive", onPress: async () => { try { await cancelTransaction(item._id || item.id); Alert.alert("Transacción cancelada"); } catch { Alert.alert("Error"); } } },
        ]);
    };

    const renderItem = ({ item }) => {
        const tColor = TRANSACTION_COLORS[item.tipo] || { color: COLORS.textMuted, icon: "help" };
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={[styles.iconCircle, { backgroundColor: tColor.color + "20" }]}>
                        <MaterialIcons name={tColor.icon} size={22} color={tColor.color} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardType}>{item.tipo}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: (item.estado === "completado" ? COLORS.success : item.estado === "pendiente" ? COLORS.warning : COLORS.error) + "20" }]}>
                                <Text style={[styles.statusText, { color: item.estado === "completado" ? COLORS.success : item.estado === "pendiente" ? COLORS.warning : COLORS.error }]}>{item.estado}</Text>
                            </View>
                        </View>
                        <Text style={styles.cardAmount}>Q {Number(item.monto).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</Text>
                        {item.referencia ? <Text style={styles.cardRef}>Ref: {item.referencia}</Text> : null}
                        <Text style={styles.cardDate}>{item.createdAt ? new Date(item.createdAt).toLocaleString("es-GT") : ""}</Text>
                        {item.estado !== "cancelado" && item.estado !== "reversado" && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                                <MaterialIcons name="cancel" size={16} color={COLORS.error} />
                                <Text style={styles.cancelText}>Anular</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (transactionsLoading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <FlatList
                data={Array.isArray(transactions) ? transactions : []}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={<Text style={styles.title}>Todas las Transacciones</Text>}
                ListEmptyComponent={!transactionsLoading ? <EmptyState message="No hay transacciones" /> : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.md, paddingBottom: 100 },
    title: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, padding: SPACING.md, ...SHADOWS.sm },
    cardRow: { flexDirection: "row", gap: SPACING.md },
    iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardType: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.text, textTransform: "capitalize" },
    statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: 8 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    cardAmount: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text, marginTop: 4 },
    cardRef: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
    cardDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
    cancelBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.sm },
    cancelText: { color: COLORS.error, fontSize: FONT_SIZE.sm, fontWeight: "600" },
});

export default AdminTransactionsScreen;
