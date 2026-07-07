import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../shared/constants/theme";

import HomeScreen from "../features/banco/screens/HomeScreen";
import AccountsScreen from "../features/banco/screens/AccountsScreen";
import AccountDetailScreen from "../features/banco/screens/AccountDetailScreen";
import TransactionsScreen from "../features/banco/screens/TransactionsScreen";
import CurrenciesScreen from "../features/banco/screens/CurrenciesScreen";
import ExchangeRatesScreen from "../features/banco/screens/ExchangeRatesScreen";
import ProductsScreen from "../features/banco/screens/ProductsScreen";
import ProfileScreen from "../features/banco/screens/ProfileScreen";
import FavoritesScreen from "../features/banco/screens/FavoritesScreen";
import SavingsGoalsScreen from "../features/banco/screens/SavingsGoalsScreen";
import ScheduledTransfersScreen from "../features/banco/screens/ScheduledTransfersScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
        }}
    >
        <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
);

const AccountsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.surface },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: COLORS.background },
        }}
    >
        <Stack.Screen
            name="AccountsList"
            component={AccountsScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="AccountDetail"
            component={AccountDetailScreen}
            options={{ title: "Detalle de Cuenta" }}
        />
    </Stack.Navigator>
);

const TransactionsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
        }}
    >
        <Stack.Screen name="TransactionsMain" component={TransactionsScreen} />
    </Stack.Navigator>
);

const CurrenciesStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
        }}
    >
        <Stack.Screen name="CurrenciesMain" component={CurrenciesScreen} />
        <Stack.Screen
            name="ExchangeRates"
            component={ExchangeRatesScreen}
            options={{ title: "Tipos de Cambio" }}
        />
    </Stack.Navigator>
);

const MoreStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
        }}
    >
        <Stack.Screen name="ProductsMain" component={ProductsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favoritos" }} />
        <Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} options={{ title: "Metas" }} />
        <Stack.Screen name="ScheduledTransfers" component={ScheduledTransfersScreen} options={{ title: "Programadas" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
);

const screenOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textMuted,
    tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
    },
    tabBarIcon: ({ color, size }) => {
        let iconName;
        switch (route.name) {
            case "Home":
                iconName = "home";
                break;
            case "Accounts":
                iconName = "account-balance";
                break;
            case "Transactions":
                iconName = "swap-horiz";
                break;
            case "Currencies":
                iconName = "currency-exchange";
                break;
            case "More":
                iconName = "more-horiz";
                break;
            default:
                iconName = "circle";
        }
        return <MaterialIcons name={iconName} size={size} color={color} />;
    },
});

const BancoTabs = () => {
    return (
        <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ title: "Inicio" }}
            />
            <Tab.Screen
                name="Accounts"
                component={AccountsStack}
                options={{ title: "Cuentas" }}
            />
            <Tab.Screen
                name="Transactions"
                component={TransactionsStack}
                options={{ title: "Movimientos" }}
            />
            <Tab.Screen
                name="Currencies"
                component={CurrenciesStack}
                options={{ title: "Divisas" }}
            />
            <Tab.Screen
                name="More"
                component={MoreStack}
                options={{ title: "Más" }}
            />
        </Tab.Navigator>
    );
};

export default BancoTabs;
