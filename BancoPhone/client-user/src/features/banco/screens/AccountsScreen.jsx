import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getAccountsApi, createAccountApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const STATUS_COLORS = {
    activa: "#34d399",
    inactiva: "#fb7185",
    cerrada: "#94a3b8",
};

const TYPE_ICONS = {
    ahorro: "savings",
    corriente: "account-balance",
    monetaria: "account-balance-wallet",
};

const AccountsScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    const load = async () => {
        try {
            const data = await getAccountsApi();
            setAccounts(Array.isArray(data) ? data : []);
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

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const activeAccounts = accounts.filter((a) => a.estado === "activa");
    const totalBalance = activeAccounts.reduce((sum, a) => sum + Number(a.saldo || 0), 0);
    const closedAccounts = accounts.filter((a) => a.estado === "cerrada").length;

    const handleCreate = async () => {
        if (!newName.trim()) return Alert.alert("Error", "Ingresa un nombre para la cuenta");
        try {
            setCreating(true);
            await createAccountApi({ nombre: newName.trim() });
            setShowCreate(false);
            setNewName("");
            Alert.alert("Éxito", "Cuenta creada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear cuenta");
        } finally {
            setCreating(false);
        }
    };

    const renderAccount = ({ item }) => {
        const tipo = (item.tipoCuenta || "ahorro").toLowerCase();
        const iconName = TYPE_ICONS[tipo] || "account-balance";
        const statusColor = STATUS_COLORS[item.estado] || COLORS.textMuted;

        return (
            <TouchableOpacity
                style={[styles.card, item.estado === "cerrada" && styles.cardClosed]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("AccountDetail", { account: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.avatar, { backgroundColor: item.estado === "activa" ? COLORS.primary + "20" : COLORS.textMuted + "15" }]}>
                            <MaterialIcons name={iconName} size={22} color={item.estado === "activa" ? COLORS.primary : COLORS.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.accountName}>{item.nombre}</Text>
                            <Text style={styles.accountNumber}>{item.numeroCuenta}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { borderColor: statusColor + "40" }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.estado}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.balanceLabel}>Saldo disponible</Text>
                    <Text style={[styles.balanceValue, item.estado === "cerrada" && { color: COLORS.textMuted }]}>
                        {money(item.saldo)}
                    </Text>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.typeBadge}>
                        <MaterialIcons name={iconName} size={12} color={COLORS.textLight} />
                        <Text style={styles.footerText}>{item.tipoCuenta || "Ahorro"}</Text>
                    </View>
                    {item.createdAt && (
                        <Text style={styles.createdText}>{new Date(item.createdAt).toLocaleDateString("es-GT")}</Text>
                    )}
                    <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando cuentas...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={accounts}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderAccount}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Mis Cuentas</Text>
                                <Text style={styles.count}>{accounts.length} cuenta(s)</Text>
                            </View>
                            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
                                <MaterialIcons name="add" size={24} color={COLORS.surface} />
                            </TouchableOpacity>
                        </View>
                        {activeAccounts.length > 0 && (
                            <View style={styles.statsRow}>
                                <View style={styles.totalCard}>
                                    <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
                                    <Text style={styles.totalLabel}>Saldo disponible</Text>
                                    <Text style={styles.totalValue}>{money(totalBalance)}</Text>
                                </View>
                                <View style={styles.miniStatCard}>
                                    <MaterialIcons name="check-circle" size={16} color={COLORS.success} />
                                    <Text style={styles.miniStatValue}>{activeAccounts.length}</Text>
                                    <Text style={styles.miniStatLabel}>Activas</Text>
                                </View>
                                {closedAccounts > 0 && (
                                    <View style={styles.miniStatCard}>
                                        <MaterialIcons name="cancel" size={16} color={COLORS.textMuted} />
                                        <Text style={[styles.miniStatValue, { color: COLORS.textMuted }]}>{closedAccounts}</Text>
                                        <Text style={styles.miniStatLabel}>Cerradas</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="account-balance" size={60} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>No tienes cuentas bancarias</Text>
                        <Text style={styles.emptySubtext}>Crea tu primera cuenta para empezar</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
                            <MaterialIcons name="add" size={20} color={COLORS.surface} />
                            <Text style={styles.emptyBtnText}>Crear cuenta</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Modal visible={showCreate} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <MaterialIcons name="account-balance" size={24} color={COLORS.primary} />
                            <Text style={styles.modalTitle}>Nueva Cuenta</Text>
                            <TouchableOpacity onPress={() => setShowCreate(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Input
                            label="Nombre de la cuenta"
                            placeholder="Ej: Ahorros principal"
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <View style={styles.modalInfoBox}>
                            <MaterialIcons name="info-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.modalInfo}>
                                Se creará una cuenta de ahorro con un saldo inicial de Q 100.00
                            </Text>
                        </View>
                        <Button title="Crear cuenta" onPress={handleCreate} loading={creating} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.lg, paddingBottom: 100 },
    loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: SPACING.md },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    addBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.md },
    statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    totalCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, ...SHADOWS.sm, gap: 4 },
    totalLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    totalValue: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.primary },
    miniStatCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", justifyContent: "center", gap: 2, minWidth: 60 },
    miniStatValue: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
    miniStatLabel: { fontSize: 9, color: COLORS.textMuted },
    card: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
    cardClosed: { opacity: 0.6 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    accountName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    accountNumber: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    cardBody: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
    balanceLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    balanceValue: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text, marginTop: 2 },
    cardFooter: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
    typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, },
    footerText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, fontWeight: "600", textTransform: "capitalize" },
    createdText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginLeft: "auto" },
    empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: "center" },
    emptyBtn: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 14, ...SHADOWS.sm },
    emptyBtnText: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.surface },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text, flex: 1 },
    modalInfoBox: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
    modalInfo: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, flex: 1 },
});

export default AccountsScreen;
