import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/config/reactotron";

const linking = {
  prefixes: [Linking.createURL("/"), "brejame://"],
  config: { screens: {} },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  );
}
