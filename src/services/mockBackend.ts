const BASE_URL = 'https://verify.breja.me';

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
    body: JSON.stringify({ clientId: 'brejame://', presentationDefinition: PRESENTATION_DEFINITION }),
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
  
  // ALWAYS read the body to see error details
  const rawText = await res.text();
  
  if (!res.ok) {
    return null;
  }
  
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return null;
  }
    
  if (data.vpResultStatus !== 'SUCCESS') {
    return null;
  }
  
  if (!data.vcResults || data.vcResults.length === 0) {
    return null;
  }
    
  let vc;
  try {
    vc = JSON.parse(data.vcResults[0].vc);
  } catch (e) {
    return null;
  }
  
  const isOver18 = vc.credential.credentialSubject.isOver18 === true;
  
  return { isOver18, transactionId };
}

export async function pollAndFetchResult(
  requestId: string,
  transactionId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<VPResult | null> {
  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  
  while (Date.now() < deadline) {
    attempts++;
    try {
      const status = await checkStatus(requestId);
      
      if (status === 'EXPIRED' || !status) {
        return null;
      }
      if (status === 'VP_SUBMITTED') {
        await new Promise(r => setTimeout(r, 2000));
        const result = await fetchResult(transactionId);
        return result;
      }
    } catch (e) {
      return null;
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}
