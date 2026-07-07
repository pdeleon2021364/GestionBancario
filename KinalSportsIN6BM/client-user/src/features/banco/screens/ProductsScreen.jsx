import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getFinancialProductsApi, requestProductApi, getMyProductsApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";

const TYPE_ICONS = {
    prestamo: "account-balance",
    tarjeta: "credit-card",
    seguro: "shield",
    inversion: "trending-up",
    credito: "credit-card",
    ahorro: "savings",
};

const TYPE_COLORS = {
    prestamo: "#f97316",
    tarjeta: "#0ea5e9",
    seguro: "#34d399",
    inversion: "#a78bfa",
    credito: "#0ea5e9",
    ahorro: "#fbbf24",
};

const ProductsScreen = () => {
    const [products, setProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState("catalog");

    const load = async () => {
        try {
            const [cat, mine] = await Promise.all([
                getFinancialProductsApi(),
                getMyProductsApi().catch(() => []),
            ]);
            setProducts(Array.isArray(cat) ? cat : []);
            setMyProducts(Array.isArray(mine) ? mine : []);
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

    const handleRequest = async (productId) => {
        try {
            await requestProductApi({ financialProductId: productId });
            Alert.alert("Solicitud enviada", "Tu solicitud está pendiente de aprobación");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al solicitar");
        }
    };

    const renderProduct = ({ item }) => {
        const type = (item.tipoProducto || "general").toLowerCase();
        const iconName = TYPE_ICONS[type] || "card-giftcard";
        const iconColor = TYPE_COLORS[type] || COLORS.primary;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: iconColor + "20" }]}>
                        <MaterialIcons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.productName}>{item.nombre}</Text>
                        <View style={styles.typeBadge}>
                            <Text style={[styles.typeText, { color: iconColor }]}>
                                {item.tipoProducto || "General"}
                            </Text>
                        </View>
                    </View>
                    {item.activo !== false && (
                        <TouchableOpacity style={[styles.requestBtn, { backgroundColor: iconColor }]} onPress={() => handleRequest(item._id || item.id)}>
                            <Text style={styles.requestBtnText}>Solicitar</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.description}>{item.descripcion}</Text>
                <View style={styles.badgeRow}>
                    {item.tasaInteres != null && (
                        <View style={styles.badge}>
                            <MaterialIcons name="percent" size={14} color={COLORS.warning} />
                            <Text style={styles.badgeText}>{item.tasaInteres}% interés</Text>
                        </View>
                    )}
                    {item.montoMinimo != null && (
                        <View style={styles.badge}>
                            <MaterialIcons name="attach-money" size={14} color={COLORS.primary} />
                            <Text style={[styles.badgeText, { color: COLORS.primary }]}>Q {item.montoMinimo}</Text>
                        </View>
                    )}
                    {item.plazoMeses && (
                        <View style={styles.badge}>
                            <MaterialIcons name="calendar-today" size={14} color={COLORS.secondary} />
                            <Text style={[styles.badgeText, { color: COLORS.secondary }]}>{item.plazoMeses} meses</Text>
                        </View>
                    )}
                    {item.requiereAprobacion && (
                        <View style={[styles.badge, { borderColor: COLORS.warning + "40" }]}>
                            <MaterialIcons name="gpp-maybe" size={14} color={COLORS.warning} />
                            <Text style={[styles.badgeText, { color: COLORS.warning }]}>Aprobación</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderMyProduct = ({ item }) => {
        const status = item.estado || "pendiente";
        const statusColor =
            status === "aprobada" || status === "approved"
                ? COLORS.success
                : status === "rechazada" || status === "rejected"
                    ? COLORS.error
                    : COLORS.warning;
        const statusIcon =
            status === "aprobada" || status === "approved"
                ? "check-circle"
                : status === "rechazada" || status === "rejected"
                    ? "cancel"
                    : "hourglass-empty";
        const productName = typeof item.financialProductId === "object"
            ? item.financialProductId?.nombre
            : item.productoNombre || "Producto";

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: statusColor + "20" }]}>
                        <MaterialIcons name="assignment" size={24} color={statusColor} />
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.productName}>{productName}</Text>
                        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                            <MaterialIcons name={statusIcon} size={12} color={statusColor} />
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
                        </View>
                    </View>
                </View>
                {item.motivoRechazo && (
                    <View style={styles.rejectRow}>
                        <MaterialIcons name="info-outline" size={14} color={COLORS.error} />
                        <Text style={styles.rejectReason}>{item.motivoRechazo}</Text>
                    </View>
                )}
                {item.fechaSolicitud && (
                    <View style={styles.dateRow}>
                        <MaterialIcons name="calendar-today" size={12} color={COLORS.textMuted} />
                        <Text style={styles.dateText}>
                            Solicitado: {new Date(item.fechaSolicitud).toLocaleDateString("es-GT")}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, tab === "catalog" && styles.tabActive]}
                    onPress={() => setTab("catalog")}
                >
                    <MaterialIcons name="store" size={16} color={tab === "catalog" ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.tabText, tab === "catalog" && styles.tabTextActive]}>
                        Catálogo
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === "mine" && styles.tabActive]}
                    onPress={() => setTab("mine")}
                >
                    <MaterialIcons name="assignment" size={16} color={tab === "mine" ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.tabText, tab === "mine" && styles.tabTextActive]}>
                        Mis Solicitudes ({myProducts.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {tab === "catalog" ? (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id || item.id?.toString()}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Productos Financieros</Text>
                                <Text style={styles.count}>{products.length} producto(s)</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.empty}>
                                <MaterialIcons name="card-giftcard" size={60} color={COLORS.textMuted} />
                                <Text style={styles.emptyText}>No hay productos disponibles</Text>
                                <Text style={styles.emptySubtext}>Pronto tendremos más opciones para ti</Text>
                            </View>
                        ) : null
                    }
                />
            ) : (
                <FlatList
                    data={myProducts}
                    keyExtractor={(item) => item._id || item.id?.toString()}
                    renderItem={renderMyProduct}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.empty}>
                                <MaterialIcons name="assignment" size={60} color={COLORS.textMuted} />
                                <Text style={styles.emptyText}>No has solicitado productos</Text>
                                <Text style={styles.emptySubtext}>Explora el catálogo y solicita tu primer producto</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    tabRow: { flexDirection: "row", marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: COLORS.border },
    tab: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: SPACING.sm, borderRadius: 12 },
    tabActive: { backgroundColor: COLORS.primary + "20" },
    tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: "600" },
    tabTextActive: { color: COLORS.primary },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs, ...SHADOWS.sm },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    cardHeaderText: { flex: 1 },
    productName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    typeBadge: { marginTop: 2 },
    typeText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    requestBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 10 },
    requestBtnText: { color: COLORS.surface, fontWeight: "700", fontSize: FONT_SIZE.xs },
    description: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, lineHeight: 20 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: SPACING.sm },
    badge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: FONT_SIZE.xs, color: COLORS.warning },
    statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
    statusBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: "600", textTransform: "capitalize" },
    rejectRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.sm },
    rejectReason: { fontSize: FONT_SIZE.sm, color: COLORS.error, flex: 1 },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.xs },
    dateText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: "center" },
});

export default ProductsScreen;
