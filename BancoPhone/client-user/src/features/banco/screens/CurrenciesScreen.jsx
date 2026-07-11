import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getCurrenciesApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import { useCurrencyStore } from "../../../shared/store/useCurrencyStore";

const CURRENCY_FLAGS = {
    USD: "US", EUR: "EU", GBP: "GB", JPY: "JP", CAD: "CA",
    AUD: "AU", CHF: "CH", CNY: "CN", MXN: "MX", BRL: "BR",
    GTQ: "GT", HNL: "HN", SVC: "SV", CRC: "CR", NIO: "NI",
};

const FLAG_COLORS = {
    US: "#2563eb", EU: "#facc15", GB: "#dc2626", JP: "#ef4444",
    CA: "#dc2626", AU: "#2563eb", CH: "#dc2626", CN: "#ef4444",
    MX: "#16a34a", BR: "#16a34a", GT: "#16a34a",
};

const CurrenciesScreen = () => {
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
    const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);

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

    const filtered = search.trim()
        ? currencies.filter((c) =>
            (c.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.codigo || "").toLowerCase().includes(search.toLowerCase())
          )
        : currencies;

    const renderCurrency = ({ item }) => {
        const flag = CURRENCY_FLAGS[item.codigo] || "XX";
        const flagColor = FLAG_COLORS[flag] || COLORS.secondary;
        const isSelected = selectedCurrency?._id === item._id;

        return (
            <TouchableOpacity onPress={() => setSelectedCurrency(item)} activeOpacity={0.7}>
                <View style={[styles.card, isSelected && styles.cardSelected]}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.flagBox, { backgroundColor: flagColor + "20" }]}>
                            <Text style={[styles.flagText, { color: flagColor }]}>{flag}</Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.name}>{item.nombre}</Text>
                            <Text style={styles.code}>{item.codigo}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={[styles.symbol, { color: flagColor }]}>{item.simbolo}</Text>
                        {isSelected && <MaterialIcons name="check-circle" size={20} color={COLORS.success} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderCurrency}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Divisas</Text>
                                <Text style={styles.count}>{currencies.length} moneda(s)</Text>
                            </View>
                        </View>
                        <View style={styles.searchBox}>
                            <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar moneda..."
                                placeholderTextColor={COLORS.textMuted}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search ? (
                                <MaterialIcons name="close" size={18} color={COLORS.textMuted} onPress={() => setSearch("")} />
                            ) : null}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="currency-exchange" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>
                                {search ? "No se encontraron monedas" : "No hay divisas disponibles"}
                            </Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    currencies.length > 0 ? (
                        <Text style={styles.footer}>
                            {filtered.length} de {currencies.length} moneda(s)
                        </Text>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm },
    searchInput: { flex: 1, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.text },
    card: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs, ...SHADOWS.sm },
    cardSelected: { borderColor: COLORS.success, borderWidth: 2, backgroundColor: COLORS.surface },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    cardRight: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
    flagBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    flagText: { fontSize: FONT_SIZE.sm, fontWeight: "800" },
    cardInfo: { gap: 1 },
    name: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
    code: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    symbol: { fontSize: FONT_SIZE.xxl, fontWeight: "700" },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    footer: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.md },
});

export default CurrenciesScreen;
