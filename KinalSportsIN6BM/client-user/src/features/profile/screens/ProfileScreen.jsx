import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { COLORS, SPACING, FONT_SIZE } from "../../../shared/constants/theme.js";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";

import avatarDefault from "../../../../assets/avatarDefault.png"
import { Card } from "../../../shared/components/Common.jsx";
import { useAuthStore } from "../../../shared/store/authStore.js";

const ProfileScreen = () => {
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            displayName: "",
            phone: "",
            favoriteSports: "",
        },
    });


    const onSubmit = async (data) => {

    };

    const handleLogout = () => {
        Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas salir?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Aceptar", onPress: () => logout() },
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.actions}>
                    <Button
                        title="Cerrar Sesión"
                        variant="secondary"
                        onPress={handleLogout}
                    />
                </View>
                <Text style={styles.version}>Kinal Sports v1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingVertical: SPACING.xxl,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    userName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: "700",
        color: COLORS.text,
    },
    userHandle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.secondary,
    },
    content: {
        padding: SPACING.lg,
    },
    profileCard: {
        marginBottom: SPACING.xl,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: "700",
        color: COLORS.text,
    },
    editBtn: {
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        fontWeight: "700",
    },
    readOnly: {
        backgroundColor: "#f1f5f9",
        color: COLORS.secondary,
    },
    actions: {
        marginTop: SPACING.sm,
    },
    version: {
        textAlign: "center",
        marginTop: SPACING.xxl,
        color: COLORS.textLight,
        paddingBottom: SPACING.xl,
        fontSize: FONT_SIZE.xs,
    },
});

export default ProfileScreen;
