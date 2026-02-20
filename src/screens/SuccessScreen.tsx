import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Success">;

export default function SuccessScreen({ navigation, route }: Props) {
  const { requestId } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Idade verificada</Text>
        <Text style={styles.subtitle}>Pedido liberado para compra.</Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.buttonText}>Voltar para vitrine</Text>
        </Pressable>

        <Text style={styles.requestId}>requestId: {requestId}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#16A34A" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderWidth: 4,
    borderColor: "#000",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  check: {
    fontSize: 72,
    fontWeight: "900",
    color: "#16A34A",
    marginTop: -4,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF",
    marginTop: 32,
  },
  subtitle: {
    fontSize: 18,
    color: "#D1FAE5",
    marginTop: 8,
    fontWeight: "600",
  },
  button: {
    marginTop: 48,
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  buttonPressed: {
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  requestId: {
    position: "absolute",
    bottom: 24,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
});
