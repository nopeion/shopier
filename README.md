# @nopeion/shopier

[![npm version](https://img.shields.io/npm/v/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![npm downloads](https://img.shields.io/npm/dm/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![install size](https://packagephobia.com/badge?p=@nopeion/shopier)](https://packagephobia.com/result?p=@nopeion/shopier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript/Node.js SDK for Shopier checkout, OSB notifications, and the PAT-based Shopier REST API.

> [!NOTE]
> This package is an independent community SDK. It is not officially affiliated with Shopier.

## Features

- Classic Shopier checkout form generation and callback verification.
- PAT REST API client for balance, categories, discounts, orders, payouts, products, refunds, selections, shippings, shop settings, variations, and webhook subscriptions.
- Automatic refund creation through `client.refunds.create()` / `client.createRefund()`.
- REST webhook HMAC-SHA256 verification and typed event parsing.
- OSB `res` + `hash` verification and payload normalization.
- Named credential sets for multiple checkout, PAT, and OSB credentials.
- ESM, CommonJS, and TypeScript declaration output.

## Compatibility

| Surface | Status | Notes |
| ------- | ------ | ----- |
| Classic checkout | Supported | `Shopier#createPayment()` posts to the classic checkout form endpoint. |
| Classic callback | Supported | `Shopier#verifyCallback()` validates callback signatures. |
| OSB | Supported | `verifyOsb`, `handleOsb`, and `ShopierOsbClient`. |
| PAT REST API | Supported | Bearer token client for documented `api.shopier.com/v1` endpoints. |
| Refunds | Supported | List, get, and create refund requests. |
| REST webhooks | Supported | Verify `Shopier-Signature`, parse event headers and payload. |
| Sandbox mode | Not assumed | Use real credentials only in server-side local/test environments. |

## Install

```bash
npm install @nopeion/shopier
```

## Environment

Default credentials:

```bash
SHOPIER_API_KEY=your-checkout-api-key
SHOPIER_API_SECRET=your-checkout-api-secret
SHOPIER_PAT=your-personal-access-token
SHOPIER_WEBHOOK_TOKEN=your-webhook-token
SHOPIER_OSB_USERNAME=your-osb-username
SHOPIER_OSB_PASSWORD=your-osb-password
```

Named sets for multi-key projects:

```bash
SHOPIER_CHECKOUT_PRIMARY_API_KEY=...
SHOPIER_CHECKOUT_PRIMARY_API_SECRET=...
SHOPIER_CHECKOUT_SECONDARY_API_KEY=...
SHOPIER_CHECKOUT_SECONDARY_API_SECRET=...

SHOPIER_PAT_PRIMARY=...
SHOPIER_PAT_SECONDARY=...

SHOPIER_OSB_PRIMARY_USERNAME=...
SHOPIER_OSB_PRIMARY_PASSWORD=...
SHOPIER_OSB_SECONDARY_USERNAME=...
SHOPIER_OSB_SECONDARY_PASSWORD=...
```

Never commit real keys, secrets, PATs, webhook tokens, or OSB passwords.

## Checkout

```ts
import { Currency, ProductType, Shopier } from '@nopeion/shopier';

const shopier = new Shopier({ credentialName: 'primary' });

const checkout = shopier.createPayment({
  amount: 99.99,
  currency: Currency.TL,
  buyer: {
    id: 'user-123',
    platformOrderId: 'order-123',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '05000000000',
    productName: 'Premium Plan',
    productType: ProductType.DOWNLOADABLE_VIRTUAL,
  },
});

res.send(checkout.html);
```

## Callback Verification

```ts
const result = shopier.verifyCallback(req.body);

if (result.success) {
  await markOrderPaid(result.platformOrderId, result.paymentId);
}
```

`verifyCallback` throws `SignatureValidationError` when the callback signature is invalid.

## PAT REST API

```ts
import { ShopierApiClient } from '@nopeion/shopier';

const client = new ShopierApiClient({
  pat: process.env.SHOPIER_PAT,
});

const orders = await client.orders.list({
  limit: 10,
  fulfillmentStatus: 'unfulfilled',
});

const order = await client.orders.get('order-id');
const transaction = await client.orders.getTransaction('order-id');

const refund = await client.createRefund({
  orderId: 'order-id',
  amount: '10.00',
  note: 'Customer requested refund',
});
```

### Endpoint Map

| Namespace | Methods |
| --------- | ------- |
| `balance` | `get`, `transactions.list`, `transactions.get` |
| `categories` | `list`, `create`, `get`, `update`, `delete` |
| `discounts.codes` | `list`, `create`, `get`, `update`, `delete` |
| `discounts.automatic` | `list`, `create`, `get`, `update`, `delete` |
| `orders` | `list`, `get`, `update`, `fulfill`, `getTransaction` |
| `payouts` | `list`, `get`, `transactions.list` |
| `products` | `list`, `create`, `get`, `update`, `delete` |
| `refunds` | `list`, `create`, `get` |
| `selections` | `list`, `create`, `get`, `update`, `delete` |
| `shippings` | `list`, `create`, `get`, `delete` |
| `shop` | `getOwner`, `getSettings`, `updateSettings` |
| `variations` | `list`, `create`, `get`, `update`, `delete` |
| `webhooks` | `list`, `create`, `delete` |

## Webhooks

```ts
import { verifyAndParseWebhook } from '@nopeion/shopier';

const event = verifyAndParseWebhook({
  webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
  body: rawBody,
  headers: req.headers,
});

switch (event.type) {
  case 'order.created':
    await handleOrderCreated(event.data);
    break;
  case 'refund.updated':
    await handleRefundUpdated(event.data);
    break;
}
```

Webhook signatures are computed with HMAC-SHA256 over the raw request body. Keep the raw body unmodified until verification is complete.

## OSB

```ts
import { ShopierOsbClient } from '@nopeion/shopier';

const osb = new ShopierOsbClient({ credentialName: 'primary' });
const result = osb.handle({
  res: req.body.res,
  hash: req.body.hash,
});

if (result.verified) {
  await processOsbPayload(result.payload);
}
```

## Playground

The nested [`playground`](./playground) repo provides a local UI for checkout, PAT order/refund calls, webhook verification, and OSB verification.

```bash
npm run build
cd playground
npm install
copy .env.example .env
npm start
```

Open `http://localhost:3000`.

## Reference Package Notes

`shopier-pat-api` inspired a few ergonomic ideas: simple PAT construction, resource methods, webhook verifier instances, and quick local payment-flow examples. This SDK keeps those ideas but implements a broader documented endpoint surface, named credential handling, and separate classic checkout/OSB/REST modules.

## Verify

```bash
npm run lint
npm test
npm run build
```

## Security

- Run all Shopier operations that require secrets on the server.
- Do not put `SHOPIER_API_SECRET`, PATs, webhook tokens, or OSB passwords in frontend bundles.
- Use idempotency in your app before fulfilling callbacks or webhook events.
- Log `ShopierError#toSafeJSON()` instead of raw error details when possible.

## Exports

```ts
import {
  Shopier,
  ShopierApiClient,
  ShopierCredentialManager,
  ShopierOsbClient,
  ShopierWebhookVerifier,
  verifyAndParseWebhook,
} from '@nopeion/shopier';
```

## Author

**nopeion**

- GitHub: [@nopeion](https://github.com/nopeion)
- Email: [nopeiondev@gmail.com](mailto:nopeiondev@gmail.com)
