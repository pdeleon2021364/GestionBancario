import { View, Text, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getExchangeRatesApi, convertCurrencyApi, getCurrenciesApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

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

    const renderRate = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <MaterialIcons name="trending-up" size={20} color={COLORS.warning} />
                <Text style={styles.rateName}>{item.nameDestiny || "Par"}</Text>
            </View>
            <View style={styles.rateRow}>
                <Text style={styles.ratePair}>
                    {typeof item.divisaBase === "object" ? item.divisaBase?.codigo : item.divisaBase || "?"}
                    {" → "}
                    {typeof item.divisaDestino === "object" ? item.divisaDestino?.codigo : item.divisaDestino || "?"}
                </Text>
                <Text style={styles.rateValue}>{item.tasa}</Text>
            </View>
            {item.updatedAt && (
                <Text style={styles.rateDate}>
                    Actualizado: {new Date(item.updatedAt).toLocaleDateString("es-GT")}
                </Text>
            )}
        </View>
    );

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
                            <MaterialIcons name="swap-horiz" size={20} color={COLORS.surface} />
                            <Text style={styles.convertBtnText}>Convertir</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="trending-up" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin tipos de cambio</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showConvert} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Conversión</Text>
                            <TouchableOpacity onPress={() => { setShowConvert(false); setConvertResult(null); }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Monto"
                            keyboardType="numeric"
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
                                        {c.codigo} - {c.nombre}
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
                                        {c.codigo} - {c.nombre}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button title="Convertir" onPress={handleConvert} loading={converting} style={{ marginTop: SPACING.md }} />

                        {convertResult && (
                            <View style={styles.resultBox}>
                                <Text style={styles.resultTitle}>Resultado</Text>
                                <Text style={styles.resultValue}>
                                    {JSON.stringify(convertResult, null, 2)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
        marginTop: 2,
    },
    convertBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        ...SHADOWS.sm,
    },
    convertBtnText: {
        color: COLORS.surface,
        fontWeight: "700",
        fontSize: FONT_SIZE.sm,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.xs,
        ...SHADOWS.sm,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: SPACING.sm,
    },
    rateName: {
        fontSize: FONT_SIZE.md,
        fontWeight: "700",
        color: COLORS.text,
    },
    rateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    ratePair: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    rateValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.warning,
    },
    rateDate: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.sm,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(2,13,26,0.85)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.xl,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.text,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    optionGroup: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: SPACING.sm,
    },
    optionBtn: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceAlt,
    },
    optionBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "15",
    },
    optionText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
    },
    optionTextActive: {
        color: COLORS.primary,
        fontWeight: "600",
    },
    resultBox: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    resultTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    resultValue: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        fontFamily: "monospace",
    },
});

export default ExchangeRatesScreen;
