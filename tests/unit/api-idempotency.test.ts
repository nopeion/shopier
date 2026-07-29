import { ShopierApiClient, ShopierApiRequestError, createIdempotencyKey } from '../../src';

describe('ShopierApiClient idempotency keys', () => {
  describe('createIdempotencyKey', () => {
    it('should return a non-empty string', () => {
      expect(typeof createIdempotencyKey()).toBe('string');
      expect(createIdempotencyKey().length).toBeGreaterThan(0);
    });

    it('should return a different value on each call', () => {
      expect(createIdempotencyKey()).not.toBe(createIdempotencyKey());
    });
  });

  describe('header', () => {
    it('should send the Idempotency-Key header when supplied to a create call', async () => {
      const { client, fetcher } = createClient();

      await client.refunds.create(
        { orderId: 'order-1', amount: '10.00' },
        { idempotencyKey: 'refund-order-1' }
      );

      expect(initOf(fetcher).headers).toMatchObject({ 'Idempotency-Key': 'refund-order-1' });
    });

    it('should omit the header when no key is supplied', async () => {
      const { client, fetcher } = createClient();

      await client.refunds.create({ orderId: 'order-1', amount: '10.00' });

      expect(initOf(fetcher).headers).not.toHaveProperty('Idempotency-Key');
    });

    it('should let a caller-supplied header win over the option', async () => {
      const { client, fetcher } = createClient();

      await client.request('/refunds', {
        method: 'POST',
        body: { orderId: 'order-1' },
        idempotencyKey: 'from-option',
        headers: { 'Idempotency-Key': 'from-headers' },
      });

      expect(initOf(fetcher).headers).toMatchObject({ 'Idempotency-Key': 'from-headers' });
    });

    it('should attach the same key to every retried attempt', async () => {
      const fetcher = jest.fn()
        .mockResolvedValueOnce(error(503))
        .mockResolvedValueOnce(error(503))
        .mockResolvedValueOnce(json({ id: 'refund-1' })) as unknown as Fetcher;
      const client = new ShopierApiClient({
        personalAccessToken: 'pat',
        fetch: fetcher as unknown as typeof fetch,
        retry: { baseDelayMs: 0 },
      });

      await client.refunds.create(
        { orderId: 'order-1', amount: '10.00' },
        { idempotencyKey: 'stable-key' }
      );

      const keys = fetcher.mock.calls.map((call) => (call[1] as RequestInit & { headers: Record<string, string> }).headers['Idempotency-Key']);
      expect(keys).toEqual(['stable-key', 'stable-key', 'stable-key']);
    });
  });

  describe('retry eligibility', () => {
    it('should retry a POST that failed with a 503 when an idempotency key is present', async () => {
      const fetcher = jest.fn()
        .mockResolvedValueOnce(error(503))
        .mockResolvedValueOnce(json({ id: 'refund-1' })) as unknown as Fetcher;
      const client = new ShopierApiClient({
        personalAccessToken: 'pat',
        fetch: fetcher as unknown as typeof fetch,
        retry: { baseDelayMs: 0 },
      });

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' }, { idempotencyKey: 'key-1' })
      ).resolves.toEqual({ id: 'refund-1' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should retry a POST that failed with a network error when an idempotency key is present', async () => {
      // The key makes a repeat safe regardless of why the first attempt
      // failed, so this follows the same idempotent-method rules GET/PUT/
      // DELETE already get: network errors are retried.
      const fetcher = jest.fn()
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(json({ id: 'refund-1' })) as unknown as Fetcher;
      const client = new ShopierApiClient({
        personalAccessToken: 'pat',
        fetch: fetcher as unknown as typeof fetch,
        retry: { baseDelayMs: 0 },
      });

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' }, { idempotencyKey: 'key-1' })
      ).resolves.toEqual({ id: 'refund-1' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should still not retry a POST without a key and without retryNonIdempotent', async () => {
      const fetcher = jest.fn()
        .mockResolvedValueOnce(error(503))
        .mockResolvedValueOnce(json({ id: 'refund-1' })) as unknown as Fetcher;
      const client = new ShopierApiClient({
        personalAccessToken: 'pat',
        fetch: fetcher as unknown as typeof fetch,
        retry: { baseDelayMs: 0 },
      });

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' })
      ).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should pass the key through every namespace create method', async () => {
      const { client, fetcher } = createClient();
      const key = 'consistent-key';

      await client.categories.create({ title: 'Kitaplar' }, { idempotencyKey: key });
      await client.discounts.codes.create(
        {
          code: 'X',
          type: 'amount',
          amountOff: '1',
          amountMinimum: '1',
          currency: 'TRY',
          numAvailable: 1,
          expiresAt: '2026-01-01',
        },
        { idempotencyKey: key }
      );
      await client.discounts.automatic.create(
        {
          title: 'X',
          scope: 'all',
          type: 'amount',
          amountOff: '1',
          currency: 'TRY',
          requirement: 'amount',
          startsAt: '2026-01-01',
          expiresAt: '2026-02-01',
        },
        { idempotencyKey: key }
      );
      await client.selections.create({ variationId: 'v-1', title: 'X' }, { idempotencyKey: key });
      await client.shippings.create({ orderId: 'order-1', company: 'aras' }, { idempotencyKey: key });
      await client.variations.create({ title: 'X' }, { idempotencyKey: key });
      await client.webhooks.create({ event: 'order.created', url: 'https://example.com' }, { idempotencyKey: key });
      await client.products.create(
        {
          title: 'X',
          type: 'digital',
          media: [{ type: 'image', url: 'https://cdn.example.com/a.png', placement: 1 }],
          priceData: { currency: 'TRY', price: '1' },
          shippingPayer: 'sellerPays',
        },
        { idempotencyKey: key }
      );

      const keys = fetcher.mock.calls.map((call) => (call[1] as RequestInit & { headers: Record<string, string> }).headers['Idempotency-Key']);
      expect(keys).toEqual(Array(keys.length).fill(key));
      expect(keys.length).toBe(8);
    });

    it('should pass the key through the top-level convenience methods', async () => {
      const { client, fetcher } = createClient();

      await client.createRefund({ orderId: 'order-1', amount: '10.00' }, { idempotencyKey: 'r-1' });
      await client.createWebhook(
        { event: 'order.created', url: 'https://example.com' },
        { idempotencyKey: 'w-1' }
      );
      await client.createProduct(
        {
          title: 'X',
          type: 'digital',
          media: [{ type: 'image', url: 'https://cdn.example.com/a.png', placement: 1 }],
          priceData: { currency: 'TRY', price: '1' },
          shippingPayer: 'sellerPays',
        },
        { idempotencyKey: 'p-1' }
      );

      const keys = fetcher.mock.calls.map((call) => (call[1] as RequestInit & { headers: Record<string, string> }).headers['Idempotency-Key']);
      expect(keys).toEqual(['r-1', 'w-1', 'p-1']);
    });
  });
});

type Fetcher = jest.Mock<Promise<Response>, [string, RequestInit | undefined]>;

function createClient(): { client: ShopierApiClient; fetcher: Fetcher } {
  const fetcher = jest.fn(async () => json({ ok: true })) as unknown as Fetcher;
  const client = new ShopierApiClient({ personalAccessToken: 'pat', fetch: fetcher as unknown as typeof fetch });
  return { client, fetcher };
}

function initOf(fetcher: Fetcher): RequestInit & { headers: Record<string, string> } {
  expect(fetcher).toHaveBeenCalled();
  return fetcher.mock.calls[0][1] as RequestInit & { headers: Record<string, string> };
}

function json(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  );
}

function error(status: number): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify({ message: `status ${status}` }), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );
}
