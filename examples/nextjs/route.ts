import { ShopierApiClient, ShopierPaymentFlow, verifyAndParseWebhook } from '@nopeion/shopier';

// Use this as app/api/shopier/checkout/route.ts.
export async function createCheckoutResponse(request: Request) {
  const body = await request.json();
  const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
  const payments = new ShopierPaymentFlow({ client });
  const payment = await payments.createPaymentLink({
    title: body.title ?? 'Premium Package',
    amount: body.amount ?? '149.00',
    currency: 'TRY',
    imageUrl: process.env.SHOPIER_PRODUCT_IMAGE_URL,
    orderId: body.orderId ?? `order-${Date.now()}`,
    hostedCheckout: true,
    shopSlug: process.env.SHOPIER_SHOP_SLUG,
  });

  return new Response(payment.checkoutHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

// Use this as app/api/shopier/webhook/route.ts.
export async function createWebhookResponse(request: Request) {
  const rawBody = await request.text();
  const event = verifyAndParseWebhook({
    webhookToken: process.env.SHOPIER_WEBHOOK_TOKEN,
    headers: request.headers,
    body: rawBody,
  });

  // Fulfill idempotently using event.id or the Shopier order id.
  return Response.json({ ok: true, type: event.type });
}
