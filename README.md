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
- Automatic retry with exponential backoff and `Retry-After` support for idempotent requests, plus an opt-in escape hatch for POST.
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
| Refunds | Supported | List, get, and create refund requests. `create()`'s error responses are not fully reliable — see the warning in [PAT REST API](#pat-rest-api). |
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

> [!WARNING]
> A `refunds.create()` call can respond with a 500 even when Shopier actually started processing the refund — observed live: the request returned `500 Internal server error`, a second attempt returned `400` with "there is a pending refund request about the order," and the shop dashboard showed the refund as processing, while both `orders.get()` and `refunds.list({ orderId })` still reported no refund at all. Do not treat a failed `refunds.create()` response as proof nothing happened, and do not retry it automatically for this reason (retry already excludes POST by default — see below). Check the Shopier dashboard, or wait and re-check `refunds.list()`, before assuming a retry is safe.

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

> [!WARNING]
> `orders.list()` (and other endpoints accepting `dateStart`/`dateEnd`) return an **empty array, not an error**, when no date range is given — confirmed against the live API. Always pass `dateStart`/`dateEnd` as `YYYY-MM-DDTHH:mm:ssZ`, or a working integration will silently see zero results instead of an error pointing at the missing filter.
>
> ```ts
> const orders = await client.orders.list({
>   dateStart: '2026-01-01T00:00:00Z',
>   dateEnd: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
> });
> ```

### Retries and rate limits

The client retries transient failures on its own: HTTP 408, 429, 500, 502, 503 and 504, plus timeouts and network errors. Backoff is exponential with jitter, and a `Retry-After` header is honoured when Shopier sends one.

**POST is not retried by default.** A POST that timed out or returned a 500 may still have been applied on Shopier's side, so repeating it could issue a second refund or create a duplicate product. Idempotent methods (`GET`, `PUT`, `DELETE`) are retried normally. HTTP 429 is the one exception that is retried for every method, because a rate limited request was rejected before it was processed.

```ts
const client = new ShopierApiClient({
  pat: process.env.SHOPIER_PAT,
  retry: {
    maxRetries: 2,        // retries after the first attempt; 0 disables
    baseDelayMs: 500,     // doubled each attempt
    maxDelayMs: 8000,     // caps any single wait, including Retry-After
    onRetry: ({ attempt, status, delayMs }) => {
      console.warn(`Shopier retry ${attempt}: status ${status}, waiting ${delayMs}ms`);
    },
  },
});
```

`timeoutMs` applies to each attempt, not to the retried sequence as a whole. Passing your own `AbortSignal` cancels everything, including a pending backoff wait, and a cancellation is never retried.

To retry a POST you know is safe to repeat, opt in per request:

```ts
await client.request('/products', {
  method: 'POST',
  body: input,
  retry: { retryNonIdempotent: true },
});
```

Every `create` call also accepts an `idempotencyKey`, sent as the `Idempotency-Key` header:

```ts
import { createIdempotencyKey } from '@nopeion/shopier';

const idempotencyKey = createIdempotencyKey();

await client.refunds.create(
  { orderId: 'order-1', amount: '10.00' },
  { idempotencyKey }
);
```

> [!WARNING]
> **This does not make the POST retryable, and it is not a safety mechanism.** We tested it live: two identical `products.create()` calls with the same `Idempotency-Key` created two separate products, so Shopier does not deduplicate on it. Supplying a key alone changes nothing about retry behaviour — you still need `retry: { retryNonIdempotent: true }` to retry that POST, and doing so is exactly as risky as without a key. Use `idempotencyKey` only for your own request tracing/correlation (for example, matching a log line back to a specific attempt), not as license to retry.

`shouldRetry` replaces the default decision, and receives the default in `context.retryable` so you can build on it:

```ts
const client = new ShopierApiClient({
  pat: process.env.SHOPIER_PAT,
  retry: {
    shouldRetry: (context) => context.retryable || context.status === 409,
  },
});
```

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

The companion [`shopier-playground`](https://github.com/nopeion/shopier-playground) repository provides a local UI for checkout, PAT order/refund calls, a products/categories catalog, a live webhook receiver (register a real URL and watch deliveries land, not just paste-and-verify), a retry/backoff demo that needs no Shopier account, and OSB verification.

```bash
git clone https://github.com/nopeion/shopier-playground.git
cd shopier-playground
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3115` while developing.

For a production-style run:

```bash
npm run build
npm start
```

Open `http://localhost:3000` unless `PORT` is set.

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
  createIdempotencyKey,
  ShopierWebhookVerifier,
  runShopierDiagnostics,
  verifyAndParseWebhook,
} from '@nopeion/shopier';
```

## Author

**nopeion**

- GitHub: [@nopeion](https://github.com/nopeion)
- Email: [nopeiondev@gmail.com](mailto:nopeiondev@gmail.com)
