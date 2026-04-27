import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { requestOtpToken, verifyOtpToken } from "../services/verifyService";
import { useDeepLinking } from "../hooks/useDeepLinking";

type Props = NativeStackScreenProps<RootStackParamList, "OtpCheck">;

type Status = "idle" | "waiting" | "verifying" | "error";

export default function OtpCheckScreen({ navigation }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const pendingNonceRef = useRef<string | null>(null);
  const { setupListener, removeListener } = useDeepLinking();

  useEffect(() => {
    return () => {
      removeListener();
      pendingNonceRef.current = null;
    };
  }, []);

  async function handleOtpCallback(url: string) {
    if (!url.startsWith("brejame://otp-result")) return;

    removeListener();

    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token as string | undefined;

    if (!token) {
      setError("Token não recebido. Tente novamente.");
      setStatus("error");
      return;
    }

    setStatus("verifying");
    try {
      const result = await verifyOtpToken(token);
      if (result.verified) {
        navigation.replace("Success", { requestId: pendingNonceRef.current ?? "" });
      } else {
        navigation.replace("Underage");
      }
    } catch (e: any) {
      setError(e.message ?? "Erro ao verificar token.");
      setStatus("error");
    }
  }

  async function handleRequest() {
    setStatus("waiting");
    setError(null);

    try {
      const nonce = await requestOtpToken();
      pendingNonceRef.current = nonce;

      // Escuta o retorno do guarda-app
      setupListener((url) => handleOtpCallback(url));

      // Também verifica URL inicial caso o app já estivesse aberto
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleOtpCallback(initialUrl);
    } catch (e: any) {
      setError(e.message ?? "Erro ao abrir wallet.");
      setStatus("error");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔑</Text>
        </View>

        <Text style={styles.title}>Verificação de idade</Text>
        <Text style={styles.body}>
          Clique no botão abaixo para gerar um token de verificação via Inji Wallet.
        </Text>
        <Text style={styles.note}>
          Você será redirecionado para o app da carteira digital.
        </Text>

        {status === "waiting" && (
          <>
            <ActivityIndicator color="#FF5A1F" size="large" style={{ marginTop: 24 }} />
            <Text style={styles.statusText}>Aguardando retorno do wallet…</Text>
          </>
        )}

        {status === "verifying" && (
          <>
            <ActivityIndicator color="#FF5A1F" size="large" style={{ marginTop: 24 }} />
            <Text style={styles.statusText}>Verificando token…</Text>
          </>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {(status === "idle" || status === "error") && (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleRequest}
          >
            <Text style={styles.buttonText}>Gerar Token</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => { removeListener(); navigation.goBack(); }}
          style={styles.backLink}
        >
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
  body: {
    fontSize: 18, color: "#333", textAlign: "center",
    marginTop: 20, lineHeight: 26, paddingHorizontal: 8,
  },
  note: {
    fontSize: 13, color: "#999", textAlign: "center",
    marginTop: 12, fontStyle: "italic",
  },
  statusText: {
    fontSize: 14, color: "#FF5A1F", textAlign: "center",
    marginTop: 12, fontWeight: "600",
  },
  errorBox: {
    marginTop: 20, backgroundColor: "#DC2626", borderWidth: 3,
    borderColor: "#000", padding: 12, width: "100%",
    shadowColor: "#000", shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  errorText: { color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
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
