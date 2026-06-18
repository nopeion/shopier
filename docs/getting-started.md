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
```

Do not expose `SHOPIER_API_SECRET` in browser bundles.

## Create a Checkout Form

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

## Test Locally

Use the nested `playground` repo after building the package:

```bash
npm run build
cd playground
npm install
npm start
```

Then open `http://localhost:3000`.
