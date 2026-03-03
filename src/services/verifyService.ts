import { Linking } from "react-native";

const VERIFY_SERVICE_URL = "https://verify.breja.me/v1/verify";
const CLIENT_ID = "did:web:verify.breja.me:v1:verify";

// Presentation definition for ECACredential age verification (over 18)
const AGE_PRESENTATION_DEFINITION = {
  id: "age-verification",
  name: "Age Verification",
  purpose: "Verify that the user is 18 years or older",
  input_descriptors: [
    {
      id: "eca_age_over_18",
      name: "ECA Age Credential",
      purpose: "Prove you are 18+",
      format: {
        ldp_vp: {
          proof_type: ["Ed25519Signature2020"],
        },
      },
      constraints: {
        fields: [
          {
            path: ["$.type"],
            filter: {
              type: "array",
              contains: { const: "ECACredential" },
            },
          },
          {
            path: ["$.credentialSubject.isOver18"],
            filter: {
              type: "boolean",
              const: true,
            },
          },
        ],
      },
    },
  ],
};

const VP_FORMAT = {
  ldp_vp: {
    proof_type: ["Ed25519Signature2018", "Ed25519Signature2020", "RsaSignature2018"],
  },
  "vc+sd-jwt": {
    "sd-jwt_alg_values": ["RS256", "ES256", "ES256K", "EdDSA"],
    "kb-jwt_alg_values": ["RS256", "ES256", "ES256K", "EdDSA"],
  },
};

function generateNonce(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
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
  const params = new URLSearchParams();
  params.set("client_id", CLIENT_ID);

  if (data.requestUri) {
    params.set("request_uri", data.requestUri);
  } else if (data.authorizationDetails) {
    const auth = data.authorizationDetails;
    params.set("state", data.requestId);
    params.set("response_mode", auth.responseMode);
    params.set("response_type", auth.responseType);
    params.set("nonce", auth.nonce);
    params.set("response_uri", auth.responseUri);

    if (auth.presentationDefinitionUri) {
      params.set(
        "presentation_definition_uri",
        VERIFY_SERVICE_URL + auth.presentationDefinitionUri
      );
    } else if (auth.presentationDefinition) {
      params.set(
        "presentation_definition",
        JSON.stringify(auth.presentationDefinition)
      );
    }

    params.set(
      "client_metadata",
      JSON.stringify({ client_name: CLIENT_ID, vp_formats: VP_FORMAT })
    );
  }

  return `openid4vp://authorize?${params.toString()}`;
}

export async function createVPRequest(): Promise<{
  transactionId: string;
  requestId: string;
  deepLinkUrl: string;
}> {
  const response = await fetch(`${VERIFY_SERVICE_URL}/vp-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      nonce: generateNonce(),
      presentationDefinition: AGE_PRESENTATION_DEFINITION,
    }),
  });

  if (response.status !== 201) {
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
    `${VERIFY_SERVICE_URL}/vp-request/${requestId}/status`
  );
  if (response.status !== 200) {
    throw new Error("Failed to fetch VP status");
  }
  const data = await response.json();
  return data.status;
}

export async function getVPResult(
  transactionId: string
): Promise<{ verified: boolean }> {
  const response = await fetch(
    `${VERIFY_SERVICE_URL}/vp-result/${transactionId}`
  );
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data.errorMessage || "Failed to get VP result");
  }

  const allValid = data.vcResults.every(
    (r: { verificationStatus: string }) => r.verificationStatus === "SUCCESS"
  );
  return { verified: allValid };
}

export async function openWalletForVerification(): Promise<{
  transactionId: string;
  requestId: string;
}> {
  const { transactionId, requestId, deepLinkUrl } = await createVPRequest();

  const canOpen = await Linking.canOpenURL(deepLinkUrl);
  if (!canOpen) {
    throw new Error("Nenhum wallet compatível encontrado. Instale o Inji Wallet.");
  }

  await Linking.openURL(deepLinkUrl);
  return { transactionId, requestId };
}
