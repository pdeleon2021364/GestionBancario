import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getMyTransactionsApi, closeAccountApi, sendAccountPDFApi } from "../../../shared/api/banco";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const TYPE_COLORS = {
    deposito: "#34d399",
    retiro: "#fb7185",
    transferencia: "#38bdf8",
};

const CATEGORY_ICONS = {
    alimentos: "restaurant", transporte: "directions-bus", servicios: "receipt",
    entretenimiento: "movie", salud: "local-hospital", educacion: "school",
    vivienda: "home", ropa: "checkroom", ahorro: "savings", otros: "category",
};

const AccountDetailScreen = ({ route, navigation }) => {
    const { account } = route.params;
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [closing, setClosing] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfEmail, setPdfEmail] = useState("");
    const [sendingPdf, setSendingPdf] = useState(false);

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const load = async () => {
        try {
            const data = await getMyTransactionsApi();
            const list = Array.isArray(data) ? data : [];
            const accountId = account._id || account.id;
            const filtered = list.filter(
                (tx) =>
                    (tx.cuentaOrigen?._id === accountId || tx.cuentaOrigen === accountId) ||
                    (tx.cuentaDestino?._id === accountId || tx.cuentaDestino === accountId)
            );
            setTransactions(filtered);
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

    const handleCopy = async () => {
        try {
            await Clipboard.setStringAsync(account.numeroCuenta);
            Alert.alert("Copiado", "Número de cuenta copiado al portapapeles");
        } catch {
            Alert.alert("Error", "No se pudo copiar el número");
        }
    };

    const handleClose = () => {
        if (Number(account.saldo) > 0) {
            return Alert.alert(
                "Saldo pendiente",
                "Debes retirar todo el saldo antes de cerrar la cuenta. Ve a Movimientos y haz un retiro."
            );
        }
        Alert.alert("Cerrar cuenta", "¿Estás seguro? Esta acción no se puede deshacer.", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar cuenta",
                style: "destructive",
                onPress: async () => {
                    try {
                        setClosing(true);
                        await closeAccountApi(account._id || account.id);
                        Alert.alert("Cuenta cerrada", "La cuenta se cerró correctamente");
                        navigation.goBack();
                    } catch (err) {
                        Alert.alert("Error", err.response?.data?.message || "Error al cerrar cuenta");
                    } finally {
                        setClosing(false);
                    }
                },
            },
        ]);
    };

    const handleSendPdf = async () => {
        if (!pdfEmail || !pdfEmail.includes("@")) {
            return Alert.alert("Error", "Ingresa un correo válido");
        }
        try {
            setSendingPdf(true);
            await sendAccountPDFApi(account._id || account.id, pdfEmail);
            Alert.alert("Enviado", `PDF enviado a ${pdfEmail}`);
            setShowPdfModal(false);
            setPdfEmail("");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al enviar PDF");
        } finally {
            setSendingPdf(false);
        }
    };

    const dateText = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("es-GT", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const totalCredited = transactions.filter((tx) => tx.tipo === "deposito" || (tx.tipo === "transferencia" && tx.cuentaDestino?._id === (account._id || account.id)))
        .reduce((s, tx) => s + Number(tx.monto || 0), 0);
    const totalDebited = transactions.filter((tx) => tx.tipo === "retiro" || (tx.tipo === "transferencia" && tx.cuentaOrigen?._id === (account._id || account.id)))
        .reduce((s, tx) => s + Number(tx.monto || 0), 0);

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
                    <View style={styles.heroIconWrap}>
                        <MaterialIcons name="account-balance" size={32} color={COLORS.primary} />
                    </View>
                    <View style={[styles.statusBadge, { borderColor: account.estado === "activa" ? COLORS.success : COLORS.error }]}>
                        <View style={[styles.statusDot, { backgroundColor: account.estado === "activa" ? COLORS.success : COLORS.error }]} />
                        <Text style={[styles.statusText, { color: account.estado === "activa" ? COLORS.success : COLORS.error }]}>
                            {account.estado}
                        </Text>
                    </View>
                </View>
                <Text style={styles.accountName}>{account.nombre}</Text>
                <TouchableOpacity onPress={handleCopy}>
                    <Text style={styles.accountNumber}>
                        {account.numeroCuenta} <MaterialIcons name="content-copy" size={14} color={COLORS.textMuted} />
                    </Text>
                </TouchableOpacity>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{money(account.saldo)}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="category" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaLabel}>Tipo</Text>
                        <Text style={styles.metaValue}>{account.tipoCuenta}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                        <MaterialIcons name="calendar-today" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaLabel}>Creada</Text>
                        <Text style={styles.metaValue}>{dateText(account.createdAt)}</Text>
                    </View>
                    {account.tasaInteresAnual != null && account.tasaInteresAnual > 0 && (
                        <>
                            <View style={styles.metaDivider} />
                            <View style={styles.metaItem}>
                                <MaterialIcons name="trending-up" size={14} color={COLORS.textMuted} />
                                <Text style={styles.metaLabel}>Interés</Text>
                                <Text style={styles.metaValue}>{account.tasaInteresAnual}%</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {account.estado === "activa" && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("Transactions", { screen: "TransactionsMain", params: { openTransfer: true, sourceAccountId: account._id || account.id } })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + "20" }]}>
                            <MaterialIcons name="send" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionText}>Transferir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("Transactions", { screen: "TransactionsMain", params: { openWithdraw: true, sourceAccountId: account._id || account.id } })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.error + "20" }]}>
                            <MaterialIcons name="arrow-upward" size={20} color={COLORS.error} />
                        </View>
                        <Text style={[styles.actionText, { color: COLORS.error }]}>Retirar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleCopy}>
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + "20" }]}>
                            <MaterialIcons name="content-copy" size={20} color={COLORS.secondary} />
                        </View>
                        <Text style={[styles.actionText, { color: COLORS.secondary }]}>Copiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => setShowPdfModal(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + "20" }]}>
                            <MaterialIcons name="picture-as-pdf" size={20} color={COLORS.warning} />
                        </View>
                        <Text style={[styles.actionText, { color: COLORS.warning }]}>PDF</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Resumen de movimientos</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <MaterialIcons name="receipt-long" size={20} color={COLORS.primary} />
                        <Text style={styles.statValue}>{transactions.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialIcons name="arrow-downward" size={20} color={COLORS.success} />
                        <Text style={[styles.statValue, { color: COLORS.success }]}>{money(totalCredited)}</Text>
                        <Text style={styles.statLabel}>Ingresado</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialIcons name="arrow-upward" size={20} color={COLORS.error} />
                        <Text style={[styles.statValue, { color: COLORS.error }]}>{money(totalDebited)}</Text>
                        <Text style={styles.statLabel}>Retirado</Text>
                    </View>
                </View>
            </View>

            {account.estado !== "cerrada" && (
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={closing}>
                    <MaterialIcons name="delete-forever" size={18} color={COLORS.error} />
                    <Text style={styles.closeText}>{closing ? "Cerrando..." : "Cerrar esta cuenta"}</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Últimos movimientos</Text>

            {transactions.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Sin movimientos recientes</Text>
                    <Text style={styles.emptySubtext}>Realiza una transferencia o retiro</Text>
                </View>
            ) : (
                transactions.slice(0, 10).map((tx, idx) => (
                    <View key={tx._id || idx} style={styles.txCard}>
                        <View style={styles.txLeft}>
                            <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[tx.tipo] || COLORS.textMuted) + "20" }]}>
                                <MaterialIcons
                                    name={
                                        tx.tipo === "deposito" ? "arrow-downward" :
                                        tx.tipo === "retiro" ? "arrow-upward" : "swap-horiz"
                                    }
                                    size={18}
                                    color={TYPE_COLORS[tx.tipo] || COLORS.textMuted}
                                />
                            </View>
                            <View style={styles.txInfo}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Text style={styles.txType}>{tx.tipo}</Text>
                                    {tx.categoria && tx.categoria !== "otros" && (
                                        <MaterialIcons name={CATEGORY_ICONS[tx.categoria] || "category"} size={12} color={COLORS.textMuted} />
                                    )}
                                </View>
                                <Text style={styles.txDate}>{dateText(tx.createdAt)}</Text>
                            </View>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.tipo === "deposito" ? COLORS.success : COLORS.error }]}>
                            {tx.tipo === "deposito" ? "+" : "-"}{money(tx.monto)}
                        </Text>
                    </View>
                ))
            )}

            <Modal visible={showPdfModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enviar PDF por correo</Text>
                            <TouchableOpacity onPress={() => setShowPdfModal(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalInfo}>
                            Se enviará un PDF con los detalles de esta cuenta y sus últimos movimientos.
                        </Text>
                        <Input
                            label="Correo destino"
                            placeholder="correo@ejemplo.com"
                            keyboardType="email-address"
                            value={pdfEmail}
                            onChangeText={setPdfEmail}
                        />
                        <Button title="Enviar PDF" onPress={handleSendPdf} loading={sendingPdf} />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 100 },
    heroCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, marginBottom: SPACING.md, ...SHADOWS.md },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
    heroIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.surfaceAlt, alignItems: "center", justifyContent: "center" },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: "600" },
    accountName: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text, marginTop: SPACING.sm },
    accountNumber: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
    balanceLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.md },
    balanceValue: { fontSize: FONT_SIZE.huge, fontWeight: "700", color: COLORS.text, marginTop: 2 },
    metaRow: { flexDirection: "row", marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
    metaItem: { flex: 1, gap: 2 },
    metaDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
    metaLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    metaValue: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text, marginTop: 1 },
    actionRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
    actionBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 6 },
    actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    actionText: { fontSize: FONT_SIZE.xs, fontWeight: "600", color: COLORS.primary },
    statsCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
    statsTitle: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textMuted, marginBottom: SPACING.md },
    statsRow: { flexDirection: "row", gap: SPACING.sm },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statValue: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    closeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: SPACING.lg, paddingVertical: SPACING.sm },
    closeText: { fontSize: FONT_SIZE.sm, color: COLORS.error, fontWeight: "600" },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
    txCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs },
    txLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    txInfo: { gap: 1 },
    txType: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text, textTransform: "capitalize" },
    txDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    txAmount: { fontSize: FONT_SIZE.md, fontWeight: "700" },
    empty: { alignItems: "center", paddingVertical: 40, gap: SPACING.sm },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    modalInfo: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginBottom: SPACING.md, textAlign: "center" },
});

export default AccountDetailScreen;
