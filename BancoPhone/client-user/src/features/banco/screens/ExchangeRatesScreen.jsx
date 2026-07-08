import { View, Text, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getExchangeRatesApi, convertCurrencyApi, getCurrenciesApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const FLAG_COLORS = {
    US: "#2563eb", EU: "#facc15", GB: "#dc2626", JPY: "#ef4444",
    CAD: "#dc2626", AUD: "#2563eb", CHF: "#dc2626", GTQ: "#16a34a",
};

const getFlagColor = (code) => {
    const upper = (code || "").toUpperCase();
    for (const [key, val] of Object.entries(FLAG_COLORS)) {
        if (upper.includes(key)) return val;
    }
    return COLORS.secondary;
};

const ExchangeRatesScreen = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showConvert, setShowConvert] = useState(false);
    const [currencies, setCurrencies] = useState([]);
    const [convertForm, setConvertForm] = useState({
        divisaBaseId: "",
        divisaDestinoId: "",
        monto: "1",
    });
    const [convertResult, setConvertResult] = useState(null);
    const [converting, setConverting] = useState(false);

    const load = async () => {
        try {
            const [data, curr] = await Promise.all([
                getExchangeRatesApi(),
                getCurrenciesApi(),
            ]);
            setRates(Array.isArray(data) ? data : []);
            setCurrencies(Array.isArray(curr) ? curr : []);
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

    const handleConvert = async () => {
        if (!convertForm.divisaBaseId || !convertForm.divisaDestinoId || !convertForm.monto) {
            return Alert.alert("Error", "Completa todos los campos");
        }
        try {
            setConverting(true);
            const result = await convertCurrencyApi({
                divisaBaseId: convertForm.divisaBaseId,
                divisaDestinoId: convertForm.divisaDestinoId,
                monto: Number(convertForm.monto),
            });
            setConvertResult(result);
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al convertir");
        } finally {
            setConverting(false);
        }
    };

    const baseCode = (item) => typeof item.divisaBase === "object" ? item.divisaBase?.codigo : item.divisaBase || "?";
    const destCode = (item) => typeof item.divisaDestino === "object" ? item.divisaDestino?.codigo : item.divisaDestino || "?";

    const renderRate = ({ item }) => {
        const flagColor = getFlagColor(destCode(item));
        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={[styles.pairIcon, { backgroundColor: flagColor + "20" }]}>
                        <MaterialIcons name="trending-up" size={18} color={flagColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rateName}>{item.nameDestiny || `${baseCode(item)}/${destCode(item)}`}</Text>
                        <Text style={styles.ratePair}>
                            {baseCode(item)} → {destCode(item)}
                        </Text>
                    </View>
                    <View style={styles.rateBadge}>
                        <Text style={[styles.rateValue, { color: flagColor }]}>{item.tasa}</Text>
                    </View>
                </View>
                {item.updatedAt && (
                    <View style={styles.rateFooter}>
                        <MaterialIcons name="update" size={12} color={COLORS.textMuted} />
                        <Text style={styles.rateDate}>
                            {new Date(item.updatedAt).toLocaleDateString("es-GT", {
                                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const getCurrencyName = (id) => {
        const c = currencies.find((cur) => (cur._id || cur.id) === id);
        return c ? `${c.codigo} - ${c.nombre}` : "Seleccionar";
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={rates}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderRate}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Tipos de Cambio</Text>
                            <Text style={styles.count}>{rates.length} tasa(s)</Text>
                        </View>
                        <TouchableOpacity style={styles.convertBtn} onPress={() => setShowConvert(true)}>
                            <MaterialIcons name="swap-horiz" size={18} color={COLORS.surface} />
                            <Text style={styles.convertBtnText}>Convertir</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="trending-up" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin tipos de cambio disponibles</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showConvert} transparent animationType="slide">
                <ScrollView style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Conversión de Divisas</Text>
                            <TouchableOpacity onPress={() => { setShowConvert(false); setConvertResult(null); }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Monto a convertir"
                            keyboardType="numeric"
                            placeholder="1.00"
                            value={convertForm.monto}
                            onChangeText={(v) => setConvertForm((f) => ({ ...f, monto: v }))}
                        />

                        <Text style={styles.fieldLabel}>Divisa Base</Text>
                        <View style={styles.optionGroup}>
                            {currencies.map((c) => (
                                <TouchableOpacity
                                    key={c._id || c.id}
                                    style={[styles.optionBtn, convertForm.divisaBaseId === (c._id || c.id) && styles.optionBtnActive]}
                                    onPress={() => setConvertForm((f) => ({ ...f, divisaBaseId: c._id || c.id }))}
                                >
                                    <Text style={[styles.optionText, convertForm.divisaBaseId === (c._id || c.id) && styles.optionTextActive]}>
                                        {c.codigo}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Divisa Destino</Text>
                        <View style={styles.optionGroup}>
                            {currencies.map((c) => (
                                <TouchableOpacity
                                    key={c._id || c.id}
                                    style={[styles.optionBtn, convertForm.divisaDestinoId === (c._id || c.id) && styles.optionBtnActive]}
                                    onPress={() => setConvertForm((f) => ({ ...f, divisaDestinoId: c._id || c.id }))}
                                >
                                    <Text style={[styles.optionText, convertForm.divisaDestinoId === (c._id || c.id) && styles.optionTextActive]}>
                                        {c.codigo}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button title="Convertir" onPress={handleConvert} loading={converting} style={{ marginTop: SPACING.md }} />

                        {convertResult && (
                            <View style={styles.resultBox}>
                                <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
                                <Text style={styles.resultTitle}>Resultado de la conversión</Text>
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>{getCurrencyName(convertForm.divisaBase)}</Text>
                                    <Text style={styles.resultValue}>{Number(convertForm.monto).toFixed(2)}</Text>
                                </View>
                                <View style={styles.resultArrow}>
                                    <MaterialIcons name="arrow-downward" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>{getCurrencyName(convertForm.divisaDestino)}</Text>
                                    <Text style={[styles.resultValue, { color: COLORS.primary, fontSize: FONT_SIZE.xl }]}>
                                        {(convertResult.resultado || convertResult.montoConvertido || 0).toFixed(2)}
                                    </Text>
                                </View>
                                {convertResult.tasa && (
                                    <Text style={styles.resultTasa}>Tasa: {convertResult.tasa}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    convertBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 12, ...SHADOWS.sm },
    convertBtnText: { color: COLORS.surface, fontWeight: "700", fontSize: FONT_SIZE.sm },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs, ...SHADOWS.sm },
    cardTop: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    pairIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    rateName: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    ratePair: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    rateBadge: { backgroundColor: COLORS.surfaceAlt, borderRadius: 10, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
    rateValue: { fontSize: FONT_SIZE.md, fontWeight: "700" },
    rateFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
    rateDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, marginTop: 60 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.xs, marginTop: SPACING.sm },
    optionGroup: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: SPACING.sm },
    optionBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
    optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "15" },
    optionText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, fontWeight: "600" },
    optionTextActive: { color: COLORS.primary },
    resultBox: { marginTop: SPACING.lg, padding: SPACING.xl, backgroundColor: COLORS.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", gap: SPACING.md },
    resultTitle: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.text },
    resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
    resultLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
    resultValue: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text },
    resultArrow: { paddingVertical: SPACING.xs },
    resultTasa: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.sm },
});

export default ExchangeRatesScreen;
