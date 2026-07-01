import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useAuth } from "../hooks/useAuth.js";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from "../../../shared/constants/theme.js";

const VerifyEmailScreen = ({ navigation }) => {
    const { verifyEmail, resendVerification, loading } = useAuth();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");

    const handleVerify = async () => {
        if (!token.trim()) {
            return Alert.alert("Error", "Ingresa el código de verificación desde tu correo.");
        }
        try {
            await verifyEmail(token.trim());
            Alert.alert(
                "Verificación exitosa",
                "Tu email ha sido verificado. Ahora puedes iniciar sesión.",
                [{ text: "OK", onPress: () => navigation.navigate("Login") }]
            );
        } catch (error) {
            const message = error.response?.data?.message || "Error al verificar el email.";
            Alert.alert("Error", message);
        }
    };

    const handleResend = async () => {
        if (!email.trim()) {
            return Alert.alert("Error", "Ingresa el correo con el que te registraste.");
        }
        try {
            await resendVerification(email.trim());
            Alert.alert("Enviado", "El correo de verificación ha sido reenviado.");
        } catch (error) {
            const message = error.response?.data?.message || "Error al reenviar el correo.";
            Alert.alert("Error", message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Verificar correo</Text>
                <Text style={styles.subtitle}>
                    Copia el token que recibiste en el correo y pégalo aquí.
                </Text>

                <Input
                    label="Token de verificación"
                    placeholder="Pega aquí el código del correo"
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    error={null}
                />

                <Button
                    title="Verificar correo"
                    onPress={handleVerify}
                    loading={loading}
                    style={styles.button}
                />

                <View style={styles.divider} />

                <Text style={styles.subtitle}>¿No recibiste el correo o no puedes usar el link?</Text>

                <Input
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={null}
                />

                <Button
                    title="Reenviar email"
                    variant="secondary"
                    onPress={handleResend}
                    loading={loading}
                    style={styles.button}
                />

                <Text style={styles.helperText}>
                    Si el link no funciona en tu celular, copia el token que viene después de "token=" en el correo y pégalo en el campo de verificación.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: SPACING.xl,
        justifyContent: "center",
        backgroundColor: COLORS.background,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.xl,
        ...SHADOWS.md,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondary,
        marginBottom: SPACING.md,
    },
    button: {
        marginTop: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.lg,
    },
    helperText: {
        color: COLORS.textLight,
        fontSize: FONT_SIZE.xs,
        marginTop: SPACING.md,
        lineHeight: 20,
    },
});

export default VerifyEmailScreen;
