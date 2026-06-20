# Getting Started

`@nopeion/shopier` creates PAT-based Shopier payment flows, verifies REST webhooks, and provides OSB helpers for accounts that still use OSB notifications.

## Install

```bash
npm install @nopeion/shopier
```

## Configure

Set credentials on the server:

```bash
SHOPIER_PAT=your-personal-access-token
SHOPIER_SHOP_SLUG=your-shop-slug
SHOPIER_WEBHOOK_TOKEN=your-webhook-token
SHOPIER_OSB_USERNAME=your-osb-username
SHOPIER_OSB_PASSWORD=your-osb-password
```

Do not expose PATs, webhook tokens, or OSB passwords in browser bundles.

Named PAT and OSB sets use `SHOPIER_PAT_PRIMARY` and
`SHOPIER_OSB_PRIMARY_USERNAME` / `SHOPIER_OSB_PRIMARY_PASSWORD`.

## Create a Hosted Checkout

For PAT-based Shopier API usage, create a product and send checkout HTML from your server.

```ts
import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
const payments = new ShopierPaymentFlow({ client });

const payment = await payments.createPaymentLink({
  title: 'Premium Package',
  amount: '149.00',
  currency: 'TRY',
  imageUrl: 'https://cdn.example.com/cover.png',
  orderId: 'checkout-123',
  hostedCheckout: true,
  shopSlug: process.env.SHOPIER_SHOP_SLUG,
});

res.send(payment.checkoutHtml);
```

`payment.paymentUrl` opens the product page. Store `payment.productId` with your local order id. When the `order.created` webhook arrives, match the order line item product id back to your local order.

## Reuse a Fixed Product

For fixed-price catalog items, create the product once in Shopier and reuse its product id.

```ts
import { buildHostedCheckoutHtml } from '@nopeion/shopier';

const html = buildHostedCheckoutHtml({
  productId: '48260043',
  shopSlug: process.env.SHOPIER_SHOP_SLUG!,
});

res.send(html);
```

## Call the PAT REST API

```ts
import { ShopierApiClient } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });

const orders = await client.orders.list({ limit: 10 });
const refund = await client.refunds.create({
  orderId: 'order-id',
  amount: '10.00',
  note: 'Customer requested refund',
});
```

## Verify a REST Webhook

```ts
import { verifyAndParseWebhook } from '@nopeion/shopier';

const event = verifyAndParseWebhook({
  webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
  headers: req.headers,
  body: rawBody,
});
```

## Test Locally

Use the companion [shopier-playground](https://github.com/nopeion/shopier-playground) repo after `@nopeion/shopier` 2.0.0 is available from npm:

```bash
git clone https://github.com/nopeion/shopier-playground.git
cd shopier-playground
npm install
npm run dev
```

Then open `http://localhost:3115` while developing.

For a production-style run:

```bash
npm run build
npm start
```

Open `http://localhost:3000` unless `PORT` is set.

If you are upgrading from a classic checkout integration, read the [v2 migration guide](./migration-v2.md).
