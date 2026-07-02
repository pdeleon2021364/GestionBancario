import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAuthStore } from "../../../shared/store/authStore";
import { getAccountsApi, getMyTransactionsApi } from "../../../shared/api/banco";

const MODULES = [
    { key: "Accounts", icon: "account-balance", label: "Mis Cuentas", color: "#0ea5e9", desc: "Gestiona tus cuentas" },
    { key: "Transactions", icon: "swap-horiz", label: "Transferencias", color: "#22d3ee", desc: "Envía y recibe dinero" },
    { key: "Currencies", icon: "currency-exchange", label: "Divisas", color: "#34d399", desc: "Catálogo de monedas" },
    { key: "ExchangeRates", icon: "trending-up", label: "Tipos de Cambio", color: "#fbbf24", desc: "Tasas actualizadas" },
    { key: "Products", icon: "card-giftcard", label: "Productos", color: "#a78bfa", desc: "Productos financieros" },
    { key: "Profile", icon: "person", label: "Mi Perfil", color: "#fb7185", desc: "Tu información personal" },
];

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState({ accounts: 0, transactions: 0 });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const [accs] = await Promise.all([
                getAccountsApi(),
                getMyTransactionsApi(),
            ]);
            setMetrics({
                accounts: Array.isArray(accs) ? accs.length : 0,
                transactions: 0,
            });
        } catch {}
        setRefreshing(false);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                    />
                }
            >
                <View style={styles.orbOne} />
                <View style={styles.orbTwo} />

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hola, {user?.nombre || "Usuario"}
                        </Text>
                        <Text style={styles.subtitle}>Portal Bancario</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={() => useAuthStore.getState().logout()}
                    >
                        <MaterialIcons name="logout" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Bienvenido a</Text>
                    <Text style={styles.balanceTitle}>OVA Bank</Text>
                    <Text style={styles.balanceDesc}>
                        Gestiona tus finanzas de forma segura
                    </Text>
                    <View style={styles.balanceBadge}>
                        <MaterialIcons name="verified" size={16} color={COLORS.success} />
                        <Text style={styles.badgeText}>Sistema Seguro</Text>
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricValue}>{metrics.accounts}</Text>
                        <Text style={styles.metricLabel}>Cuentas</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialIcons name="shield" size={24} color={COLORS.secondary} />
                        <Text style={styles.metricLabel}>Protegido</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialIcons name="online-prediction" size={24} color={COLORS.success} />
                        <Text style={styles.metricLabel}>24/7</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Módulos</Text>

                <View style={styles.modulesGrid}>
                    {MODULES.map((mod) => (
                        <TouchableOpacity
                            key={mod.key}
                            style={styles.moduleCard}
                            activeOpacity={0.7}
                    onPress={() => {
                        const navMap = {
                            Profile: () => navigation.navigate("More", { screen: "Profile" }),
                            Products: () => navigation.navigate("More", { screen: "ProductsMain" }),
                            ExchangeRates: () => navigation.navigate("Currencies", { screen: "ExchangeRates" }),
                        };
                        if (navMap[mod.key]) navMap[mod.key]();
                        else navigation.navigate(mod.key);
                    }}
                        >
                            <View style={[styles.moduleIcon, { backgroundColor: mod.color + "20" }]}>
                                <MaterialIcons name={mod.icon} size={28} color={mod.color} />
                            </View>
                            <Text style={styles.moduleLabel}>{mod.label}</Text>
                            <Text style={styles.moduleDesc}>{mod.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    orbOne: {
        position: "absolute",
        top: -80,
        left: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(14,165,233,0.10)",
    },
    orbTwo: {
        position: "absolute",
        bottom: -60,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(34,211,238,0.08)",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.lg,
    },
    greeting: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: "700",
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        marginTop: 2,
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    balanceCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    balanceLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    balanceTitle: {
        fontSize: FONT_SIZE.huge,
        fontWeight: "700",
        color: COLORS.text,
        marginVertical: SPACING.xs,
    },
    balanceDesc: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    balanceBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: SPACING.md,
        gap: 6,
    },
    badgeText: {
        color: COLORS.success,
        fontSize: FONT_SIZE.xs,
        fontWeight: "600",
    },
    metricsRow: {
        flexDirection: "row",
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    metricCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        alignItems: "center",
        gap: 6,
    },
    metricValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.primary,
    },
    metricLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    modulesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACING.sm,
    },
    moduleCard: {
        width: "48%",
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    moduleIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: SPACING.sm,
    },
    moduleLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 2,
    },
    moduleDesc: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
});

export default HomeScreen;
