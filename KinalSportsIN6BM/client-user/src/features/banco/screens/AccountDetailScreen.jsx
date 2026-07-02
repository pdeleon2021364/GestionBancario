import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getMyTransactionsApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";

const TYPE_COLORS = {
    deposito: "#34d399",
    retiro: "#fb7185",
    transferencia: "#38bdf8",
};

const AccountDetailScreen = ({ route }) => {
    const { account } = route.params;
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const load = async () => {
        try {
            const data = await getMyTransactionsApi();
            const list = Array.isArray(data) ? data : [];
            setTransactions(list);
        } catch {} finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, []),
    );

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const dateText = (value) => {
        if (!value) return "";
        const d = new Date(value);
        return d.toLocaleDateString("es-GT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scroll}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
        >
            <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                    <MaterialIcons name="account-balance" size={40} color={COLORS.primary} />
                    <View style={[styles.statusBadge, { borderColor: account.estado === "activa" ? COLORS.success : COLORS.error }]}>
                        <View style={[styles.statusDot, { backgroundColor: account.estado === "activa" ? COLORS.success : COLORS.error }]} />
                        <Text style={[styles.statusText, { color: account.estado === "activa" ? COLORS.success : COLORS.error }]}>
                            {account.estado}
                        </Text>
                    </View>
                </View>
                <Text style={styles.accountName}>{account.nombre}</Text>
                <Text style={styles.accountNumber}>{account.numeroCuenta}</Text>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{money(account.saldo)}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Tipo</Text>
                        <Text style={styles.metaValue}>{account.tipoCuenta}</Text>
                    </View>
                    {account.tasaInteres != null && (
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Tasa Interés</Text>
                            <Text style={styles.metaValue}>{account.tasaInteres}%</Text>
                        </View>
                    )}
                    {account.sobregiro != null && (
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Sobregiro</Text>
                            <Text style={styles.metaValue}>{money(account.sobregiro)}</Text>
                        </View>
                    )}
                </View>
            </View>

            <Text style={styles.sectionTitle}>Últimos movimientos</Text>

            {transactions.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Sin movimientos recientes</Text>
                </View>
            ) : (
                transactions.slice(0, 10).map((tx, idx) => (
                    <View key={tx._id || idx} style={styles.txCard}>
                        <View style={styles.txLeft}>
                            <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[tx.tipo] || COLORS.textMuted) + "20" }]}>
                                <MaterialIcons
                                    name={
                                        tx.tipo === "deposito"
                                            ? "arrow-downward"
                                            : tx.tipo === "retiro"
                                                ? "arrow-upward"
                                                : "swap-horiz"
                                    }
                                    size={20}
                                    color={TYPE_COLORS[tx.tipo] || COLORS.textMuted}
                                />
                            </View>
                            <View>
                                <Text style={styles.txType}>{tx.tipo}</Text>
                                <Text style={styles.txDate}>{dateText(tx.createdAt)}</Text>
                            </View>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.tipo === "deposito" ? COLORS.success : COLORS.error }]}>
                            {tx.tipo === "deposito" ? "+" : "-"}{money(tx.monto)}
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
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
    heroCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    heroTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: "600",
    },
    accountName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.text,
    },
    accountNumber: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    balanceLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.md,
    },
    balanceValue: {
        fontSize: FONT_SIZE.huge,
        fontWeight: "700",
        color: COLORS.text,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: "row",
        gap: SPACING.md,
        marginTop: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    metaItem: {
        flex: 1,
    },
    metaLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    metaValue: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
        color: COLORS.text,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    txCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.xs,
    },
    txLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    txType: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
        color: COLORS.text,
        textTransform: "capitalize",
    },
    txDate: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    txAmount: {
        fontSize: FONT_SIZE.md,
        fontWeight: "700",
    },
    empty: {
        alignItems: "center",
        paddingVertical: 40,
        gap: SPACING.sm,
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
    },
});

export default AccountDetailScreen;
