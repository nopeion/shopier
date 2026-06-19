import { createPaymentResponse, handleWebhookRequest, sendHtml } from '../../src/frameworks';
import { ShopierWebhookRouter } from '../../src/webhooks';
import { createShopierWebhookFixture } from '../../src/testing';

describe('webhook router and framework helpers', () => {
  it('should dispatch verified webhook events to matching handlers', async () => {
    const fixture = createShopierWebhookFixture({
      body: { id: 'order-1' },
      event: 'order.created',
    });
    const router = new ShopierWebhookRouter(fixture.token);
    const handler = jest.fn();

    router.on('order.created', handler);
    const result = await router.dispatch(fixture.headers, fixture.body);

    expect(result.handled).toBe(true);
    expect(result.handlerCount).toBe(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'order.created',
    }));
  });

  it('should handle fetch-style webhook requests', async () => {
    const fixture = createShopierWebhookFixture();
    const router = new ShopierWebhookRouter(fixture.token);
    router.onAny(jest.fn());

    const response = await handleWebhookRequest({
      headers: fixture.headers,
      text: async () => fixture.body,
    }, router);
    const payload = await response.json() as Record<string, unknown>;

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(payload.ok).toBe(true);
    expect(payload.handled).toBe(true);
  });

  it('should create HTML payment responses when checkout HTML exists', async () => {
    const response = createPaymentResponse({
      productId: 'product-1',
      paymentUrl: 'https://www.shopier.com/product-1',
      product: { id: 'product-1', title: 'Product', type: 'digital' },
      productInput: {
        title: 'Product',
        type: 'digital',
        media: [{ type: 'image', url: 'https://cdn.example.com/image.jpg', placement: 1 }],
        priceData: { currency: 'TRY', price: '10.00' },
        shippingPayer: 'sellerPays',
      },
      checkoutHtml: '<form></form>',
    });

    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toBe('<form></form>');
  });

  it('should send HTML through express-like responses', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    sendHtml(res, '<form></form>', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalledWith('<form></form>');
  });
});
