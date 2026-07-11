import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { getFavoritesApi, createFavoriteApi, deleteFavoriteApi, transferToFavoriteApi, getAccountsApi, searchAccountByNumberApi } from "../../../shared/api/banco";
import { useFocusEffect } from "@react-navigation/native";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useCurrencyStore } from "../../../shared/store/useCurrencyStore";
import { formatMoney } from "../../../shared/utils/formatMoney";

const FavoritesScreen = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [selectedFavorite, setSelectedFavorite] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [createForm, setCreateForm] = useState({
        numeroCuenta: "",
        alias: "",
    });
    const [transferForm, setTransferForm] = useState({
        cuentaOrigen: "",
        monto: "",
    });

    const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
    const exchangeRates = useCurrencyStore((s) => s.exchangeRates);
    const money = (value) => formatMoney(value, selectedCurrency, exchangeRates);

    const load = async () => {
        try {
            const [favData, accData] = await Promise.all([
                getFavoritesApi(),
                getAccountsApi(),
            ]);
            setFavorites(Array.isArray(favData) ? favData : []);
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

    const handleSearchAccount = async () => {
        if (!createForm.numeroCuenta.trim()) return;
        try {
            setSearching(true);
            const result = await searchAccountByNumberApi(createForm.numeroCuenta.trim());
            setSearchResult(result);
        } catch (err) {
            Alert.alert("Error", "Cuenta no encontrada");
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleCreateFavorite = async () => {
        if (!createForm.alias.trim()) {
            return Alert.alert("Error", "Ingresa un alias para el favorito");
        }
        if (!searchResult) {
            return Alert.alert("Error", "Busca una cuenta destino primero");
        }
        try {
            setCreating(true);
            await createFavoriteApi({
                alias: createForm.alias.trim(),
                bankAccount: searchResult._id || searchResult.id,
            });
            setShowCreateModal(false);
            setCreateForm({ numeroCuenta: "", alias: "" });
            setSearchResult(null);
            Alert.alert("Éxito", "Favorito creado correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al crear favorito");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteFavorite = (item) => {
        Alert.alert("Eliminar Favorito", `¿Eliminar "${item.alias || item.nombre}" de favoritos?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteFavoriteApi(item._id || item.id);
                        load();
                    } catch (err) {
                        Alert.alert("Error", err.response?.data?.message || "Error al eliminar");
                    }
                },
            },
        ]);
    };

    const openTransfer = (item) => {
        setSelectedFavorite(item);
        setTransferForm({ cuentaOrigen: "", monto: "" });
        setShowTransferModal(true);
    };

    const handleTransferConfirm = () => {
        if (!transferForm.cuentaOrigen) {
            return Alert.alert("Error", "Selecciona una cuenta origen");
        }
        if (!transferForm.monto || Number(transferForm.monto) <= 0) {
            return Alert.alert("Error", "Ingresa un monto válido");
        }
        const sourceAccount = accounts.find((a) => (a._id || a.id) === transferForm.cuentaOrigen);
        if (sourceAccount && Number(transferForm.monto) > Number(sourceAccount.saldo)) {
            return Alert.alert("Saldo insuficiente", `Saldo disponible: ${money(sourceAccount.saldo)}`);
        }
        setShowTransferModal(false);
        setShowConfirmModal(true);
    };

    const handleTransfer = async () => {
        try {
            setTransferring(true);
            await transferToFavoriteApi({
                favoriteId: selectedFavorite._id || selectedFavorite.id,
                fromAccountId: transferForm.cuentaOrigen,
                amount: Number(transferForm.monto),
            });
            setShowConfirmModal(false);
            setSelectedFavorite(null);
            Alert.alert("Éxito", "Transferencia realizada correctamente");
            load();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Error al transferir");
        } finally {
            setTransferring(false);
        }
    };

    const renderFavorite = ({ item }) => {
        const accountInfo = item.bankAccount || {};
        return (
            <TouchableOpacity style={styles.favCard} onPress={() => openTransfer(item)} activeOpacity={0.7}>
                <View style={styles.favLeft}>
                    <View style={[styles.favIcon, { backgroundColor: COLORS.warning + "20" }]}>
                        <MaterialIcons name="star" size={22} color={COLORS.warning} />
                    </View>
                    <View style={styles.favInfo}>
                        <Text style={styles.favAlias}>{item.alias || "Favorito"}</Text>
                        <Text style={styles.favAccount}>{accountInfo.numeroCuenta || "—"}</Text>
                        <View style={styles.favMetaRow}>
                            {accountInfo.tipoCuenta && (
                                <View style={styles.favMetaBadge}>
                                    <MaterialIcons name="account-balance" size={10} color={COLORS.textMuted} />
                                    <Text style={styles.favMetaText}>{accountInfo.tipoCuenta}</Text>
                                </View>
                            )}
                            {accountInfo.estado && (
                                <View style={[styles.favMetaBadge, { borderColor: accountInfo.estado === "activa" ? COLORS.success + "40" : COLORS.error + "40" }]}>
                                    <View style={[styles.favMetaDot, { backgroundColor: accountInfo.estado === "activa" ? COLORS.success : COLORS.error }]} />
                                    <Text style={styles.favMetaText}>{accountInfo.estado}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteFavorite(item)}>
                    <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id || item.id?.toString()}
                renderItem={renderFavorite}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Favoritos</Text>
                            <Text style={styles.count}>{favorites.length} favorito(s)</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
                            <MaterialIcons name="add" size={24} color={COLORS.surface} />
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <MaterialIcons name="star-border" size={60} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Sin favoritos aún</Text>
                            <Text style={styles.emptySubtext}>Agrega cuentas de transferencia rápida</Text>
                        </View>
                    ) : null
                }
            />

            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nuevo Favorito</Text>
                            <TouchableOpacity onPress={() => {
                                setShowCreateModal(false);
                                setCreateForm({ numeroCuenta: "", alias: "" });
                                setSearchResult(null);
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Número de Cuenta Destino"
                            placeholder="Ingresa el número de cuenta"
                            value={createForm.numeroCuenta}
                            onChangeText={(v) => {
                                setCreateForm((f) => ({ ...f, numeroCuenta: v }));
                                setSearchResult(null);
                            }}
                        />
                        <Button
                            title={searching ? "Buscando..." : "Buscar Cuenta"}
                            onPress={handleSearchAccount}
                            loading={searching}
                            variant="secondary"
                            style={{ marginBottom: SPACING.md }}
                        />

                        {searchResult && (
                            <View style={styles.searchResultCard}>
                                <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.searchResultText}>
                                        {searchResult.nombre} - {searchResult.numeroCuenta}
                                    </Text>
                                    <Text style={styles.searchResultSubtext}>
                                        {searchResult.tipoCuenta} | Saldo: {money(searchResult.saldo)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <Input
                            label="Alias"
                            placeholder="Ej: Cuenta de Juan"
                            value={createForm.alias}
                            onChangeText={(v) => setCreateForm((f) => ({ ...f, alias: v }))}
                        />

                        <Button
                            title="Crear Favorito"
                            onPress={handleCreateFavorite}
                            loading={creating}
                            disabled={!searchResult}
                            style={{ marginTop: SPACING.sm }}
                        />
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={showTransferModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Transferir a Favorito</Text>
                            <TouchableOpacity onPress={() => {
                                setShowTransferModal(false);
                                setSelectedFavorite(null);
                            }}>
                                <MaterialIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedFavorite && (
                            <View style={styles.favDetailCard}>
                                <MaterialIcons name="star" size={24} color={COLORS.warning} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.favDetailAlias}>{selectedFavorite.alias || "Favorito"}</Text>
                                    <Text style={styles.favDetailAccount}>{selectedFavorite.bankAccount?.numeroCuenta || ""}</Text>
                                    {selectedFavorite.bankAccount?.tipoCuenta && (
                                        <Text style={styles.favDetailType}>{selectedFavorite.bankAccount.tipoCuenta}</Text>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Cuenta Origen</Text>
                            {accounts
                                .filter((a) => a.estado === "activa" || !a.estado)
                                .map((a) => (
                                    <TouchableOpacity
                                        key={a._id || a.id}
                                        style={[styles.optionBtn, transferForm.cuentaOrigen === (a._id || a.id) && styles.optionBtnActive]}
                                        onPress={() => setTransferForm((f) => ({ ...f, cuentaOrigen: a._id || a.id }))}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.optionText, transferForm.cuentaOrigen === (a._id || a.id) && styles.optionTextActive]}>
                                                {a.nombre} - {a.numeroCuenta}
                                            </Text>
                                            <Text style={styles.optionSubtext}>{money(a.saldo)} disponibles</Text>
                                        </View>
                                        {transferForm.cuentaOrigen === (a._id || a.id) && (
                                            <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                        </View>

                        <Input
                            label="Monto a transferir"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={transferForm.monto}
                            onChangeText={(v) => setTransferForm((f) => ({ ...f, monto: v }))}
                        />

                        <Button
                            title="Continuar"
                            onPress={handleTransferConfirm}
                            style={{ marginTop: SPACING.sm }}
                        />
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmCard}>
                        <MaterialIcons name="swap-horiz" size={48} color={COLORS.primary} />
                        <Text style={styles.confirmTitle}>Confirmar Transferencia</Text>
                        <View style={styles.confirmDetail}>
                            <Text style={styles.confirmLabel}>Destino</Text>
                            <Text style={styles.confirmValue}>{selectedFavorite?.alias || "—"}</Text>
                        </View>
                        <View style={styles.confirmDetail}>
                            <Text style={styles.confirmLabel}>Monto</Text>
                            <Text style={[styles.confirmValue, { color: COLORS.primary, fontSize: FONT_SIZE.xl }]}>
                                {money(transferForm.monto)}
                            </Text>
                        </View>
                        <View style={styles.confirmActions}>
                            <Button
                                title="Cancelar"
                                variant="secondary"
                                onPress={() => {
                                    setShowConfirmModal(false);
                                    setShowTransferModal(true);
                                }}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title={transferring ? "Enviando..." : "Confirmar"}
                                onPress={handleTransfer}
                                loading={transferring}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
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
    addBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.md },
    favCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs },
    favLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: SPACING.sm },
    favIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    favInfo: { flex: 1 },
    favAlias: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.text },
    favAccount: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 1 },
    favMetaRow: { flexDirection: "row", gap: 6, marginTop: 4 },
    favMetaBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
    favMetaDot: { width: 5, height: 5, borderRadius: 3 },
    favMetaText: { fontSize: 9, color: COLORS.textMuted },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.error + "15", alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", paddingVertical: 80, gap: SPACING.md },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
    modalOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "flex-end" },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    searchResultCard: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderStrong, padding: SPACING.md, marginBottom: SPACING.md },
    searchResultText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: "600" },
    searchResultSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    favDetailCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.warning + "10", borderRadius: 12, borderWidth: 1, borderColor: COLORS.warning + "30", padding: SPACING.md, marginBottom: SPACING.lg },
    favDetailAlias: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text },
    favDetailAccount: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 1 },
    favDetailType: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    fieldGroup: { marginBottom: SPACING.md },
    fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textLight, marginBottom: SPACING.xs },
    optionBtn: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4, backgroundColor: COLORS.surfaceAlt },
    optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
    optionText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
    optionTextActive: { color: COLORS.primary, fontWeight: "600" },
    optionSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
    confirmOverlay: { flex: 1, backgroundColor: "rgba(2,13,26,0.85)", justifyContent: "center", alignItems: "center", padding: SPACING.xl },
    confirmCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: SPACING.xl, width: "100%", alignItems: "center", gap: SPACING.md },
    confirmTitle: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    confirmDetail: { width: "100%", alignItems: "center", gap: 2 },
    confirmLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    confirmValue: { fontSize: FONT_SIZE.md, fontWeight: "600", color: COLORS.text },
    confirmActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md, width: "100%" },
});

export default FavoritesScreen;
