import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../shared/constants/theme";

import AdminHomeScreen from "../features/admin/screens/AdminHomeScreen";
import AdminUsersScreen from "../features/admin/screens/AdminUsersScreen";
import AdminAccountsScreen from "../features/admin/screens/AdminAccountsScreen";
import AdminCurrenciesScreen from "../features/admin/screens/AdminCurrenciesScreen";
import AdminProductsScreen from "../features/admin/screens/AdminProductsScreen";
import AdminTransactionsScreen from "../features/admin/screens/AdminTransactionsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const createStack = (name, Component) => () => (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name={name} component={Component} />
    </Stack.Navigator>
);

const HomeStack = createStack("AdminHomeMain", AdminHomeScreen);
const UsersStack = createStack("UsersMain", AdminUsersScreen);
const AccountsStack = createStack("AccountsMain", AdminAccountsScreen);
const CurrenciesStack = createStack("CurrenciesMain", AdminCurrenciesScreen);
const ProductsStack = createStack("ProductsMain", AdminProductsScreen);
const TransactionsStack = createStack("TransactionsMain", AdminTransactionsScreen);

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
        const icons = {
            Home: "dashboard",
            Users: "people",
            Accounts: "account-balance",
            Currencies: "currency-exchange",
            Products: "card-giftcard",
            Transactions: "swap-horiz",
        };
        return <MaterialIcons name={icons[route.name] || "circle"} size={size} color={color} />;
    },
});

const AdminTabs = () => {
    return (
        <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen name="Home" component={HomeStack} options={{ title: "Inicio" }} />
            <Tab.Screen name="Users" component={UsersStack} options={{ title: "Usuarios" }} />
            <Tab.Screen name="Accounts" component={AccountsStack} options={{ title: "Cuentas" }} />
            <Tab.Screen name="Currencies" component={CurrenciesStack} options={{ title: "Divisas" }} />
            <Tab.Screen name="Products" component={ProductsStack} options={{ title: "Productos" }} />
            <Tab.Screen name="Transactions" component={TransactionsStack} options={{ title: "Movimientos" }} />
        </Tab.Navigator>
    );
};

export default AdminTabs;
