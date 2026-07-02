import React from "react";
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme.js";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useAuth } from "../hooks/useAuth.js";

const RegisterScreen = ({ navigation }) => {
    const { handleRegister, loading } = useAuth()
    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            surname: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
        },
    });

    const password = watch("password")

    const onSubmit = async (data) => {
        try {
            const { confirmPassword, ...rest } = data
            const result = await handleRegister(rest)

            const successMessage = result?.emailVerificationRequired
                ? "Tu cuenta ha sido creada. Revisa tu correo y verifica tu email antes de iniciar sesión."
                : "Tu cuenta ha sido creada. Ahora puedes iniciar sesión"

            Alert.alert(
                "Registro exitoso",
                successMessage,
                [{ text: "OK", onPress: () => navigation.navigate("Login") }]
            )
        } catch (error) {
            console.error(error)
            const message = error.message || "Error al registrarse"
            Alert.alert("Error", message)
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.orbOne} />
                <View style={styles.orbTwo} />

                <View style={styles.card}>
                    <View style={styles.header}>
                        <MaterialIcons name="account-balance" size={48} color={COLORS.primary} />
                        <Text style={styles.title}>Crear cuenta</Text>
                        <Text style={styles.subtitle}>Completa tu información para empezar</Text>
                    </View>

                    <Controller
                        control={control}
                        rules={{
                            required: "Nombre requerido",
                            minLength: { value: 2, message: "Mínimo 2 caracteres" },
                            maxLength: { value: 25, message: "Máximo 25 caracteres" },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Nombre"
                                placeholder="Tu nombre"
                                onChangeText={onChange}
                                value={value}
                                error={errors.name?.message}
                            />
                        )}
                        name="name"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Apellido requerido",
                            minLength: { value: 2, message: "Mínimo 2 caracteres" },
                            maxLength: { value: 25, message: "Máximo 25 caracteres" },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Apellido"
                                placeholder="Tu apellido"
                                onChangeText={onChange}
                                value={value}
                                error={errors.surname?.message}
                            />
                        )}
                        name="surname"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Usuario requerido",
                            minLength: { value: 3, message: "Mínimo 3 caracteres" },
                            pattern: {
                                value: /^[a-zA-Z0-9_]+$/,
                                message: "Solo letras, números y guion bajo",
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Nombre de usuario"
                                placeholder="juanperez123"
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                                error={errors.username?.message}
                            />
                        )}
                        name="username"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Teléfono requerido",
                            pattern: {
                                value: /^\d{8}$/,
                                message: "Debe tener exactamente 8 dígitos",
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Teléfono"
                                placeholder="Ej: 12345678"
                                keyboardType="numeric"
                                onChangeText={onChange}
                                value={value}
                                error={errors.phone?.message}
                            />
                        )}
                        name="phone"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Email requerido",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Email inválido",
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Email"
                                placeholder="correo@ejemplo.com"
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                error={errors.email?.message}
                            />
                        )}
                        name="email"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Contraseña requerida",
                            minLength: { value: 8, message: "Mínimo 8 caracteres" },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
                                message: "Debe incluir mayúscula, minúscula, número y símbolo",
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                error={errors.password?.message}
                            />
                        )}
                        name="password"
                    />

                    <Controller
                        control={control}
                        rules={{
                            required: "Confirma tu contraseña",
                            validate: (value) => value === password || "Las contraseñas no coinciden",
                        }}
                        render={({ field: { onChange, value } }) => (
                            <Input
                                label="Confirmar contraseña"
                                placeholder="••••••••"
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                error={errors.confirmPassword?.message}
                            />
                        )}
                        name="confirmPassword"
                    />

                    <Button
                        title="Crear cuenta"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
                        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
                            Inicia sesión
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.xl,
        paddingVertical: SPACING.xxl,
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
        height: 48,
        width: 48,
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
        textAlign: "center",
        letterSpacing: 0.3,
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

export default RegisterScreen;
