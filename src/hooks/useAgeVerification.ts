import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { createVPRequest, pollAndFetchResult } from "../services/mockBackend";
import { useDeepLinking } from "./useDeepLinking";

type VerificationResult = {
  requestId: string;
  isOver18: boolean;
} | { underage: true };

export function useAgeVerification() {
  const [waiting, setWaiting] = useState(false);
  const { setupListener, removeListener } = useDeepLinking();

  const handleCancellation = useCallback(() => {
    removeListener();
    setWaiting(false);
  }, [removeListener]);

  const verify = useCallback(async (): Promise<VerificationResult | null> => {
    setWaiting(true);
    try {
      const { requestId, transactionId, nonce } = await createVPRequest();

      setupListener((url) => {
        if (Linking.parse(url).queryParams?.verified === "false") {
          handleCancellation();
        }
      });

      await Linking.openURL(
        `injiwalletrefreact://carteira?origin=brejame%3A%2F%2F&requestId=${requestId}&nonce=${nonce}`
      );

      const result = await pollAndFetchResult(requestId, transactionId);
      removeListener();

      if (!result) {
        setWaiting(false);
        Alert.alert('Verificação expirada', 'Tente novamente.');
        return null;
      }

      return result.isOver18 
        ? { requestId, isOver18: true }
        : { underage: true };
    } catch (e) {
      setWaiting(false);
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível iniciar a verificação.');
      return null;
    }
  }, [setupListener, removeListener, handleCancellation]);

  return { verify, waiting };
}
