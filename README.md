# @nopeion/shopier

[![npm version](https://img.shields.io/npm/v/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![npm downloads](https://img.shields.io/npm/dm/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![install size](https://packagephobia.com/badge?p=@nopeion/shopier)](https://packagephobia.com/result?p=@nopeion/shopier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript/Node.js SDK for Shopier PAT checkout flows, REST API calls, REST webhooks, and OSB notifications.

> [!NOTE]
> This package is an independent community SDK. It is not officially affiliated with Shopier.

## Features

- PAT checkout flow that creates Shopier products and can open Shopier hosted checkout.
- PAT REST API client for balance, categories, discounts, orders, payouts, products, refunds, selections, shippings, shop settings, variations, and webhook subscriptions.
- Automatic refund creation through `client.refunds.create()` / `client.createRefund()`.
- REST webhook HMAC-SHA256 verification and typed event parsing.
- OSB `res` + `hash` verification and payload normalization.
- Diagnostics, webhook router, framework response helpers, and test fixtures for real integrations.
- Named credential support for PAT and OSB credentials.
- ESM, CommonJS, and TypeScript declaration output.

## Compatibility

| Surface | Status | Notes |
| ------- | ------ | ----- |
| PAT hosted checkout | Supported | `ShopierPaymentFlow#createPaymentLink()` creates a product through PAT; `paymentUrl` is the product page and `checkoutHtml` opens checkout. |
| Existing product checkout | Supported | `buildHostedCheckoutHtml()` opens hosted checkout for a product you already manage in Shopier. |
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
SHOPIER_PAT=your-personal-access-token
SHOPIER_WEBHOOK_TOKEN=your-webhook-token
SHOPIER_SHOP_SLUG=your-shop-slug
SHOPIER_OSB_USERNAME=your-osb-username
SHOPIER_OSB_PASSWORD=your-osb-password
```

Named sets for multi-key projects:

```bash
SHOPIER_PAT_PRIMARY=...
SHOPIER_PAT_SECONDARY=...

SHOPIER_OSB_PRIMARY_USERNAME=...
SHOPIER_OSB_PRIMARY_PASSWORD=...
SHOPIER_OSB_SECONDARY_USERNAME=...
SHOPIER_OSB_SECONDARY_PASSWORD=...
```

Never commit real keys, PATs, webhook tokens, or OSB passwords.

## PAT Hosted Checkout

Use PAT credentials to create a Shopier product as the payment carrier.

```ts
import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
const payments = new ShopierPaymentFlow({ client });

const payment = await payments.createPaymentLink({
  title: 'Premium Plan',
  amount: '149.90',
  currency: 'TRY',
  imageUrl: 'https://example.com/cover.png',
  orderId: 'local-order-123',
  hostedCheckout: true,
  shopSlug: 'your-shop-slug',
});

res.send(payment.checkoutHtml);
// Store payment.productId with local-order-123 for webhook reconciliation.
```

`payment.paymentUrl` is the Shopier product page. For hosted checkout, send `payment.checkoutHtml` from your server so the browser posts to Shopier checkout. `fastPay` and `fastPayHtml` remain as backward-compatible aliases, but new code should use `hostedCheckout` and `hostedCheckoutHtml`.

For one-off/custom payments, create a product per payment and clean it up after the `order.created` webhook. For fixed catalog items, create the product once and reuse its checkout form.

```ts
import { buildHostedCheckoutHtml } from '@nopeion/shopier';

const checkoutHtml = buildHostedCheckoutHtml({
  productId: '48260043',
  shopSlug: process.env.SHOPIER_SHOP_SLUG!,
});

res.send(checkoutHtml);
```

```ts
const payment = await payments.createEphemeralPayment({
  title: 'Premium Plan',
  amount: 149.9,
  imageUrl: 'https://cdn.example.com/cover.png',
  hostedCheckout: true,
  shopSlug: 'your-shop-slug',
  ttlMs: 60 * 60 * 1000,
});

// Call after a failed/expired attempt, or let your webhook handler clean it up.
await payment.cleanup();
```

If you only need the product page:

```ts
const payment = await payments.createPaymentLink({
  title: 'Premium Plan',
  amount: 149.9,
  imageUrl: 'https://example.com/cover.png',
});

console.log(payment.paymentUrl);
```

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

## Diagnostics and helpers

```bash
shopier doctor
```

```ts
import {
  ShopierWebhookRouter,
  createPaymentResponse,
  handleWebhookRequest,
  runShopierDiagnostics,
} from '@nopeion/shopier';

const diagnostics = runShopierDiagnostics({
  require: ['pat', 'webhook', 'shopSlug'],
  imageUrl: 'https://cdn.example.com/cover.png',
});

const router = new ShopierWebhookRouter(process.env.SHOPIER_WEBHOOK_TOKEN);
router.on('order.created', async (event) => {
  await fulfillOrder(event.data);
});

export async function POST(request: Request) {
  return handleWebhookRequest(request, router);
}

return createPaymentResponse(payment);
```

Test helpers are available from `@nopeion/shopier/testing`:

```ts
import { createMockShopierFetch, createShopierWebhookFixture } from '@nopeion/shopier/testing';
```

## Playground

The companion [`shopier-playground`](https://github.com/nopeion/shopier-playground) repository provides a local UI for checkout, PAT order/refund calls, webhook verification, and OSB verification.

```bash
git clone https://github.com/nopeion/shopier-playground.git
cd shopier-playground
npm install
copy .env.example .env
npm start
```

Open `http://localhost:3000`.

See the [v2 migration guide](./docs/migration-v2.md) before upgrading from the classic checkout API.

## Reference Package Notes

`shopier-pat-api` inspired a few ergonomic ideas: simple PAT construction, resource methods, webhook verifier instances, and quick local payment-flow examples. This SDK keeps those ideas while adding broader endpoint coverage, payment-flow helpers, diagnostics, OSB helpers, and testing utilities.

## Verify

```bash
npm run lint
npm test
npm run build
```

## Security

- Run all Shopier operations that require secrets on the server.
- Do not put PATs, webhook tokens, or OSB passwords in frontend bundles.
- Use idempotency in your app before fulfilling webhook or OSB events.
- Log `ShopierError#toSafeJSON()` instead of raw error details when possible.

## Exports

```ts
import {
  ShopierApiClient,
  ShopierOsbClient,
  ShopierPaymentFlow,
  ShopierWebhookRouter,
  buildHostedCheckoutHtml,
  ShopierWebhookVerifier,
  runShopierDiagnostics,
  verifyAndParseWebhook,
} from '@nopeion/shopier';
```

## Author

**nopeion**

- GitHub: [@nopeion](https://github.com/nopeion)
- Email: [nopeiondev@gmail.com](mailto:nopeiondev@gmail.com)
