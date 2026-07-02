import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getCurrenciesApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";

const CurrenciesScreen = () => {
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const data = await getCurrenciesApi();
            setCurrencies(Array.isArray(data) ? data : []);
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

    const renderCurrency = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                    <MaterialIcons name="currency-exchange" size={24} color={COLORS.secondary} />
                </View>
                <View>
                    <Text style={styles.name}>{item.nombre}</Text>
                    <Text style={styles.code}>{item.codigo}</Text>
                </View>
            </View>
            <Text style={styles.symbol}>{item.simbolo}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={currencies}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderCurrency}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>Divisas</Text>
                        <Text style={styles.count}>{currencies.length} moneda(s)</Text>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="currency-exchange" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No hay divisas disponibles</Text>
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.xs,
        ...SHADOWS.sm,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
    },
    name: {
        fontSize: FONT_SIZE.md,
        fontWeight: "600",
        color: COLORS.text,
    },
    code: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    symbol: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: "700",
        color: COLORS.secondary,
    },
    empty: {
        alignItems: "center",
        paddingVertical: 80,
        gap: SPACING.md,
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
    },
});

export default CurrenciesScreen;
