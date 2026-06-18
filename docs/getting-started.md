# Getting Started

`@nopeion/shopier` creates classic Shopier checkout form payloads on the server and verifies payment callbacks.

## Install

```bash
npm install @nopeion/shopier
```

## Configure

Set checkout credentials on the server:

```bash
SHOPIER_API_KEY=your-api-key
SHOPIER_API_SECRET=your-api-secret
SHOPIER_PAT=your-personal-access-token
SHOPIER_WEBHOOK_TOKEN=your-webhook-token
SHOPIER_OSB_USERNAME=your-osb-username
SHOPIER_OSB_PASSWORD=your-osb-password
```

Do not expose `SHOPIER_API_SECRET` in browser bundles.

Named checkout sets use `SHOPIER_CHECKOUT_PRIMARY_API_KEY` and
`SHOPIER_CHECKOUT_PRIMARY_API_SECRET`. Named PAT and OSB sets use
`SHOPIER_PAT_PRIMARY` and `SHOPIER_OSB_PRIMARY_USERNAME` /
`SHOPIER_OSB_PRIMARY_PASSWORD`.

## Create a Legacy Checkout Form

Use this only when your Shopier account still has classic checkout API key/secret credentials.

```ts
import { Shopier, Currency, ProductType } from '@nopeion/shopier';

const shopier = new Shopier({
  apiKey: process.env.SHOPIER_API_KEY!,
  apiSecret: process.env.SHOPIER_API_SECRET!,
});

const checkout = shopier.createPayment({
  amount: 149,
  currency: Currency.TL,
  buyer: {
    id: 'user-123',
    platformOrderId: 'checkout-123',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '05000000000',
    productName: 'Premium Package',
    productType: ProductType.DOWNLOADABLE_VIRTUAL,
  },
});
```

Send `checkout.html` as a server response, or render `checkout.formData` into your own server-generated form.

## Create a Modern Payment Link

For PAT-based Shopier API usage, create a product and use the returned `product.url` as the payment link.

```ts
import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
const payments = new ShopierPaymentFlow({ client });

const payment = await payments.createPaymentLink({
  title: 'Premium Package',
  amount: '149.00',
  currency: 'TRY',
  imageUrl: 'https://example.com/cover.png',
  orderId: 'checkout-123',
});
```

Store `payment.productId` with your local order id. When the `order.created` webhook arrives, match the order line item product id back to your local order.

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

Use the nested `playground` repo after building the package:

```bash
npm run build
cd playground
npm install
npm start
```

Then open `http://localhost:3000`.
