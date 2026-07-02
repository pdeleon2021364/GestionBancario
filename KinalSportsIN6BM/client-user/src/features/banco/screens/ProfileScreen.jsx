import { View, Text, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme";
import { useAuthStore } from "../../../shared/store/authStore";
import Button from "../../../shared/components/Button";
import avatarDefault from "../../../../assets/avatarDefault.png";

const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);

    const handleLogout = () => {
        Alert.alert("Cerrar sesión", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar sesión", style: "destructive", onPress: () => useAuthStore.getState().logout() },
        ]);
    };

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll}>
            <View style={styles.orbOne} />

            <View style={styles.profileHeader}>
                <Image
                    source={user?.profilePicture ? { uri: user.profilePicture } : avatarDefault}
                    style={styles.avatar}
                    defaultSource={avatarDefault}
                />
                <Text style={styles.name}>{user?.nombre || "Usuario"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                <View style={styles.roleBadge}>
                    <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                    <Text style={styles.roleText}>{user?.role || "USER"}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información</Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="person" size={20} color={COLORS.textMuted} />
                        <View>
                            <Text style={styles.infoLabel}>Nombre</Text>
                            <Text style={styles.infoValue}>{user?.nombre || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="email" size={20} color={COLORS.textMuted} />
                        <View>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{user?.email || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="badge" size={20} color={COLORS.textMuted} />
                        <View>
                            <Text style={styles.infoLabel}>Rol</Text>
                            <Text style={styles.infoValue}>{user?.role || "—"}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <MaterialIcons name="verified-user" size={20} color={COLORS.textMuted} />
                        <View>
                            <Text style={styles.infoLabel}>Email verificado</Text>
                            <Text style={[styles.infoValue, { color: user?.emailVerified ? COLORS.success : COLORS.warning }]}>
                                {user?.emailVerified ? "Sí" : "No"}
                            </Text>
                        </View>
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
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        padding: SPACING.lg,
        paddingBottom: 100,
        alignItems: "center",
    },
    orbOne: {
        position: "absolute",
        top: -60,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(14,165,233,0.08)",
    },
    profileHeader: {
        alignItems: "center",
        marginBottom: SPACING.xl,
        marginTop: SPACING.lg,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: COLORS.borderStrong,
        marginBottom: SPACING.md,
    },
    name: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: "700",
        color: COLORS.text,
    },
    email: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        marginTop: 2,
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: SPACING.sm,
        backgroundColor: COLORS.primary + "15",
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + "30",
    },
    roleText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: "600",
    },
    section: {
        width: "100%",
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
    },
    infoLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    infoValue: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    logoutBtn: {
        marginTop: SPACING.md,
    },
    version: {
        marginTop: SPACING.xl,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
});

export default ProfileScreen;
