import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  openWalletForVerification,
  pollVPStatus,
  getVPResult,
} from "../services/verifyService";

type Props = NativeStackScreenProps<RootStackParamList, "AgeCheck">;

export default function AgeCheckScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<{ requestId: string; transactionId: string } | null>(null);
  const pollingRef = useRef(false);

  async function startPolling(requestId: string, transactionId: string) {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setStatus("Aguardando resposta do wallet…");

    try {
      while (pollingRef.current) {
        const vpStatus = await pollVPStatus(requestId);

        if (vpStatus === "VP_SUBMITTED") {
          setStatus("Verificando credencial…");
          const result = await getVPResult(transactionId);
          pollingRef.current = false;

          if (result.verified) {
            navigation.replace("Success", { requestId });
          } else {
            setError("Credencial inválida. Verificação de idade falhou.");
            setLoading(false);
            setStatus(null);
          }
          return;
        }

        if (vpStatus === "EXPIRED") {
          pollingRef.current = false;
          setError("Sessão expirada. Tente novamente.");
          setLoading(false);
          setStatus(null);
          return;
        }

        // status === "ACTIVE" — continue polling (long-polling, server holds connection)
      }
    } catch {
      pollingRef.current = false;
      setError("Erro ao verificar status. Tente novamente.");
      setLoading(false);
      setStatus(null);
    }
  }

  // When app comes back to foreground, resume polling
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && sessionRef.current && !pollingRef.current) {
        startPolling(sessionRef.current.requestId, sessionRef.current.transactionId);
      }
    });
    return () => {
      subscription.remove();
      pollingRef.current = false;
    };
  }, []);

  async function handleVerify() {
    setLoading(true);
    setError(null);
    setStatus("Abrindo wallet…");

    try {
      const { transactionId, requestId } = await openWalletForVerification();
      sessionRef.current = { requestId, transactionId };
      startPolling(requestId, transactionId);
    } catch (e: any) {
      setError(e.message || "Erro ao conectar com o wallet.");
      setLoading(false);
      setStatus(null);
    }
  }

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

        <Text style={styles.note}>
          A verificação é feita via credencial digital (Inji Wallet).
        </Text>

        {status && (
          <Text style={styles.statusText}>{status}</Text>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && !loading && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.buttonText}> Verificando…</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Verificar Idade</Text>
          )}
        </Pressable>

        <Pressable onPress={() => { pollingRef.current = false; navigation.goBack(); }} style={styles.backLink}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F0" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: "center",
  },
  iconBox: {
    borderWidth: 3,
    borderColor: "#000",
    padding: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1A1A1A",
    textAlign: "center",
  },
  body: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  note: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  statusText: {
    fontSize: 14,
    color: "#FF5A1F",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  errorBox: {
    marginTop: 20,
    backgroundColor: "#DC2626",
    borderWidth: 3,
    borderColor: "#000",
    padding: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  errorText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  button: {
    marginTop: 40,
    backgroundColor: "#FF5A1F",
    paddingVertical: 18,
    paddingHorizontal: 48,
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
  buttonDisabled: {
    backgroundColor: "#CC4816",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },
  backLink: { marginTop: 24, padding: 8 },
  backText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
});
