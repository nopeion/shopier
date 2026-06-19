import { ShopierApiClient } from '../../src/api';
import { ShopierInvalidMediaUrlError } from '../../src/errors';
import {
  createMockProduct,
  createMockShopierFetch,
  createOsbFixture,
  createShopierWebhookFixture,
} from '../../src/testing';
import { handleOsb } from '../../src/osb';
import { verifyAndParseWebhook } from '../../src/webhooks';

describe('testing helpers', () => {
  it('should create a mock fetch that records calls', async () => {
    const fetcher = createMockShopierFetch([
      { body: createMockProduct({ id: 'product-42' }) },
    ]);
    const client = new ShopierApiClient({ pat: 'pat', fetch: fetcher });

    const product = await client.products.get('product-42');

    expect(product.id).toBe('product-42');
    expect(fetcher.calls[0].input).toBe('https://api.shopier.com/v1/products/product-42');
  });

  it('should create signed webhook fixtures', () => {
    const fixture = createShopierWebhookFixture({
      token: 'secret',
      body: { id: 'order-1' },
    });

    expect(verifyAndParseWebhook({
      webhookToken: fixture.token,
      headers: fixture.headers,
      body: fixture.body,
    })).toMatchObject({
      type: 'order.created',
      data: { id: 'order-1' },
    });
  });

  it('should create valid OSB fixtures', () => {
    const fixture = createOsbFixture({
      payload: { orderid: 'order-1' },
    });

    expect(handleOsb(fixture)).toMatchObject({
      verified: true,
      payload: { orderId: 'order-1' },
    });
  });

  it('should classify invalid media URL API errors', async () => {
    const fetcher = createMockShopierFetch([
      {
        status: 400,
        statusText: 'Bad Request',
        body: {
          error: 'invalid',
          message: 'invalid media url : https://example.com/cover.png',
        },
      },
    ]);
    const client = new ShopierApiClient({ pat: 'pat', fetch: fetcher });

    await expect(client.products.create({
      title: 'Product',
      type: 'digital',
      media: [{ type: 'image', url: 'https://example.com/cover.png', placement: 1 }],
      priceData: { currency: 'TRY', price: '10.00' },
      shippingPayer: 'sellerPays',
    })).rejects.toBeInstanceOf(ShopierInvalidMediaUrlError);
  });
});
