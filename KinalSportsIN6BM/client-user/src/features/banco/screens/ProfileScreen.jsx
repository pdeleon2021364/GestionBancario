import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAuthStore } from "../../../shared/store/authStore";
import { useThemeStore } from "../../../shared/store/themeStore";
import { getAccountsApi } from "../../../shared/api/banco";
import Button from "../../../shared/components/Button";
import avatarDefault from "../../../../assets/avatarDefault.png";
import { useFocusEffect } from "@react-navigation/native";

const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const mode = useThemeStore((state) => state.mode);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const [accounts, setAccounts] = useState([]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    const data = await getAccountsApi();
                    setAccounts(Array.isArray(data) ? data : []);
                } catch {}
            })();
        }, []),
    );

    const activeAccounts = accounts.filter((a) => a.estado === "activa");
    const totalBalance = activeAccounts.reduce((s, a) => s + Number(a.saldo || 0), 0);

    const money = (value) =>
        `Q ${Number(value || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

    const handleLogout = () => {
        Alert.alert("Cerrar sesión", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar sesión", style: "destructive", onPress: () => useAuthStore.getState().logout() },
        ]);
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" })
        : null;

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll}>
            <View style={styles.orbOne} />
            <View style={styles.orbTwo} />

            <View style={styles.profileHeader}>
                <View style={styles.avatarWrap}>
                    <Image
                        source={user?.profilePicture ? { uri: user.profilePicture } : avatarDefault}
                        style={styles.avatar}
                        defaultSource={avatarDefault}
                    />
                    <View style={styles.avatarBadge}>
                        <MaterialIcons name="verified" size={16} color={COLORS.surface} />
                    </View>
                </View>
                <Text style={styles.name}>{user?.nombre || "Usuario"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                <View style={styles.roleRow}>
                    <View style={styles.roleBadge}>
                        <MaterialIcons name="shield" size={14} color={COLORS.primary} />
                        <Text style={styles.roleText}>{user?.role || "USER"}</Text>
                    </View>
                    {user?.emailVerified ? (
                        <View style={[styles.roleBadge, { backgroundColor: COLORS.success + "15", borderColor: COLORS.success + "30" }]}>
                            <MaterialIcons name="check-circle" size={14} color={COLORS.success} />
                            <Text style={[styles.roleText, { color: COLORS.success }]}>Verificado</Text>
                        </View>
                    ) : (
                        <View style={[styles.roleBadge, { backgroundColor: COLORS.warning + "15", borderColor: COLORS.warning + "30" }]}>
                            <MaterialIcons name="warning" size={14} color={COLORS.warning} />
                            <Text style={[styles.roleText, { color: COLORS.warning }]}>No verificado</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <MaterialIcons name="account-balance" size={20} color={COLORS.primary} />
                    <Text style={styles.statValue}>{accounts.length}</Text>
                    <Text style={styles.statLabel}>Cuentas</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                    <Text style={styles.statValue}>{activeAccounts.length}</Text>
                    <Text style={styles.statLabel}>Activas</Text>
                </View>
                <View style={styles.statCard}>
                    <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.warning} />
                    <Text style={[styles.statValue, { fontSize: FONT_SIZE.md }]}>{money(totalBalance)}</Text>
                    <Text style={styles.statLabel}>Saldo total</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialIcons name="person" size={16} color={COLORS.text} /> Información Personal
                </Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="badge" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Nombre completo</Text>
                            <Text style={styles.infoValue}>{user?.nombre || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Usuario</Text>
                            <Text style={styles.infoValue}>{user?.username || user?.name || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="email" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Correo electrónico</Text>
                            <Text style={styles.infoValue}>{user?.email || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Teléfono</Text>
                            <Text style={styles.infoValue}>{user?.phone || user?.telefono || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="calendar-today" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Miembro desde</Text>
                            <Text style={styles.infoValue}>{memberSince || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="verified-user" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Estado de verificación</Text>
                            <View style={styles.verifyRow}>
                                <View style={[styles.verifyDot, { backgroundColor: user?.emailVerified ? COLORS.success : COLORS.warning }]} />
                                <Text style={[styles.infoValue, { color: user?.emailVerified ? COLORS.success : COLORS.warning }]}>
                                    {user?.emailVerified ? "Verificado" : "Pendiente"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialIcons name="tune" size={16} color={COLORS.text} /> Preferencias
                </Text>
                <View style={styles.infoCard}>
                    <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={toggleTheme}>
                        <MaterialIcons name={mode === "dark" ? "light-mode" : "dark-mode"} size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Apariencia</Text>
                            <Text style={styles.infoValue}>{mode === "dark" ? "Modo Oscuro" : "Modo Claro"}</Text>
                        </View>
                        <View style={styles.toggleSwitch}>
                            <View style={[styles.toggleCircle, mode === "dark" && styles.toggleCircleDark]} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="language" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Idioma</Text>
                            <Text style={styles.infoValue}>Español (GT)</Text>
                        </View>
                        <MaterialIcons name="check" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="notifications" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Notificaciones</Text>
                            <Text style={styles.infoValue}>Activadas</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialIcons name="security" size={16} color={COLORS.text} /> Seguridad
                </Text>
                <View style={styles.infoCard}>
                    <TouchableOpacity style={styles.infoRow} activeOpacity={0.7} onPress={() => Alert.alert("Próximamente", "La opción de cambiar contraseña estará disponible pronto.")}>
                        <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Cambiar contraseña</Text>
                            <Text style={styles.infoValue}>Último cambio: —</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="devices" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Dispositivos conectados</Text>
                            <Text style={styles.infoValue}>1 dispositivo</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="history" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Actividad de sesión</Text>
                            <Text style={styles.infoValue}>Último acceso: hoy</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialIcons name="info-outline" size={16} color={COLORS.text} /> Acerca de
                </Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="info" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Versión</Text>
                            <Text style={styles.infoValue}>1.0.0 (Build 2024)</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="update" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Última actualización</Text>
                            <Text style={styles.infoValue}>Julio 2024</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="description" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Términos y condiciones</Text>
                            <Text style={styles.infoValue}>Versión 2.1</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="shield" size={20} color={COLORS.textMuted} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Privacidad</Text>
                            <Text style={styles.infoValue}>Política de privacidad</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </View>
            </View>

            <Button
                title="Cerrar sesión"
                variant="secondary"
                onPress={handleLogout}
                style={styles.logoutBtn}
            />

            <Text style={styles.version}>OVA Bank v1.0.0</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 100, alignItems: "center" },
    orbOne: { position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(14,165,233,0.08)" },
    orbTwo: { position: "absolute", bottom: 100, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(52,211,153,0.06)" },
    profileHeader: { alignItems: "center", marginBottom: SPACING.lg, marginTop: SPACING.lg },
    avatarWrap: { position: "relative", marginBottom: SPACING.md },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.primary + "40" },
    avatarBadge: { position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.surface },
    name: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.text },
    email: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: 2 },
    roleRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
    roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary + "15", paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + "30" },
    roleText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: "600" },
    statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg, width: "100%" },
    statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 4, ...SHADOWS.sm },
    statValue: { fontSize: FONT_SIZE.xl, fontWeight: "700", color: COLORS.text },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    section: { width: "100%", marginBottom: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
    infoCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, ...SHADOWS.sm },
    infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: "500", marginTop: 1 },
    divider: { height: 1, backgroundColor: COLORS.border },
    verifyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    verifyDot: { width: 8, height: 8, borderRadius: 4 },
    toggleSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.primary + "40", justifyContent: "center", paddingHorizontal: 2 },
    toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.surface },
    toggleCircleDark: { alignSelf: "flex-end", backgroundColor: COLORS.primary },
    logoutBtn: { marginTop: SPACING.md, width: "100%" },
    version: { marginTop: SPACING.xl, fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});

export default ProfileScreen;
