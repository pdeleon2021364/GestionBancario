import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect } from "react";
import { COLORS } from "../shared/constants/theme";
import AuthStack from "./AuthStack";
import BancoTabs from "./BancoTabs";
import AdminTabs from "./AdminTabs";
import { useAuthStore } from "../shared/store/authStore";
import { useCurrencyStore } from "../shared/store/useCurrencyStore";

const AppNavigator = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const isHydrated = useAuthStore((state) => state._hasHydrated);
    const fetchCurrencies = useCurrencyStore((s) => s.fetchCurrencies);
    const fetchExchangeRates = useCurrencyStore((s) => s.fetchExchangeRates);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCurrencies().catch(() => {});
            fetchExchangeRates().catch(() => {});
        }
    }, [isAuthenticated]);

    if (!isHydrated) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const isAdmin = user?.role === "ADMIN_ROLE";

    return (
        <NavigationContainer>
            {isAuthenticated ? (isAdmin ? <AdminTabs /> : <BancoTabs />) : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },
});

export default AppNavigator;
