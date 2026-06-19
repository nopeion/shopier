# Migrating to v2

`@nopeion/shopier` 2.0.0 removes the classic API key/secret checkout surface. This guide maps the removed API to the current PAT, REST webhook, and OSB APIs.

Node.js 18 or later is required for v2.

## Replace classic checkout

The following v1 APIs are removed:

- `new Shopier({ apiKey, apiSecret })`
- `shopier.createPayment(...)`
- `shopier.verifyCallback(...)`
- `ShopierCredentialManager` and checkout credential environment variables

Use a PAT to create a Shopier product and request hosted checkout instead:

```ts
import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
const payments = new ShopierPaymentFlow({ client });

const payment = await payments.createPaymentLink({
  title: 'Premium Package',
  amount: '149.00',
  currency: 'TRY',
  imageUrl: 'https://cdn.example.com/premium-package.png',
  orderId: 'order-123',
  hostedCheckout: true,
  shopSlug: process.env.SHOPIER_SHOP_SLUG,
});

res.type('html').send(payment.checkoutHtml);
```

Store `payment.productId` with your local order before sending checkout HTML. `payment.paymentUrl` remains useful when you want to direct a buyer to the product page instead.

## Replace classic callbacks

For REST webhooks, preserve the raw body and verify it before parsing JSON:

```ts
import { verifyAndParseWebhook } from '@nopeion/shopier';

const event = verifyAndParseWebhook({
  webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
  headers: req.headers,
  body: rawBody,
});
```

Use the webhook id or Shopier order id as an idempotency key before fulfillment. For integrations that still use OSB, keep using `handleOsb` or `ShopierOsbClient` and return `success` only after verification and safe fulfillment.

## Environment variable changes

| v1 | v2 |
| --- | --- |
| `SHOPIER_API_KEY` and `SHOPIER_API_SECRET` | `SHOPIER_PAT` |
| `SHOPIER_CHECKOUT_<NAME>_API_KEY` and `SHOPIER_CHECKOUT_<NAME>_API_SECRET` | `SHOPIER_PAT_<NAME>` |
| Classic callback signature | `SHOPIER_WEBHOOK_TOKEN` for REST webhooks, or existing OSB credentials |

PATs, webhook tokens, and OSB credentials must only exist on your server.
