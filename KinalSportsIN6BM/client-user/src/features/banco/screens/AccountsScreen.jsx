import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getAccountsApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_COLORS = {
    activa: "#34d399",
    inactiva: "#fb7185",
};

const AccountsScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const renderAccount = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("AccountDetail", { account: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="account-balance" size={24} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.accountName}>{item.nombre}</Text>
                        <Text style={styles.accountNumber}>{item.numeroCuenta}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[item.estado] || COLORS.textMuted }]}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.estado] || COLORS.textMuted }]} />
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.estado] || COLORS.textMuted }]}>
                        {item.estado}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{money(item.saldo)}</Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.footerText}>{item.tipoCuenta?.toUpperCase()}</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </View>
        </TouchableOpacity>
    );

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
                    <View style={styles.header}>
                        <Text style={styles.title}>Mis Cuentas</Text>
                        <Text style={styles.count}>{accounts.length} cuenta(s)</Text>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="account-balance" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No tienes cuentas bancarias</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: "700",
        color: COLORS.text,
    },
    count: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
    },
    accountName: {
        fontSize: FONT_SIZE.md,
        fontWeight: "700",
        color: COLORS.text,
    },
    accountNumber: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: 2,
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
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
    },
    balanceLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    balanceValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.text,
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        fontWeight: "600",
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        gap: SPACING.md,
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
    },
});

export default AccountsScreen;
