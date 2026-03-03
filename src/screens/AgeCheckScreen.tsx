import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useAgeVerification } from "../hooks/useAgeVerification";
import { LoadingOverlay } from "../components/LoadingOverlay";

type Props = NativeStackScreenProps<RootStackParamList, "AgeCheck">;

export default function AgeCheckScreen({ navigation }: Props) {
  const { verify, waiting } = useAgeVerification();

  const handleVerificar = async () => {
    const result = await verify();
    if (!result) return;

    if ('underage' in result) {
      navigation.replace("Underage");
    } else {
      navigation.replace("Success", { requestId: result.requestId, isOver18: true });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🍺</Text>
        </View>
        <Text style={styles.title}>Verificação de idade</Text>
        <Text style={styles.body}>
          Para comprar bebida alcoólica, você precisa ter 18 anos ou mais.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleVerificar}
          disabled={waiting}
        >
          <Text style={styles.buttonText}>Verificar Idade</Text>
        </Pressable>
        <LoadingOverlay visible={waiting} />
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F0" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: "center" },
  iconBox: {
    borderWidth: 3, borderColor: "#000", padding: 16, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 8, marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: "900", color: "#1A1A1A", textAlign: "center" },
  body: { fontSize: 18, color: "#333", textAlign: "center", marginTop: 20, lineHeight: 26, paddingHorizontal: 8 },
  button: {
    marginTop: 40, backgroundColor: "#FF5A1F", paddingVertical: 18, paddingHorizontal: 48,
    borderWidth: 3, borderColor: "#000", shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
  },
  buttonPressed: { shadowOffset: { width: 1, height: 1 }, transform: [{ translateX: 3 }, { translateY: 3 }] },
  buttonText: { fontSize: 22, fontWeight: "900", color: "#FFF", letterSpacing: 1 },
  backLink: { marginTop: 24, padding: 8 },
  backText: { fontSize: 16, color: "#666", fontWeight: "600" },
});
