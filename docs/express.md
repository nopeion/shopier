# Express

Use URL-encoded body parsing for classic Shopier callbacks.

## Checkout Route

```js
import express from 'express';
import { Shopier, Currency, ProductType } from '@nopeion/shopier';

const app = express();
app.use(express.urlencoded({ extended: false }));

const shopier = new Shopier({
  apiKey: process.env.SHOPIER_API_KEY,
  apiSecret: process.env.SHOPIER_API_SECRET,
});

app.post('/checkout', (req, res) => {
  const checkout = shopier.createPayment({
    amount: Number(req.body.amount || 149),
    currency: Currency.TL,
    buyer: {
      id: 'user-123',
      platformOrderId: `order-${Date.now()}`,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '05000000000',
      productName: 'Premium Package',
      productType: ProductType.DOWNLOADABLE_VIRTUAL,
    },
  });

  res.type('html').send(checkout.html);
});
```

## Callback Route

```js
app.post('/callback', (req, res) => {
  const result = shopier.verifyCallback(req.body);

  if (!result.success) {
    return res.status(400).send('failed');
  }

  // Fulfill idempotently here.
  return res.send('ok');
});
```
