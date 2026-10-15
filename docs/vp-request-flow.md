# Fluxo de VP Request — Breja.me

## Visão Geral

O app usa o protocolo **OpenID4VP** para verificar a idade do usuário via credencial digital (Inji Wallet). O fluxo envolve 3 etapas: criação do pedido, apresentação pelo wallet e obtenção do resultado.

---

## Diagrama de Sequência

```
App (brejame)          Backend (BASE_URL)         Inji Wallet
      |                       |                        |
      |-- POST /vp-request --> |                        |
      |<-- transactionId,      |                        |
      |    requestId,          |                        |
      |    requestUri ---------|                        |
      |                       |                        |
      |-- openURL(openid4vp://authorize?...) ---------->|
      |                       |                        |
      |   [app vai para background]                     |
      |                       |<-- VP apresentado ------|
      |                       |                        |
      |   [app volta ao foreground]                     |
      |                       |                        |
      |-- GET /vp-request/{requestId}/status ---------->|
      |<-- { status: "VP_SUBMITTED" } -----------------|
      |                       |                        |
      |-- GET /vp-result/{transactionId} ------------->|
      |<-- { vpResultStatus, vcResults } --------------|
      |                       |                        |
      |-- navega para Success ou Underage              |
```

---

## Etapas Detalhadas

### 1. Criação do VP Request

**Função:** `createVPRequest()` em `verifyService.ts`

O app faz um `POST` para o backend:

```
POST {BASE_URL}/v1/verify/vp-request
Content-Type: application/json

{
  "clientId": "<CLIENT_ID>",
  "presentationDefinition": {
    "id": "eca-age-verification",
    "purpose": "Verificação de idade conforme o ECA",
    "format": { "ldp_vc": { "proof_type": ["Ed25519Signature2020"] } },
    "input_descriptors": [{
      "id": "eca credential",
      "constraints": {
        "fields": [{
          "path": ["$.type"],
          "filter": { "type": "object", "pattern": "ECACredential" }
        }]
      }
    }]
  }
}
```

O backend retorna:

```json
{
  "transactionId": "...",
  "requestId": "...",
  "requestUri": "https://...",
  "expiresAt": 1234567890
}
```

### 2. Abertura do Wallet via Deep Link

**Função:** `openWalletForVerification()` em `verifyService.ts`

Com os dados recebidos, o app monta uma URL no formato OpenID4VP:

```
openid4vp://authorize?client_id=<CLIENT_ID>&request_uri=<requestUri>&origin=brejame://
```

Essa URL é aberta via `Linking.openURL()`, que lança o Inji Wallet. O app vai para background enquanto o usuário interage com o wallet.

### 3. Polling de Status

**Função:** `pollVPStatus(requestId)` em `verifyService.ts`  
**Orquestração:** `startPolling()` em `useAgeVerification.ts`

Enquanto aguarda, o app faz polling contínuo:

```
GET {BASE_URL}/v1/verify/vp-request/{requestId}/status
```

Respostas possíveis:

| Status | Significado |
|--------|-------------|
| `ACTIVE` | Aguardando o usuário apresentar a credencial — continua polling |
| `VP_SUBMITTED` | Wallet enviou a credencial — avança para obter resultado |
| `EXPIRED` | Sessão expirou — exibe erro |

> Quando o app volta ao foreground (evento `AppState change → "active"`), o polling é reiniciado automaticamente caso haja uma sessão ativa.

### 4. Obtenção do Resultado

**Função:** `getVPResult(transactionId)` em `verifyService.ts`

```
GET {BASE_URL}/v1/verify/vp-result/{transactionId}
```

Resposta esperada:

```json
{
  "vpResultStatus": "SUCCESS",
  "vcResults": [{
    "vc": {
      "credentialSubject": {
        "isOver18": true
      }
    }
  }]
}
```

O app extrai `isOver18` do `credentialSubject` da VC, tentando os caminhos nesta ordem:
1. `vc.credential.credentialSubject`
2. `vc.credentialSubject`
3. `vc` diretamente

### 5. Navegação Final

| Condição | Destino |
|----------|---------|
| `isOver18 === true` | Tela **Success** (com `requestId`) |
| `isOver18 === false` | Tela **Underage** |
| Erro / timeout | Exibe mensagem de erro na tela de verificação |

---

## Variáveis de Ambiente

| Variável | Uso |
|----------|-----|
| `EXPO_PUBLIC_BASE_URL` | URL base do backend de verificação |
| `EXPO_PUBLIC_CLIENT_ID` | Identificador do cliente no protocolo OpenID4VP |
