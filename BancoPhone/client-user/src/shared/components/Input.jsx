
import { TextInput, View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "../constants/theme"

const Input = ({ label, error, containerStyle, inputStyle, ...props}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError, inputStyle]}
                placeholderTextColor={COLORS.textMuted}
                {...props}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        width: "100%",
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: "600",
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
        letterSpacing: 0.3,
    },
    input: {
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.xs,
        marginTop: SPACING.xs,
    },
});

export default Input;