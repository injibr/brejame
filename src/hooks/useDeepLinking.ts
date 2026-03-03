import { useEffect, useRef, useCallback } from "react";
import * as Linking from "expo-linking";

type DeepLinkListener = (url: string) => void;

export function useDeepLinking() {
  const listenerRef = useRef<ReturnType<typeof Linking.addEventListener> | null>(null);

  useEffect(() => {
    return () => listenerRef.current?.remove();
  }, []);

  const setupListener = useCallback((callback: DeepLinkListener) => {
    listenerRef.current?.remove();
    listenerRef.current = Linking.addEventListener("url", ({ url }) => callback(url));
  }, []);

  const removeListener = useCallback(() => {
    listenerRef.current?.remove();
    listenerRef.current = null;
  }, []);

  return { setupListener, removeListener };
}
