import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAuthStore } from "../../../shared/store/authStore";

const MODULES = [
    { key: "Users", icon: "people", label: "Usuarios", color: "#0ea5e9", desc: "CRUD de usuarios" },
    { key: "Accounts", icon: "account-balance", label: "Cuentas", color: "#22d3ee", desc: "Asignar y gestionar cuentas" },
    { key: "Currencies", icon: "currency-exchange", label: "Divisas", color: "#34d399", desc: "Catálogo de monedas" },
    { key: "Products", icon: "card-giftcard", label: "Productos", color: "#a78bfa", desc: "Productos financieros" },
    { key: "Transactions", icon: "swap-horiz", label: "Movimientos", color: "#fb7185", desc: "Todas las transacciones" },
];

const AdminHomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setRefreshing(false);
    }, []);

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
                        <Text style={styles.greeting}>Admin, {user?.nombre || "Admin"}</Text>
                        <Text style={styles.subtitle}>Panel de Administración Bancaria</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={() => useAuthStore.getState().logout()}>
                        <MaterialIcons name="logout" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.balanceCard}>
                    <MaterialIcons name="admin-panel-settings" size={40} color={COLORS.secondary} />
                    <Text style={styles.balanceTitle}>OVA Bank Admin</Text>
                    <Text style={styles.balanceDesc}>Gestiona usuarios, cuentas, divisas, productos y transacciones</Text>
                </View>

                <Text style={styles.sectionTitle}>Módulos de Administración</Text>

                <View style={styles.modulesGrid}>
                    {MODULES.map((mod) => (
                        <TouchableOpacity
                            key={mod.key}
                            style={styles.moduleCard}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate(mod.key)}
                        >
                            <View style={[styles.moduleIcon, { backgroundColor: mod.color + "20" }]}>
                                <MaterialIcons name={mod.icon} size={28} color={mod.color} />
                            </View>
                            <Text style={styles.moduleLabel}>{mod.label}</Text>
                            <Text style={styles.moduleDesc}>{mod.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
    balanceCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, marginBottom: SPACING.lg, alignItems: "center", ...SHADOWS.md },
    balanceTitle: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text, marginVertical: SPACING.sm },
    balanceDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: "center" },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.md },
    modulesGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
    moduleCard: { width: "48%", backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOWS.sm },
    moduleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: SPACING.sm },
    moduleLabel: { fontSize: FONT_SIZE.sm, fontWeight: "700", color: COLORS.text, marginBottom: 2 },
    moduleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});

export default AdminHomeScreen;
