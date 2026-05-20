import { Linking } from "react-native";

const BASE_URL = "https://verify.breja.me";
const CLIENT_ID = "did:web:verify.breja.me:v1:verify";
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

const CLIENT_METADATA = {
  client_name: "https://breja.me",
  vp_formats: {
    ldp_vp: {
      proof_type: ["Ed25519Signature2018", "Ed25519Signature2020", "RsaSignature2018"],
    },
  },
};

function generateNonce(): string {
  return btoa(Date.now().toString());
}

type QrData = {
  transactionId: string;
  requestId: string;
  authorizationDetails?: {
    responseType: string;
    responseMode: string;
    nonce: string;
    responseUri: string;
    presentationDefinitionUri?: string;
    presentationDefinition?: object;
  };
  requestUri?: string;
  expiresAt?: number;
};

function buildDeepLinkUrl(data: QrData): string {
  if (!data.authorizationDetails) {
    throw new Error("Missing authorization details");
  }

  const params = new URLSearchParams();
  params.set("origin", ORIGIN);
  params.set("requestId", data.requestId);
  params.set("client_id", CLIENT_ID);
  params.set("state", data.requestId);
  params.set("response_type", "vp_token");
  params.set("response_mode", "direct_post");
  params.set("nonce", data.authorizationDetails.nonce);
  params.set("response_uri", `${BASE_URL}/v1/verify/vp-submission/direct-post`);
  params.set("presentation_definition", JSON.stringify(PRESENTATION_DEFINITION));
  params.set("client_metadata", JSON.stringify(CLIENT_METADATA));

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
  if (!response.ok) {
    throw new Error("Failed to fetch VP status");
  }
  const data = await response.json();
  return data.status;
}

export async function getVPResult(
  transactionId: string
): Promise<{ verified: boolean; underage?: boolean }> {
  const response = await fetch(
    `${BASE_URL}/v1/verify/vp-result/${transactionId}`
  );

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error("Failed to get VP result");
  }

  const data = JSON.parse(rawText);

  if (data.vpResultStatus !== "SUCCESS" || !data.vcResults?.length) {
    throw new Error("VP result unavailable");
  }

  const vc = JSON.parse(data.vcResults[0].vc);
  const isOver18 = vc.credential.credentialSubject.isOver18 === true;

  return { verified: isOver18, underage: !isOver18 };
}

export async function openWalletForVerification(): Promise<{
  transactionId: string;
  requestId: string;
}> {
  const { transactionId, requestId, deepLinkUrl } = await createVPRequest();
  try {
    await Linking.openURL(deepLinkUrl);
  } catch (error) {
    throw new Error("Nenhum wallet compatível encontrado. Instale o Inji Wallet.");
  }

  return { transactionId, requestId };
}
