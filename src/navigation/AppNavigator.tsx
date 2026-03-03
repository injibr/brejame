import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StorefrontScreen from "../screens/StorefrontScreen";
import AgeCheckScreen from "../screens/AgeCheckScreen";
import SuccessScreen from "../screens/SuccessScreen";
import UnderageScreen from "../screens/UnderageScreen";

export type RootStackParamList = {
  Storefront: undefined;
  AgeCheck: undefined;
  Success: { requestId: string; isOver18: boolean };
  Underage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Storefront" component={StorefrontScreen} />
      <Stack.Screen name="AgeCheck" component={AgeCheckScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="Underage" component={UnderageScreen} />
    </Stack.Navigator>
  );
}
