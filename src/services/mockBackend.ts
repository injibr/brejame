const BASE_URL = 'https://injiverify.credenciaisverificaveis-hml.dataprev.gov.br';

const PRESENTATION_DEFINITION = {
  id: 'eca-age-check',
  input_descriptors: [{
    id: 'ECACredential',
    name: 'Comprovante de Maioridade',
    purpose: 'Verificar que o usuário é maior de 18 anos',
    constraints: { fields: [{ path: ['$.type'], filter: { type: 'string', pattern: 'ECACredential' } }] },
  }],
};

const POLL_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 120000;

export type VPRequestResult = {
  requestId: string;
  transactionId: string;
  nonce: string;
  presentationDefinition: object;
  responseUri: string;
};

export async function createVPRequest(): Promise<VPRequestResult> {
  const res = await fetch(`${BASE_URL}/v1/verify/vp-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: BASE_URL, presentationDefinition: PRESENTATION_DEFINITION }),
  });
  if (!res.ok) throw new Error(`VP request creation failed: ${res.status}`);
  const { requestId, transactionId, authorizationDetails } = await res.json();
  return {
    requestId,
    transactionId,
    nonce: authorizationDetails.nonce,
    presentationDefinition: authorizationDetails.presentationDefinition,
    responseUri: `${BASE_URL}/v1/verify/vp-submission/direct-post`,
  };
}

export type VPResult = {
  isOver18: boolean;
  transactionId: string;
};

async function checkStatus(requestId: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/v1/verify/vp-request/${requestId}/status`);
  if (!res.ok) return null;
  return (await res.json()).status;
}

async function fetchResult(transactionId: string): Promise<VPResult | null> {
  const res = await fetch(`${BASE_URL}/v1/verify/vp-result/${transactionId}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.vpResultStatus !== 'SUCCESS') return null;
  const vc = JSON.parse(data.vcResults[0].vc);
  return { isOver18: vc.credential.credentialSubject.isOver18 === true, transactionId };
}

export async function pollAndFetchResult(
  requestId: string,
  transactionId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<VPResult | null> {
  const deadline = Date.now() + timeoutMs;
  
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const status = await checkStatus(requestId);
      if (status === 'EXPIRED' || !status) return null;
      if (status === 'VP_SUBMITTED') return await fetchResult(transactionId);
    } catch {
      return null;
    }
  }
  return null;
}
