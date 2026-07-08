import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from "react-native-safe-area-context"
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from "./src/shared/context/ThemeContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
