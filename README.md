# Breja.me

Mock app de delivery de cerveja com **um único produto**: 1 garrafa de cerveja.

Protótipo navegável com 3 telas, estilo brutalista, sem backend real.

## Stack

- Expo (React Native) + TypeScript
- React Navigation (Native Stack)
- StyleSheet puro (sem libs de UI)

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/go) no celular (opcional, para teste em dispositivo físico)

## Instalação

```bash
npm install
```

## Executando

```bash
npx expo start
```

Opções após iniciar:

| Tecla | Ação |
|-------|------|
| `w`   | Abrir no navegador (web) |
| `i`   | Abrir no iOS Simulator (requer Xcode) |
| `a`   | Abrir no Android Emulator (requer Android Studio) |
| `s`   | Trocar para Expo Go e escanear QR code no celular |

Para iniciar direto na web (não requer simulador):

```bash
npx expo start --web
```

## Fluxo do app

1. **Vitrine** — Card com "1 Garrafa de Cerveja", R$ 12,90, botão COMPRAR
2. **Verificação de Idade** — Botão "Verificar Idade" chama mock backend (~1.2s de delay)
3. **Sucesso** — Tela verde com checkmark, "Idade verificada", requestId no rodapé

## Simulando falha na verificação

Em `src/services/mockBackend.ts`, altere:

```ts
const SIMULATE_FAILURE = true;
```

Isso faz o `verifyAge()` retornar `{ ok: false }`, exibindo uma mensagem de erro vermelha na tela de verificação.

## Estrutura

```
src/
├── navigation/
│   └── AppNavigator.tsx        # Stack Navigator (3 rotas)
├── screens/
│   ├── StorefrontScreen.tsx    # Vitrine do produto
│   ├── AgeCheckScreen.tsx      # Verificação de idade
│   └── SuccessScreen.tsx       # Tela de sucesso
└── services/
    └── mockBackend.ts          # Mock de API com setTimeout
```
