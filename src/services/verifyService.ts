import { Linking } from "react-native";

const BASE_URL = "https://injiverify.credenciaisverificaveis-dev.dataprev.gov.br";
const CLIENT_ID = "https://injiverify.credenciaisverificaveis-dev.dataprev.gov.br";
const ORIGIN = "brejame://";

const PRESENTATION_DEFINITION = {
  id: "eca-age-verification",
  purpose: "Verificação de idade conforme o Estatuto da Criança e do Adolescente",
  format: {
    ldp_vc: {
      proof_type: ["Ed25519Signature2020"],
    },
  },
  input_descriptors: [
    {
      id: "eca credential",
      format: {
        ldp_vc: {
          proof_type: ["Ed25519Signature2020"],
        },
      },
      constraints: {
        fields: [
          {
            path: ["$.type"],
            filter: { type: "object", pattern: "ECACredential" },
          },
        ],
      },
    },
  ],
};


type QrData = {
  transactionId: string;
  requestId: string;
  authorizationDetails?: {
    responseType: string;
    responseMode: string;
    nonce: string;
    responseUri: string;
    presentationDefinition?: object;
    clientId?: string;
    acceptVPWithoutHolderProof?: boolean;
    issuedAt?: number;
  };
  requestUri?: string;
  expiresAt?: number;
};

function buildDeepLinkUrl(data: QrData): string {
  const params = new URLSearchParams();
  params.set("client_id", CLIENT_ID);

  if (data.requestUri) {
    params.set("request_uri", data.requestUri);
  } else if (data.authorizationDetails) {
    const auth = data.authorizationDetails as any;
    params.set("redirect_uri", auth.responseUri || `${BASE_URL}/v1/verify/vp-submission/direct-post`);
    params.set("response_type", auth.responseType || "vp_token");
    params.set("response_mode", auth.responseMode || "direct_post");
    params.set("nonce", auth.nonce || "");
    params.set("state", data.requestId);
    params.set("presentation_definition", JSON.stringify(auth.presentationDefinition || PRESENTATION_DEFINITION));
  } else {
    throw new Error("Missing requestUri and authorizationDetails in VP request response");
  }

  if (data.requestId) params.set("origin", ORIGIN);

  return `openid4vp://authorize?${params.toString()}`;
}

export async function createVPRequest(): Promise<{
  transactionId: string;
  requestId: string;
  deepLinkUrl: string;
}> {
  const response = await fetch(`${BASE_URL}/v1/verify/vp-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      presentationDefinition: PRESENTATION_DEFINITION,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create VP request");
  }

  const data: QrData = await response.json();
  console.log('[createVPRequest] response:', JSON.stringify(data));
  const deepLinkUrl = buildDeepLinkUrl(data);

  return {
    transactionId: data.transactionId,
    requestId: data.requestId,
    deepLinkUrl,
  };
}

export async function pollVPStatus(
  requestId: string
): Promise<"ACTIVE" | "VP_SUBMITTED" | "EXPIRED"> {
  const response = await fetch(
    `${BASE_URL}/v1/verify/vp-request/${requestId}/status`
  );
  const raw = await response.text();
  console.log('[pollVPStatus] status:', response.status, 'body:', raw);
  if (!response.ok) {
    throw new Error(`Failed to fetch VP status: ${response.status} ${raw}`);
  }
  const data = JSON.parse(raw);
  return data.status;
}

export async function getVPResult(
  transactionId: string
): Promise<{ verified: boolean; underage?: boolean }> {
  const response = await fetch(
    `${BASE_URL}/v1/verify/vp-result/${transactionId}`
  );

  const rawText = await response.text();
  console.log('[getVPResult] status:', response.status, 'body:', rawText);

  if (!response.ok) {
    throw new Error(`Failed to get VP result: ${response.status} ${rawText}`);
  }

  const data = JSON.parse(rawText);
  console.log('[getVPResult] parsed data:', JSON.stringify(data));

  if (data.vpResultStatus !== "SUCCESS" || !data.vcResults?.length) {
    throw new Error(`VP result unavailable: status=${data.vpResultStatus}, vcResults=${JSON.stringify(data.vcResults)}`);
  }

  const vcRaw = data.vcResults[0].vc;
  console.log('[getVPResult] vcRaw:', vcRaw);
  const vc = typeof vcRaw === 'string' ? JSON.parse(vcRaw) : vcRaw;
  console.log('[getVPResult] vc parsed:', JSON.stringify(vc));

  // Try multiple paths for isOver18
  const subject = vc?.credential?.credentialSubject
    ?? vc?.credentialSubject
    ?? vc;
  console.log('[getVPResult] credentialSubject:', JSON.stringify(subject));
  const isOver18 = subject?.isOver18 === true;

  return { verified: isOver18, underage: !isOver18 };
}

export async function openWalletForVerification(): Promise<{
  transactionId: string;
  requestId: string;
}> {
  const { transactionId, requestId, deepLinkUrl } = await createVPRequest();
  console.log("Deep link URL:", deepLinkUrl);
  try {
    await Linking.openURL(deepLinkUrl);
  } catch (error) {
    throw new Error("Nenhum wallet compatível encontrado. Instale o Inji Wallet.");
  }

  return { transactionId, requestId };
}
