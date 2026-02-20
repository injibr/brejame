// Mock backend — simula chamadas de API com delay
// Altere SIMULATE_FAILURE para true para testar o fluxo de erro
const SIMULATE_FAILURE = false;

export function verifyAge(): Promise<{ ok: boolean; requestId: string }> {
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ok: !SIMULATE_FAILURE, requestId });
    }, 1200);
  });
}
