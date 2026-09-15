import { useState, useRef, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { openWalletForVerification, pollVPStatus, getVPResult } from "../services/verifyService";

type Session = { requestId: string; transactionId: string };

type VerificationState = {
  loading: boolean;
  status: string | null;
  error: string | null;
};

type VerificationActions = {
  handleVerify: () => Promise<void>;
  onBack: () => void;
};

type Callbacks = {
  onSuccess: (requestId: string) => void;
  onUnderage: () => void;
  onBack: () => void;
};

export function useAgeVerification({ onSuccess, onUnderage, onBack }: Callbacks): VerificationState & VerificationActions {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const pollingRef = useRef(false);

  const startPolling = useCallback(async (requestId: string, transactionId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setStatus("Aguardando resposta do wallet…");

    try {
      while (pollingRef.current) {
        const vpStatus = await pollVPStatus(requestId);

        if (vpStatus === "VP_SUBMITTED") {
          pollingRef.current = false;
          setStatus("Verificando credencial…");
          try {
            const result = await getVPResult(transactionId);
            if (result.verified) {
              onSuccess(requestId);
            } else if (result.underage) {
              onUnderage();
            }
          } catch (resultErr: any) {
            console.error("[useAgeVerification] getVPResult failed:", resultErr);
            setError(`Erro ao obter resultado: ${resultErr?.message}`);
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

        // status === "ACTIVE" — continue polling
      }
    } catch {
      pollingRef.current = false;
      setError("Erro ao verificar status. Tente novamente.");
      setLoading(false);
      setStatus(null);
    }
  }, [onSuccess, onUnderage]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && sessionRef.current) {
        pollingRef.current = false;
        setError(null);
        setLoading(true);
        startPolling(sessionRef.current.requestId, sessionRef.current.transactionId);
      }
    });
    return () => {
      subscription.remove();
      pollingRef.current = false;
    };
  }, [startPolling]);

  const handleVerify = useCallback(async () => {
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
  }, [startPolling]);

  const handleBack = useCallback(() => {
    pollingRef.current = false;
    onBack();
  }, [onBack]);

  return { loading, status, error, handleVerify, onBack: handleBack };
}
