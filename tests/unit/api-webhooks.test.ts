import { createHmac } from 'crypto';
import {
  ShopierApiClient,
  ShopierWebhookVerifier,
  SignatureValidationError,
  ValidationError,
  parseWebhookEvent,
  verifyAndParseWebhook,
  verifyWebhook,
} from '../../src';

describe('PAT API client and REST webhook helpers', () => {
  it('should require a personal access token', () => {
    expect(() => new ShopierApiClient({ personalAccessToken: '' })).toThrow(ValidationError);
  });

  it('should call documented order list endpoint with bearer auth and query params', async () => {
    const fetcher = jest.fn(async () => jsonResponse([
      { id: 'order-1', status: 'fulfilled' },
    ])) as unknown as typeof fetch;
    const client = new ShopierApiClient({
      personalAccessToken: 'pat-token',
      fetch: fetcher,
    });

    const orders = await client.orders.list({
      limit: 10,
      page: 2,
      fulfillmentStatus: 'fulfilled',
      customerEmail: 'buyer@example.com',
    });

    expect(orders).toEqual([{ id: 'order-1', status: 'fulfilled' }]);
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.shopier.com/v1/orders?limit=10&page=2&fulfillmentStatus=fulfilled&customerEmail=buyer%40example.com',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer pat-token',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should create refunds through the documented refund endpoint', async () => {
    const fetcher = jest.fn(async () => jsonResponse({
      id: 'refund-1',
      orderId: 'order-1',
      status: 'pending',
    })) as unknown as typeof fetch;
    const client = new ShopierApiClient({
      pat: 'pat-token',
      baseUrl: 'https://api.shopier.com/v1/',
      fetch: fetcher,
    });

    const refund = await client.createRefund({
      orderId: 'order-1',
      amount: '10.00',
      note: 'Customer requested refund',
    });

    expect(refund.id).toBe('refund-1');
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.shopier.com/v1/refunds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          orderId: 'order-1',
          amount: '10.00',
          note: 'Customer requested refund',
        }),
      })
    );
  });

  it('should expose every documented REST namespace', () => {
    const client = new ShopierApiClient({
      personalAccessToken: 'pat-token',
      fetch: jest.fn() as unknown as typeof fetch,
    });

    expect(client.balance.get).toBeDefined();
    expect(client.categories.create).toBeDefined();
    expect(client.discounts.codes.create).toBeDefined();
    expect(client.discounts.automatic.create).toBeDefined();
    expect(client.orders.getTransaction).toBeDefined();
    expect(client.payouts.transactions.list).toBeDefined();
    expect(client.products.update).toBeDefined();
    expect(client.refunds.create).toBeDefined();
    expect(client.selections.create).toBeDefined();
    expect(client.shippings.create).toBeDefined();
    expect(client.shop.updateSettings).toBeDefined();
    expect(client.variations.create).toBeDefined();
    expect(client.webhooks.create).toBeDefined();
  });

  it('should verify and parse REST webhook events with a hex HMAC signature', () => {
    const token = 'webhook-token';
    const body = JSON.stringify({ id: 'order-1', status: 'fulfilled' });
    const signature = createHmac('sha256', token).update(body).digest('hex');
    const headers = {
      'Shopier-Event': 'order.fulfilled',
      'Shopier-Webhook-Id': 'webhook-1',
      'Shopier-Timestamp': '1710000000',
      'Shopier-Signature': signature,
      'Shopier-Account-Id': 'account-1',
      'Shopier-Api-Version': 'v1',
    };

    const verification = verifyWebhook({ headers, body, webhookToken: token });
    const event = verifyAndParseWebhook<{ id: string; status: string }>({
      headers,
      body,
      webhookToken: token,
    });

    expect(verification).toMatchObject({
      verified: true,
      event: 'order.fulfilled',
      webhookId: 'webhook-1',
    });
    expect(event.type).toBe('order.fulfilled');
    expect(event.data.id).toBe('order-1');
    expect(event.headers?.accountId).toBe('account-1');
  });

  it('should reject invalid webhook signatures', () => {
    expect(() =>
      verifyWebhook({
        headers: { 'shopier-signature': 'invalid' },
        body: '{}',
        secret: 'webhook-token',
      })
    ).toThrow(SignatureValidationError);
  });

  it('should parse already decoded webhook payloads when event is in headers', () => {
    const parsed = parseWebhookEvent(
      { id: 'refund-1', status: 'pending' },
      { 'shopier-event': 'refund.requested' }
    );

    expect(parsed.type).toBe('refund.requested');
    expect(parsed.data).toMatchObject({ id: 'refund-1' });
  });

  it('should support reusable webhook verifier instances', () => {
    const token = 'webhook-token';
    const body = JSON.stringify({ id: 'product-1' });
    const signature = createHmac('sha256', token).update(body).digest('hex');
    const verifier = new ShopierWebhookVerifier(token);

    expect(verifier.parse({ 'shopier-event': 'product.created', 'shopier-signature': signature }, body))
      .toMatchObject({
        type: 'product.created',
        data: { id: 'product-1' },
      });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
