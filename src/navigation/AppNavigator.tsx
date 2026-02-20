import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StorefrontScreen from "../screens/StorefrontScreen";
import AgeCheckScreen from "../screens/AgeCheckScreen";
import SuccessScreen from "../screens/SuccessScreen";

export type RootStackParamList = {
  Storefront: undefined;
  AgeCheck: undefined;
  Success: { requestId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Storefront" component={StorefrontScreen} />
      <Stack.Screen name="AgeCheck" component={AgeCheckScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}
