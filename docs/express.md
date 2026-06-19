# Express

Run Shopier calls on the server and return hosted checkout HTML to the browser.

```ts
import express from 'express';
import { ShopierApiClient, ShopierPaymentFlow, verifyAndParseWebhook } from '@nopeion/shopier';

const app = express();

app.post('/checkout', express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
    const payments = new ShopierPaymentFlow({ client });

    const payment = await payments.createPaymentLink({
      title: 'Premium Package',
      amount: '149.00',
      currency: 'TRY',
      imageUrl: 'https://cdn.example.com/cover.png',
      orderId: `order-${Date.now()}`,
      hostedCheckout: true,
      shopSlug: process.env.SHOPIER_SHOP_SLUG,
    });

    res.type('html').send(payment.checkoutHtml);
  } catch (error) {
    next(error);
  }
});

app.post('/shopier/webhook', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    const event = verifyAndParseWebhook({
      webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
      headers: req.headers,
      body: req.body,
    });

    res.json({ ok: true, type: event.type });
  } catch (error) {
    next(error);
  }
});
```
