# Next.js App Router

## Create Checkout

```ts
// app/api/shopier/checkout/route.ts
import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

export async function POST() {
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

  return new Response(payment.checkoutHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
```

## Verify Webhook

```ts
// app/api/shopier/webhook/route.ts
import { verifyAndParseWebhook } from '@nopeion/shopier';

export async function POST(request: Request) {
  const rawBody = await request.text();

  const event = verifyAndParseWebhook({
    webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
    headers: request.headers,
    body: rawBody,
  });

  return Response.json({ ok: true, type: event.type });
}
```
