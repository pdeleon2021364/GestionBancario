
import {
    View,
    Text,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
} from "react-native"

import { useForm, Controller } from "react-hook-form"
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme"
import Input from "../../../shared/components/Input"
import Button from "../../../shared/components/Button"
import { useAuth } from "../hooks/useAuth"

import kinalSportsLogo from "../../../../assets/kinal_sports.png"

const LoginScreen = ({ navigation }) => {
    const { handleLogin, loading } = useAuth();

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            emailOrUsername: "",
            password: "",
        },
    })

    const onSubmit = async (data) => {
        try {
            await handleLogin(data)
        } catch (error) {
            console.error(error)
            const message = error.response?.data?.message || "Error al iniciar sesión"
            Alert.alert("Error", message)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.orbOne} />
                <View style={styles.orbTwo} />
                <View style={styles.orbThree} />

                <View style={styles.card}>
                    <View style={styles.header}>
                        <Image source={kinalSportsLogo} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.title}>OVA Bank</Text>
                        <Text style={styles.subtitle}>Portal de acceso seguro</Text>
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton}>
                            <Text style={styles.socialText}>Twitter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>O CON TU CORREO</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Controller
                        control={control}
                        rules={{ required: "Email o usuario requerido" }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Correo o usuario"
                                placeholder="correo@ejemplo.com o usuario"
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                                error={errors.emailOrUsername?.message}
                            />
                        )}
                        name="emailOrUsername"
                    />

                    <Controller
                        control={control}
                        rules={{ required: "Contraseña requerida" }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                                error={errors.password?.message}
                            />
                        )}
                        name="password"
                    />

                    <View style={styles.actionsRow}>
                        <Text style={styles.helperText}>¿Olvidaste tu contraseña?</Text>
                    </View>

                    <Button
                        title="Iniciar sesión"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta?</Text>
                        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
                            Regístrate
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.xl,
        justifyContent: "center",
    },
    orbOne: {
        position: "absolute",
        top: -80,
        left: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(14,165,233,0.16)",
    },
    orbTwo: {
        position: "absolute",
        bottom: -70,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(34,211,238,0.12)",
    },
    orbThree: {
        position: "absolute",
        top: "40%",
        right: -10,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(56,189,248,0.08)",
    },
    card: {
        backgroundColor: "rgba(4, 22, 40, 0.9)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.xl,
        ...SHADOWS.md,
    },
    header: {
        alignItems: "center",
        marginBottom: SPACING.xl,
    },
    logo: {
        height: 74,
        width: 180,
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        color: COLORS.text,
        fontWeight: "700",
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        letterSpacing: 0.3,
    },
    socialRow: {
        flexDirection: "row",
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    socialButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    socialText: {
        color: COLORS.textLight,
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(14,165,233,0.12)",
    },
    dividerText: {
        marginHorizontal: SPACING.sm,
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.xs,
        letterSpacing: 0.18,
    },
    actionsRow: {
        alignItems: "flex-end",
        marginBottom: SPACING.sm,
    },
    helperText: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.xs,
    },
    button: {
        marginTop: SPACING.sm,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: SPACING.xl,
    },
    footerText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
    },
    link: {
        fontSize: FONT_SIZE.md,
        color: COLORS.secondary,
        fontWeight: "700",
        marginLeft: SPACING.xs,
    },
});

export default LoginScreen;