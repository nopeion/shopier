# Next.js

Use `@nopeion/shopier` in Route Handlers so secrets stay server-side.

## Create Checkout

```ts
// app/api/shopier/checkout/route.ts
import { Shopier, Currency, ProductType } from '@nopeion/shopier';

export async function POST() {
  const shopier = new Shopier({
    apiKey: process.env.SHOPIER_API_KEY!,
    apiSecret: process.env.SHOPIER_API_SECRET!,
  });

  const checkout = shopier.createPayment({
    amount: 149,
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

  return new Response(checkout.html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
```

## Verify Callback

```ts
// app/api/shopier/callback/route.ts
import { Shopier } from '@nopeion/shopier';

export async function POST(request: Request) {
  const form = await request.formData();
  const body = Object.fromEntries(form.entries()) as Record<string, string>;

  const shopier = new Shopier({
    apiKey: process.env.SHOPIER_API_KEY!,
    apiSecret: process.env.SHOPIER_API_SECRET!,
  });

  const result = shopier.verifyCallback(body as any);

  if (!result.success) {
    return Response.json({ ok: false, status: result.status }, { status: 400 });
  }

  return Response.json({ ok: true, orderId: result.platformOrderId });
}
```
