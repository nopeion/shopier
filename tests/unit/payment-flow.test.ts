import { createHmac } from 'crypto';
import {
  ShopierApiClient,
  ShopierPaymentFlow,
  ValidationError,
  buildHostedCheckoutHtml,
  buildFastPayHtml,
} from '../../src';

describe('PAT payment link flow', () => {
  it('should create a Shopier product and return its payment URL', async () => {
    const fetcher = jest.fn(async () => jsonResponse({
      id: 'product-1',
      url: 'https://www.shopier.com/123456',
      title: 'Premium Plan',
    })) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const flow = new ShopierPaymentFlow({ client });

    const result = await flow.createPaymentLink({
      title: 'Premium Plan',
      amount: 149.9,
      currency: 'TRY',
      imageUrl: 'https://example.com/cover.png',
      orderId: 'order-1',
    });

    expect(result).toMatchObject({
      productId: 'product-1',
      paymentUrl: 'https://www.shopier.com/123456',
      orderId: 'order-1',
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.shopier.com/v1/products',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer pat-token',
          'Content-Type': 'application/json',
        }),
      })
    );

    const body = JSON.parse((fetcher as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      title: 'Premium Plan',
      description: 'Premium Plan',
      type: 'digital',
      shippingPayer: 'sellerPays',
      stockQuantity: 1,
      customListing: true,
      priceData: {
        currency: 'TRY',
        price: '149.90',
      },
      media: [{
        type: 'image',
        url: 'https://example.com/cover.png',
        placement: 1,
      }],
    });
  });

  it('should require media or an image URL for product payment links', () => {
    const client = new ShopierApiClient({
      pat: 'pat-token',
      fetch: jest.fn() as unknown as typeof fetch,
    });
    const flow = new ShopierPaymentFlow({ client });

    expect(() =>
      flow.buildProductInput({
        title: 'Premium Plan',
        amount: '149.90',
      })
    ).toThrow(ValidationError);
  });

  it('should build hosted checkout HTML without a hardcoded shop slug', () => {
    const html = buildHostedCheckoutHtml({
      productId: 'product-1',
      shopSlug: 'my-shop',
    });

    expect(html).toContain('https://www.shopier.com/s/shipping/my-shop');
    expect(html).toContain('name="product_id" value="product-1"');
    expect(html).toContain('shopier-hosted-checkout');
    expect(html).not.toContain('authsms');
  });

  it('should keep buildFastPayHtml as a backward-compatible alias', () => {
    expect(buildFastPayHtml({
      productId: 'product-1',
      shopSlug: 'my-shop',
    })).toBe(buildHostedCheckoutHtml({
      productId: 'product-1',
      shopSlug: 'my-shop',
    }));
  });

  it('should require a shop slug when hostedCheckout is enabled', async () => {
    const fetcher = jest.fn(async () => jsonResponse({
      id: 'product-1',
      url: 'https://www.shopier.com/123456',
    })) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const flow = new ShopierPaymentFlow({ client });

    await expect(flow.createPaymentLink({
      title: 'Premium Plan',
      amount: 149.9,
      imageUrl: 'https://example.com/cover.png',
      hostedCheckout: true,
    })).rejects.toThrow(ValidationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should return checkout HTML when hostedCheckout is enabled', async () => {
    const fetcher = jest.fn(async () => jsonResponse({
      id: 'product-1',
      url: 'https://www.shopier.com/123456',
    })) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const flow = new ShopierPaymentFlow({ client, shopSlug: 'my-shop' });

    const result = await flow.createPaymentLink({
      title: 'Premium Plan',
      amount: 149.9,
      imageUrl: 'https://example.com/cover.png',
      hostedCheckout: true,
    });

    expect(result.checkoutHtml).toContain('https://www.shopier.com/s/shipping/my-shop');
    expect(result.hostedCheckoutHtml).toBe(result.checkoutHtml);
    expect(result.fastPayHtml).toBe(result.checkoutHtml);
  });

  it('should still accept fastPay as a compatibility alias', async () => {
    const fetcher = jest.fn(async () => jsonResponse({
      id: 'product-1',
      url: 'https://www.shopier.com/123456',
    })) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const flow = new ShopierPaymentFlow({ client, shopSlug: 'my-shop' });

    const result = await flow.createPaymentLink({
      title: 'Premium Plan',
      amount: 149.9,
      imageUrl: 'https://example.com/cover.png',
      fastPay: true,
    });

    expect(result.hostedCheckoutHtml).toContain('shopier-hosted-checkout');
  });

  it('should create ephemeral payments and clean up their product', async () => {
    const fetcher = jest.fn(async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }

      return jsonResponse({
        id: 'product-1',
        url: 'https://www.shopier.com/123456',
      });
    }) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const flow = new ShopierPaymentFlow({ client });

    const payment = await flow.createEphemeralPayment({
      title: 'Premium Plan',
      amount: 149.9,
      imageUrl: 'https://example.com/cover.png',
      ttlMs: 60000,
    });

    expect(payment.ephemeral).toBe(true);
    expect(payment.productIds).toEqual(['product-1']);
    expect(payment.expiresAt).toBeDefined();

    await payment.cleanup();

    expect(fetcher).toHaveBeenLastCalledWith(
      'https://api.shopier.com/v1/products/product-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should process order.created webhooks and delete temporary products by default', async () => {
    const fetcher = jest.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const token = 'webhook-token';
    const flow = new ShopierPaymentFlow({ client, webhookToken: token });
    const rawBody = JSON.stringify({
      id: 'order-1',
      lineItems: [
        { productId: 'product-1', title: 'Premium Plan' },
      ],
    });
    const headers = signedHeaders(token, rawBody, 'order.created');
    const handler = jest.fn();

    const result = await flow.handleWebhookPayload(rawBody, headers, handler);

    expect(result).toMatchObject({
      processed: true,
      productIds: ['product-1'],
    });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      order: expect.objectContaining({ id: 'order-1' }),
    }));
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.shopier.com/v1/products/product-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should ignore non-payment webhook events', async () => {
    const fetcher = jest.fn() as unknown as typeof fetch;
    const client = new ShopierApiClient({ pat: 'pat-token', fetch: fetcher });
    const token = 'webhook-token';
    const flow = new ShopierPaymentFlow({ client, webhookToken: token });
    const rawBody = JSON.stringify({ id: 'refund-1' });
    const result = await flow.handleWebhookPayload(
      rawBody,
      signedHeaders(token, rawBody, 'refund.updated'),
      jest.fn()
    );

    expect(result.processed).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

function signedHeaders(token: string, body: string, event: string): Record<string, string> {
  return {
    'shopier-event': event,
    'shopier-signature': createHmac('sha256', token).update(body).digest('hex'),
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
