import React, { useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { useFields } from "../hooks/useFields.js";
import {
    COLORS,
    SPACING,
    FONT_SIZE,
    SHADOWS,
} from "../../../shared/constants/theme.js";
import {
    LoadingSpinner,
    EmptyState,
    Card,
} from "../../../shared/components/Common.jsx";

const FieldCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <Card style={styles.card}>
            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
            )}
            <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.info}>{item.location}</Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>Q{item.pricePerHour || 0} / hr</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            item.isAvailable ? styles.available : styles.unavailable,
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {item.isAvailable ? "Disponible" : "Ocupada"}
                        </Text>
                    </View>
                </View>
            </View>
        </Card>
    </TouchableOpacity>
);

const FieldsScreen = ({ navigation }) => {
    const { fields, loading, error, getFields } = useFields();

    const onRefresh = useCallback(() => {
        getFields();
    }, [getFields]);

    if (loading && !fields.length) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            {error && !fields.length ? (
                <EmptyState message={error} />
            ) : (
                <FlatList
                    data={fields}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <FieldCard
                            item={item}
                            onPress={() =>
                                navigation.navigate("FieldDetail", { field: item })
                            }
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <EmptyState message="No hay canchas disponibles" />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: SPACING.md,
    },
    cardContainer: {
        marginBottom: SPACING.md,
    },
    card: {
        padding: 0,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: 180,
    },
    placeholderImage: {
        backgroundColor: "#cbd5e1",
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        color: "#64748b",
        fontWeight: "600",
    },
    details: {
        padding: SPACING.md,
    },
    name: {
        fontSize: FONT_SIZE.lg,
        fontWeight: "700",
        color: COLORS.text,
    },
    info: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondary,
        marginTop: 2,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: SPACING.md,
    },
    price: {
        fontSize: FONT_SIZE.md,
        fontWeight: "700",
        color: COLORS.primary,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 6,
    },
    available: {
        backgroundColor: COLORS.success + "20",
    },
    unavailable: {
        backgroundColor: COLORS.error + "20",
    },
    statusText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: "700",
        color: COLORS.text,
    },
});

export default FieldsScreen;
