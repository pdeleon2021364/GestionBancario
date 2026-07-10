import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAuthStore } from "../../../shared/store/authStore";
import { getAccountsApi, getMyTransactionsApi } from "../../../shared/api/banco";

const MODULES = [
    { key: "Accounts", icon: "account-balance", label: "Mis Cuentas", color: "#0ea5e9", screen: "Accounts" },
    { key: "Transactions", icon: "swap-horiz", label: "Transferencias", color: "#22d3ee", screen: "Transactions" },
    { key: "Currencies", icon: "currency-exchange", label: "Divisas", color: "#34d399", screen: "Currencies" },
    { key: "ExchangeRates", icon: "trending-up", label: "Tipos de Cambio", color: "#fbbf24", screen: "Currencies", sub: "ExchangeRates" },
    { key: "Favorites", icon: "star", label: "Favoritos", color: "#f59e0b", screen: "More", sub: "Favorites" },
    { key: "SavingsGoals", icon: "track-changes", label: "Metas", color: "#34d399", screen: "More", sub: "SavingsGoals" },
    { key: "ScheduledTransfers", icon: "schedule", label: "Programadas", color: "#a78bfa", screen: "More", sub: "ScheduledTransfers" },
    { key: "Products", icon: "card-giftcard", label: "Productos", color: "#ec4899", screen: "More", sub: "ProductsMain" },
    { key: "Profile", icon: "person", label: "Mi Perfil", color: "#fb7185", screen: "More", sub: "Profile" },
];

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [recentTx, setRecentTx] = useState([]);
    const [metrics, setMetrics] = useState({ accounts: 0, transactions: 0, balance: 0, ingresos: 0, egresos: 0 });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const [accs, txs] = await Promise.all([getAccountsApi(), getMyTransactionsApi()]);
            const accountList = Array.isArray(accs) ? accs : [];
            const txList = Array.isArray(txs) ? txs : [];
            setAccounts(accountList.filter((a) => a.estado === "activa"));

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthTxs = txList.filter((tx) => new Date(tx.createdAt) >= monthStart);
            const ingresos = monthTxs.filter((tx) => tx.tipo === "deposito").reduce((s, tx) => s + Number(tx.monto || 0), 0);
            const egresos = monthTxs.filter((tx) => tx.tipo === "retiro" || tx.tipo === "transferencia").reduce((s, tx) => s + Number(tx.monto || 0), 0);

            setRecentTx(txList.slice(0, 3));
            setMetrics({
                accounts: accountList.length,
                transactions: txList.length,
                balance: accountList.filter((a) => a.estado === "activa").reduce((s, a) => s + Number(a.saldo || 0), 0),
                ingresos,
                egresos,
            });
        } catch {}
        setRefreshing(false);
    }, []);

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const dateText = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                <View style={styles.orbOne} />
                <View style={styles.orbTwo} />
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hola, {user?.nombre || user?.username}</Text>
                        <Text style={styles.subtitle}>Portal Bancario</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={() => useAuthStore.getState().logout()}>
                        <MaterialIcons name="logout" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Saldo total disponible</Text>
                    <Text style={styles.balanceValue}>{money(metrics.balance)}</Text>
                    <View style={styles.balanceBadge}>
                        <MaterialIcons name="verified" size={16} color={COLORS.success} />
                        <Text style={styles.badgeText}>{metrics.accounts} cuenta(s) activa(s)</Text>
                    </View>
                </View>

                <View style={styles.incomeExpenseRow}>
                    <View style={[styles.ieCard, { borderLeftColor: COLORS.success }]}>
                        <MaterialIcons name="arrow-downward" size={18} color={COLORS.success} />
                        <View style={styles.ieContent}>
                            <Text style={styles.ieLabel}>Ingresos del mes</Text>
                            <Text style={[styles.ieValue, { color: COLORS.success }]}>{money(metrics.ingresos)}</Text>
                        </View>
                    </View>
                    <View style={[styles.ieCard, { borderLeftColor: COLORS.error }]}>
                        <MaterialIcons name="arrow-upward" size={18} color={COLORS.error} />
                        <View style={styles.ieContent}>
                            <Text style={styles.ieLabel}>Egresos del mes</Text>
                            <Text style={[styles.ieValue, { color: COLORS.error }]}>{money(metrics.egresos)}</Text>
                        </View>
                    </View>
                </View>

                {accounts.length > 0 && (
                    <View style={styles.miniAccounts}>
                        <Text style={styles.sectionTitle}>Tus cuentas</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {accounts.map((a) => (
                                <TouchableOpacity
                                    key={a._id || a.id}
                                    style={styles.miniCard}
                                    onPress={() => navigation.navigate("Accounts", { screen: "AccountDetail", params: { account: a } })}
                                >
                                    <View style={styles.miniIconWrap}>
                                        <MaterialIcons name="account-balance" size={20} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.miniName} numberOfLines={1}>{a.nombre}</Text>
                                    <Text style={styles.miniBalLabel}>{a.tipoCuenta || "Ahorro"}</Text>
                                    <Text style={styles.miniBalance}>{money(a.saldo)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <MaterialIcons name="account-balance" size={22} color={COLORS.primary} />
                        <Text style={styles.metricValue}>{metrics.accounts}</Text>
                        <Text style={styles.metricLabel}>Cuentas</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialIcons name="receipt-long" size={22} color={COLORS.secondary} />
                        <Text style={styles.metricValue}>{metrics.transactions}</Text>
                        <Text style={styles.metricLabel}>Movimientos</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialIcons name="trending-up" size={22} color={metrics.ingresos > metrics.egresos ? COLORS.success : COLORS.warning} />
                        <Text style={[styles.metricValue, { color: metrics.ingresos > metrics.egresos ? COLORS.success : COLORS.warning }]}>
                            {money(Math.abs(metrics.ingresos - metrics.egresos))}
                        </Text>
                        <Text style={styles.metricLabel}>Balance del mes</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.modulesGrid}>
                    {MODULES.map((mod) => (
                        <TouchableOpacity
                            key={mod.key}
                            style={styles.moduleCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (mod.sub) navigation.navigate(mod.screen, { screen: mod.sub });
                                else navigation.navigate(mod.screen);
                            }}
                        >
                            <View style={[styles.moduleIcon, { backgroundColor: mod.color + "20" }]}>
                                <MaterialIcons name={mod.icon} size={24} color={mod.color} />
                            </View>
                            <Text style={styles.moduleLabel}>{mod.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {recentTx.length > 0 && (
                    <View style={styles.recentSection}>
                        <View style={styles.recentHeader}>
                            <Text style={styles.sectionTitle}>Últimos movimientos</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                                <Text style={styles.seeAllText}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        {recentTx.map((tx, idx) => (
                            <View key={tx._id || idx} style={styles.recentCard}>
                                <View style={[styles.recentIcon, { backgroundColor: (tx.tipo === "deposito" ? COLORS.success : COLORS.error) + "20" }]}>
                                    <MaterialIcons
                                        name={tx.tipo === "deposito" ? "arrow-downward" : tx.tipo === "retiro" ? "arrow-upward" : "swap-horiz"}
                                        size={18}
                                        color={tx.tipo === "deposito" ? COLORS.success : COLORS.error}
                                    />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentType}>{tx.tipo === "transferencia" ? "Transferencia" : tx.tipo === "deposito" ? "Depósito" : "Retiro"}</Text>
                                    <Text style={styles.recentDate}>{dateText(tx.createdAt)}</Text>
                                </View>
                                <Text style={[styles.recentAmount, { color: tx.tipo === "deposito" ? COLORS.success : COLORS.error }]}>
                                    {tx.tipo === "deposito" ? "+" : "-"}{money(tx.monto)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 100 },
    orbOne: { position: "absolute", top: -80, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(14,165,233,0.10)" },
    orbTwo: { position: "absolute", bottom: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(34,211,238,0.08)" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    greeting: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
    logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
    balanceCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, marginBottom: SPACING.md, ...SHADOWS.md },
    balanceLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1 },
    balanceValue: { fontSize: FONT_SIZE.huge, fontWeight: "700", color: COLORS.text, marginVertical: SPACING.xs },
    balanceBadge: { flexDirection: "row", alignItems: "center", marginTop: SPACING.sm, gap: 6 },
    badgeText: { color: COLORS.success, fontSize: FONT_SIZE.xs, fontWeight: "600" },
    incomeExpenseRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    ieCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4, padding: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    ieContent: { flex: 1 },
    ieLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    ieValue: { fontSize: FONT_SIZE.md, fontWeight: "700", marginTop: 1 },
    miniAccounts: { marginBottom: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
    miniCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginRight: SPACING.sm, minWidth: 150, gap: 4 },
    miniIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    miniName: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, maxWidth: 130 },
    miniBalLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: "capitalize" },
    miniBalance: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    metricsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
    metricCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 6 },
    metricValue: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
    metricLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: "center" },
    modulesGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
    moduleCard: { width: "30%", backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 6, ...SHADOWS.sm },
    moduleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    moduleLabel: { fontSize: FONT_SIZE.xs, fontWeight: "600", color: COLORS.text, textAlign: "center" },
    recentSection: { marginTop: SPACING.sm },
    recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm },
    seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: "600" },
    recentCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs, gap: SPACING.sm },
    recentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    recentInfo: { flex: 1 },
    recentType: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text, textTransform: "capitalize" },
    recentDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    recentAmount: { fontSize: FONT_SIZE.md, fontWeight: "700" },
});

export default HomeScreen;
