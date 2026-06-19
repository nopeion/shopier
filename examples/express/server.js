const express = require('express');
const {
  ShopierApiClient,
  ShopierPaymentFlow,
  verifyAndParseWebhook,
} = require('@nopeion/shopier');

const app = express();

app.post('/checkout', express.json(), async (req, res, next) => {
  try {
    const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
    const payments = new ShopierPaymentFlow({ client });
    const payment = await payments.createPaymentLink({
      title: req.body.title ?? 'Premium Package',
      amount: req.body.amount ?? '149.00',
      currency: 'TRY',
      imageUrl: process.env.SHOPIER_PRODUCT_IMAGE_URL,
      orderId: req.body.orderId ?? `order-${Date.now()}`,
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

    // Fulfill idempotently using event.id or the Shopier order id.
    console.log('Verified webhook:', event.type);
    res.status(200).send('ok');
  } catch (error) {
    next(error);
  }
});

app.listen(3000, () => {
  console.log('Express app running on http://localhost:3000');
});
