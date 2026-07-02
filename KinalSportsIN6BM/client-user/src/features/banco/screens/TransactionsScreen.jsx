import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getMyTransactionsApi, createTransactionApi, getAccountsApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const TYPE_COLORS = {
    deposito: "#34d399",
    retiro: "#fb7185",
    transferencia: "#38bdf8",
};

const TransactionsScreen = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({
        tipo: "deposito",
        monto: "",
        cuentaOrigen: "",
        cuentaDestino: "",
    });

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const load = async () => {
        try {
            const [txData, accData] = await Promise.all([
                getMyTransactionsApi(),
                getAccountsApi(),
            ]);
            setTransactions(Array.isArray(txData) ? txData : []);
            setAccounts(Array.isArray(accData) ? accData : []);
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

    const dateText = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("es-GT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleCreate = async () => {
        if (!form.monto || Number(form.monto) <= 0) {
            return Alert.alert("Error", "Ingresa un monto válido");
        }
        if (form.tipo === "transferencia" && (!form.cuentaOrigen || !form.cuentaDestino)) {
            return Alert.alert("Error", "Selecciona cuenta origen y destino");
        }
        if (form.tipo === "retiro" && !form.cuentaOrigen) {
            return Alert.alert("Error", "Selecciona la cuenta origen");
        }
        if (form.tipo === "deposito" && !form.cuentaDestino) {
            return Alert.alert("Error", "Selecciona la cuenta destino");
        }
        try {
            setCreating(true);
            await createTransactionApi({
                tipo: form.tipo,
                monto: Number(form.monto),
                cuentaOrigen: form.cuentaOrigen || undefined,
                cuentaDestino: form.cuentaDestino || undefined,
            });
            setShowModal(false);
            setForm({ tipo: "deposito", monto: "", cuentaOrigen: "", cuentaDestino: "" });
            Alert.alert("Éxito", "Transacción creada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear transacción");
        } finally {
            setCreating(false);
        }
    };

    const renderTx = ({ item }) => (
        <View style={styles.txCard}>
            <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[item.tipo] || COLORS.textMuted) + "20" }]}>
                    <MaterialIcons
                        name={
                            item.tipo === "deposito"
                                ? "arrow-downward"
                                : item.tipo === "retiro"
                                    ? "arrow-upward"
                                    : "swap-horiz"
                        }
                        size={20}
                        color={TYPE_COLORS[item.tipo] || COLORS.textMuted}
                    />
                </View>
                <View>
                    <Text style={styles.txType}>{item.tipo}</Text>
                    <Text style={styles.txDate}>{dateText(item.createdAt)}</Text>
                </View>
            </View>
            <Text style={[styles.txAmount, { color: item.tipo === "deposito" ? COLORS.success : COLORS.error }]}>
                {item.tipo === "deposito" ? "+" : "-"}{money(item.monto)}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderTx}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Transacciones</Text>
                            <Text style={styles.count}>{transactions.length} movimiento(s)</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                            <MaterialIcons name="add" size={24} color={COLORS.surface} />
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="receipt-long" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin transacciones aún</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva Transacción</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tipoRow}>
                            {["deposito", "retiro", "transferencia"].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.tipoBtn,
                                        form.tipo === t && styles.tipoBtnActive,
                                    ]}
                                    onPress={() => setForm((f) => ({ ...f, tipo: t }))}
                                >
                                    <Text
                                        style={[
                                            styles.tipoBtnText,
                                            form.tipo === t && styles.tipoBtnTextActive,
                                        ]}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Monto"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={form.monto}
                            onChangeText={(v) => setForm((f) => ({ ...f, monto: v }))}
                        />

                        {(form.tipo === "retiro" || form.tipo === "transferencia") && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Cuenta Origen</Text>
                                {accounts
                                    .filter((a) => a.estado === "activa")
                                    .map((a) => (
                                        <TouchableOpacity
                                            key={a._id || a.id}
                                            style={[
                                                styles.optionBtn,
                                                form.cuentaOrigen === (a._id || a.id) && styles.optionBtnActive,
                                            ]}
                                            onPress={() => setForm((f) => ({ ...f, cuentaOrigen: a._id || a.id }))}
                                        >
                                            <Text style={[styles.optionText, form.cuentaOrigen === (a._id || a.id) && styles.optionTextActive]}>
                                                {a.nombre} - {a.numeroCuenta}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        )}

                        {(form.tipo === "deposito" || form.tipo === "transferencia") && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Cuenta Destino</Text>
                                {accounts
                                    .filter((a) => a.estado === "activa")
                                    .map((a) => (
                                        <TouchableOpacity
                                            key={a._id || a.id}
                                            style={[
                                                styles.optionBtn,
                                                form.cuentaDestino === (a._id || a.id) && styles.optionBtnActive,
                                            ]}
                                            onPress={() => setForm((f) => ({ ...f, cuentaDestino: a._id || a.id }))}
                                        >
                                            <Text style={[styles.optionText, form.cuentaDestino === (a._id || a.id) && styles.optionTextActive]}>
                                                {a.nombre} - {a.numeroCuenta}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        )}

                        <Button
                            title="Crear Transacción"
                            onPress={handleCreate}
                            loading={creating}
                            style={{ marginTop: SPACING.md }}
                        />
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
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        ...SHADOWS.md,
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
    tipoRow: {
        flexDirection: "row",
        gap: SPACING.xs,
        marginBottom: SPACING.md,
    },
    tipoBtn: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
    },
    tipoBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "20",
    },
    tipoBtnText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        fontWeight: "600",
    },
    tipoBtnTextActive: {
        color: COLORS.primary,
    },
    fieldGroup: {
        marginBottom: SPACING.md,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
    },
    optionBtn: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 4,
        backgroundColor: COLORS.surfaceAlt,
    },
    optionBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "15",
    },
    optionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    optionTextActive: {
        color: COLORS.primary,
        fontWeight: "600",
    },
});

export default TransactionsScreen;
