import {
  ShopierApiClient,
  ShopierApiRequestError,
  ShopierError,
  ShopierFetchUnavailableError,
  ShopierHostedCheckoutListingError,
  ShopierInvalidMediaUrlError,
  ShopierRateLimitError,
  ShopierUnauthorizedPatError,
  ValidationError,
} from '../../src';

const PAT_ENV_KEYS = [
  'SHOPIER_PAT',
  'SHOPIER_PERSONAL_ACCESS_TOKEN',
  'SHOPIER_ACCESS_TOKEN',
] as const;

const BASE = 'https://api.shopier.com/v1';

describe('ShopierApiClient', () => {
  const savedEnv = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of PAT_ENV_KEYS) {
      savedEnv.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of savedEnv) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    savedEnv.clear();
  });

  describe('credential resolution', () => {
    it('should reject a missing personal access token', () => {
      expect(() => new ShopierApiClient({})).toThrow(ValidationError);
    });

    it('should reject a whitespace-only personal access token', () => {
      expect(() => new ShopierApiClient({ personalAccessToken: '   ' })).toThrow(ValidationError);
    });

    it.each([
      ['personalAccessToken', { personalAccessToken: 'from-pat-field' }, 'from-pat-field'],
      ['pat', { pat: 'from-pat-alias' }, 'from-pat-alias'],
      ['accessToken', { accessToken: 'from-access-token' }, 'from-access-token'],
    ])('should accept the token from config.%s', async (_label, config, expected) => {
      const { client, fetcher } = createClient(config);

      await client.balance.get();

      expect(initOf(fetcher).headers).toMatchObject({
        Authorization: `Bearer ${expected}`,
      });
    });

    it('should prefer personalAccessToken over the pat and accessToken aliases', async () => {
      const { client, fetcher } = createClient({
        personalAccessToken: 'winner',
        pat: 'loser',
        accessToken: 'loser',
      });

      await client.balance.get();

      expect(initOf(fetcher).headers).toMatchObject({ Authorization: 'Bearer winner' });
    });

    it.each(PAT_ENV_KEYS)('should fall back to the %s environment variable', async (key) => {
      process.env[key] = `token-from-${key}`;
      const { client, fetcher } = createClient({});

      await client.balance.get();

      expect(initOf(fetcher).headers).toMatchObject({
        Authorization: `Bearer token-from-${key}`,
      });
    });

    it('should prefer SHOPIER_PAT over the other environment variables', async () => {
      process.env.SHOPIER_PAT = 'primary';
      process.env.SHOPIER_PERSONAL_ACCESS_TOKEN = 'secondary';
      process.env.SHOPIER_ACCESS_TOKEN = 'tertiary';
      const { client, fetcher } = createClient({});

      await client.balance.get();

      expect(initOf(fetcher).headers).toMatchObject({ Authorization: 'Bearer primary' });
    });

    it('should trim surrounding whitespace from the token', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: '  padded-token \n' });

      await client.balance.get();

      expect(initOf(fetcher).headers).toMatchObject({ Authorization: 'Bearer padded-token' });
    });
  });

  describe('base url handling', () => {
    it('should default to the documented v1 base url', () => {
      const { client } = createClient({ personalAccessToken: 'pat' });

      expect(client.baseUrl).toBe(BASE);
    });

    it('should strip trailing slashes from a custom base url', async () => {
      const { client, fetcher } = createClient({
        personalAccessToken: 'pat',
        baseUrl: 'https://sandbox.example.com/api///',
      });

      await client.balance.get();

      expect(client.baseUrl).toBe('https://sandbox.example.com/api');
      expect(urlOf(fetcher)).toBe('https://sandbox.example.com/api/balance');
    });

    it('should prefix a leading slash when the request path omits one', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('shop/owner');

      expect(urlOf(fetcher)).toBe(`${BASE}/shop/owner`);
    });
  });

  describe('endpoint coverage', () => {
    const cases: EndpointCase[] = [
      { name: 'balance.get', call: (c) => c.balance.get(), url: '/balance', method: 'GET' },
      {
        name: 'balance.transactions.list',
        call: (c) => c.balance.transactions.list({ limit: 5 }),
        url: '/balance/transactions?limit=5',
        method: 'GET',
      },
      {
        name: 'balance.transactions.get',
        call: (c) => c.balance.transactions.get('order-1'),
        url: '/balance/transactions/order-1',
        method: 'GET',
      },

      { name: 'categories.list', call: (c) => c.categories.list(), url: '/categories', method: 'GET' },
      {
        name: 'categories.create',
        call: (c) => c.categories.create({ title: 'Kitaplar' }),
        url: '/categories',
        method: 'POST',
        body: { title: 'Kitaplar' },
      },
      { name: 'categories.get', call: (c) => c.categories.get('cat-1'), url: '/categories/cat-1', method: 'GET' },
      {
        name: 'categories.update',
        call: (c) => c.categories.update('cat-1', { placement: 2 }),
        url: '/categories/cat-1',
        method: 'PUT',
        body: { placement: 2 },
      },
      {
        name: 'categories.delete',
        call: (c) => c.categories.delete('cat-1'),
        url: '/categories/cat-1',
        method: 'DELETE',
      },

      {
        name: 'discounts.codes.list',
        call: (c) => c.discounts.codes.list(),
        url: '/discounts/codes',
        method: 'GET',
      },
      {
        name: 'discounts.codes.create',
        call: (c) =>
          c.discounts.codes.create({
            code: 'YAZ25',
            type: 'percent',
            percentOff: '25',
            amountMinimum: '100.00',
            currency: 'TRY',
            numAvailable: 50,
            expiresAt: '2026-12-31',
          }),
        url: '/discounts/codes',
        method: 'POST',
        body: {
          code: 'YAZ25',
          type: 'percent',
          percentOff: '25',
          amountMinimum: '100.00',
          currency: 'TRY',
          numAvailable: 50,
          expiresAt: '2026-12-31',
        },
      },
      {
        name: 'discounts.codes.get',
        call: (c) => c.discounts.codes.get('code-1'),
        url: '/discounts/codes/code-1',
        method: 'GET',
      },
      {
        name: 'discounts.codes.update',
        call: (c) => c.discounts.codes.update('code-1', { numAvailable: 10 }),
        url: '/discounts/codes/code-1',
        method: 'PUT',
        body: { numAvailable: 10 },
      },
      {
        name: 'discounts.codes.delete',
        call: (c) => c.discounts.codes.delete('code-1'),
        url: '/discounts/codes/code-1',
        method: 'DELETE',
      },
      {
        name: 'discounts.automatic.list',
        call: (c) => c.discounts.automatic.list(),
        url: '/discounts/automatic',
        method: 'GET',
      },
      {
        name: 'discounts.automatic.create',
        call: (c) =>
          c.discounts.automatic.create({
            title: 'Sepette indirim',
            scope: 'all',
            type: 'amount',
            amountOff: '20.00',
            currency: 'TRY',
            requirement: 'amount',
            amountMinimum: '200.00',
            startsAt: '2026-07-01',
            expiresAt: '2026-08-01',
          }),
        url: '/discounts/automatic',
        method: 'POST',
        body: {
          title: 'Sepette indirim',
          scope: 'all',
          type: 'amount',
          amountOff: '20.00',
          currency: 'TRY',
          requirement: 'amount',
          amountMinimum: '200.00',
          startsAt: '2026-07-01',
          expiresAt: '2026-08-01',
        },
      },
      {
        name: 'discounts.automatic.get',
        call: (c) => c.discounts.automatic.get('auto-1'),
        url: '/discounts/automatic/auto-1',
        method: 'GET',
      },
      {
        name: 'discounts.automatic.update',
        call: (c) => c.discounts.automatic.update('auto-1', { expiresAt: '2026-09-01' }),
        url: '/discounts/automatic/auto-1',
        method: 'PUT',
        body: { expiresAt: '2026-09-01' },
      },
      {
        name: 'discounts.automatic.delete',
        call: (c) => c.discounts.automatic.delete('auto-1'),
        url: '/discounts/automatic/auto-1',
        method: 'DELETE',
      },

      { name: 'orders.list', call: (c) => c.orders.list(), url: '/orders', method: 'GET' },
      { name: 'orders.get', call: (c) => c.orders.get('order-1'), url: '/orders/order-1', method: 'GET' },
      {
        name: 'orders.update',
        call: (c) => c.orders.update('order-1', { shippingInfo: { city: 'Istanbul' } }),
        url: '/orders/order-1',
        method: 'PUT',
        body: { shippingInfo: { city: 'Istanbul' } },
      },
      {
        name: 'orders.fulfill',
        call: (c) => c.orders.fulfill('order-1', { shippingCompany: 'yurtici', trackingNumber: 'TR1' }),
        url: '/orders/order-1',
        method: 'PUT',
        body: { fulfillments: { shippingCompany: 'yurtici', trackingNumber: 'TR1' } },
      },
      {
        name: 'orders.getTransaction',
        call: (c) => c.orders.getTransaction('order-1'),
        url: '/orders/transactions/order-1',
        method: 'GET',
      },

      { name: 'payouts.list', call: (c) => c.payouts.list(), url: '/payouts', method: 'GET' },
      { name: 'payouts.get', call: (c) => c.payouts.get('payout-1'), url: '/payouts/payout-1', method: 'GET' },
      {
        name: 'payouts.transactions.list',
        call: (c) => c.payouts.transactions.list('payout-1', { page: 3 }),
        url: '/payouts/transactions/payout-1?page=3',
        method: 'GET',
      },

      {
        name: 'products.list',
        call: (c) => c.products.list({ productType: 'digital' }),
        url: '/products?productType=digital',
        method: 'GET',
      },
      {
        name: 'products.create',
        call: (c) =>
          c.products.create({
            title: 'E-kitap',
            type: 'digital',
            media: [{ type: 'image', url: 'https://cdn.example.com/a.png', placement: 1 }],
            priceData: { currency: 'TRY', price: '99.90' },
            shippingPayer: 'sellerPays',
          }),
        url: '/products',
        method: 'POST',
        body: {
          title: 'E-kitap',
          type: 'digital',
          media: [{ type: 'image', url: 'https://cdn.example.com/a.png', placement: 1 }],
          priceData: { currency: 'TRY', price: '99.90' },
          shippingPayer: 'sellerPays',
        },
      },
      { name: 'products.get', call: (c) => c.products.get('prod-1'), url: '/products/prod-1', method: 'GET' },
      {
        name: 'products.update',
        call: (c) => c.products.update('prod-1', { title: 'Yeni ad' }),
        url: '/products/prod-1',
        method: 'PUT',
        body: { title: 'Yeni ad' },
      },
      {
        name: 'products.delete',
        call: (c) => c.products.delete('prod-1'),
        url: '/products/prod-1',
        method: 'DELETE',
      },

      {
        name: 'refunds.list',
        call: (c) => c.refunds.list({ status: 'pending' }),
        url: '/refunds?status=pending',
        method: 'GET',
      },
      {
        name: 'refunds.create',
        call: (c) => c.refunds.create({ orderId: 'order-1', amount: '10.00' }),
        url: '/refunds',
        method: 'POST',
        body: { orderId: 'order-1', amount: '10.00' },
      },
      { name: 'refunds.get', call: (c) => c.refunds.get('refund-1'), url: '/refunds/refund-1', method: 'GET' },

      {
        name: 'selections.list',
        call: (c) => c.selections.list({ variationId: 'var-1' }),
        url: '/selections?variationId=var-1',
        method: 'GET',
      },
      {
        name: 'selections.create',
        call: (c) => c.selections.create({ variationId: 'var-1', title: 'Kirmizi' }),
        url: '/selections',
        method: 'POST',
        body: { variationId: 'var-1', title: 'Kirmizi' },
      },
      { name: 'selections.get', call: (c) => c.selections.get('sel-1'), url: '/selections/sel-1', method: 'GET' },
      {
        name: 'selections.update',
        call: (c) => c.selections.update('sel-1', { title: 'Mavi' }),
        url: '/selections/sel-1',
        method: 'PUT',
        body: { title: 'Mavi' },
      },
      {
        name: 'selections.delete',
        call: (c) => c.selections.delete('sel-1'),
        url: '/selections/sel-1',
        method: 'DELETE',
      },

      {
        name: 'shippings.list',
        call: (c) => c.shippings.list({ status: 'shipped' }),
        url: '/shippings?status=shipped',
        method: 'GET',
      },
      {
        name: 'shippings.create',
        call: (c) => c.shippings.create({ orderId: 'order-1', company: 'aras' }),
        url: '/shippings',
        method: 'POST',
        body: { orderId: 'order-1', company: 'aras' },
      },
      { name: 'shippings.get', call: (c) => c.shippings.get('ship-1'), url: '/shippings/ship-1', method: 'GET' },
      {
        name: 'shippings.delete',
        call: (c) => c.shippings.delete('ship-1'),
        url: '/shippings/ship-1',
        method: 'DELETE',
      },

      { name: 'shop.getOwner', call: (c) => c.shop.getOwner(), url: '/shop/owner', method: 'GET' },
      { name: 'shop.getSettings', call: (c) => c.shop.getSettings(), url: '/shop/settings', method: 'GET' },
      {
        name: 'shop.updateSettings',
        call: (c) => c.shop.updateSettings({ title: 'Magazam', vacation: false }),
        url: '/shop/settings',
        method: 'PUT',
        body: { title: 'Magazam', vacation: false },
      },

      {
        name: 'variations.list',
        call: (c) => c.variations.list({ limit: 15 }),
        url: '/variations?limit=15',
        method: 'GET',
      },
      {
        name: 'variations.create',
        call: (c) => c.variations.create({ title: 'Renk' }),
        url: '/variations',
        method: 'POST',
        body: { title: 'Renk' },
      },
      { name: 'variations.get', call: (c) => c.variations.get('var-1'), url: '/variations/var-1', method: 'GET' },
      {
        name: 'variations.update',
        call: (c) => c.variations.update('var-1', { title: 'Beden' }),
        url: '/variations/var-1',
        method: 'PUT',
        body: { title: 'Beden' },
      },
      {
        name: 'variations.delete',
        call: (c) => c.variations.delete('var-1'),
        url: '/variations/var-1',
        method: 'DELETE',
      },

      {
        name: 'webhooks.list',
        call: (c) => c.webhooks.list({ limit: 20 }),
        url: '/webhooks?limit=20',
        method: 'GET',
      },
      {
        name: 'webhooks.create',
        call: (c) => c.webhooks.create({ event: 'order.created', url: 'https://example.com/hook' }),
        url: '/webhooks',
        method: 'POST',
        body: { event: 'order.created', url: 'https://example.com/hook' },
      },
      {
        name: 'webhooks.delete',
        call: (c) => c.webhooks.delete('hook-1'),
        url: '/webhooks/hook-1',
        method: 'DELETE',
      },
    ];

    it.each(cases)('should call $method $url for $name', async ({ call, url, method, body }) => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await call(client);

      const init = initOf(fetcher);
      expect(urlOf(fetcher)).toBe(`${BASE}${url}`);
      expect(init.method).toBe(method);
      expect(init.headers).toMatchObject({
        Authorization: 'Bearer pat',
        Accept: 'application/json',
      });

      if (body === undefined) {
        expect(init.body).toBeUndefined();
        expect(init.headers).not.toHaveProperty('Content-Type');
      } else {
        expect(init.body).toBe(JSON.stringify(body));
        expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
      }
    });

    it('should cover every documented namespace in the endpoint table', () => {
      const covered = new Set(cases.map((entry) => entry.name.split('.')[0]));

      expect([...covered].sort()).toEqual([
        'balance',
        'categories',
        'discounts',
        'orders',
        'payouts',
        'products',
        'refunds',
        'selections',
        'shippings',
        'shop',
        'variations',
        'webhooks',
      ]);
    });
  });

  describe('convenience methods', () => {
    it.each([
      ['getBalance', (c: ShopierApiClient) => c.getBalance(), '/balance', 'GET'],
      ['listOrders', (c: ShopierApiClient) => c.listOrders(), '/orders', 'GET'],
      ['getOrder', (c: ShopierApiClient) => c.getOrder('order-1'), '/orders/order-1', 'GET'],
      [
        'fulfillOrder',
        (c: ShopierApiClient) => c.fulfillOrder('order-1', { note: 'kargolandi' }),
        '/orders/order-1',
        'PUT',
      ],
      ['listProducts', (c: ShopierApiClient) => c.listProducts(), '/products', 'GET'],
      [
        'createProduct',
        (c: ShopierApiClient) =>
          c.createProduct({
            title: 'Urun',
            type: 'physical',
            media: [{ type: 'image', url: 'https://cdn.example.com/a.png', placement: 1 }],
            priceData: { currency: 'TRY', price: '10.00' },
            shippingPayer: 'buyerPays',
          }),
        '/products',
        'POST',
      ],
      ['getProduct', (c: ShopierApiClient) => c.getProduct('prod-1'), '/products/prod-1', 'GET'],
      ['deleteProduct', (c: ShopierApiClient) => c.deleteProduct('prod-1'), '/products/prod-1', 'DELETE'],
      [
        'createRefund',
        (c: ShopierApiClient) => c.createRefund({ orderId: 'order-1', amount: '5.00' }),
        '/refunds',
        'POST',
      ],
      ['listRefunds', (c: ShopierApiClient) => c.listRefunds(), '/refunds', 'GET'],
      [
        'createWebhook',
        (c: ShopierApiClient) => c.createWebhook({ event: 'refund.updated', url: 'https://example.com/h' }),
        '/webhooks',
        'POST',
      ],
    ])('should proxy %s to the namespace method', async (_name, call, path, method) => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await call(client);

      expect(urlOf(fetcher)).toBe(`${BASE}${path}`);
      expect(initOf(fetcher).method).toBe(method);
    });
  });

  describe('query serialization', () => {
    it('should skip null and undefined values', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', {
        query: { limit: 10, page: undefined, customerEmail: null },
      });

      expect(urlOf(fetcher)).toBe(`${BASE}/orders?limit=10`);
    });

    it('should omit the query string entirely when every value is empty', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', { query: { limit: undefined } });

      expect(urlOf(fetcher)).toBe(`${BASE}/orders`);
    });

    it('should repeat array values under the same key', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/products', { query: { categoryId: ['a', 'b', 'c'] } });

      expect(urlOf(fetcher)).toBe(`${BASE}/products?categoryId=a&categoryId=b&categoryId=c`);
    });

    it('should serialize Date values as ISO strings', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', { query: { dateStart: new Date('2026-07-01T00:00:00.000Z') } });

      expect(urlOf(fetcher)).toBe(`${BASE}/orders?dateStart=2026-07-01T00%3A00%3A00.000Z`);
    });

    it('should serialize booleans and numbers', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/products', { query: { discount: true, customListing: false, limit: 0 } });

      expect(urlOf(fetcher)).toBe(`${BASE}/products?discount=true&customListing=false&limit=0`);
    });

    it('should percent-encode reserved characters in query values', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', { query: { customerEmail: 'a+b@example.com' } });

      expect(urlOf(fetcher)).toBe(`${BASE}/orders?customerEmail=a%2Bb%40example.com`);
    });
  });

  describe('path parameters', () => {
    // NOTE: blank-id validation is inconsistent by construction. Namespace methods
    // declared `async` (every `delete`) surface it as a rejection, while the plain
    // arrow functions throw synchronously before a promise ever exists.
    it.each([
      ['products.get', (c: ShopierApiClient) => c.products.get('')],
      ['orders.get', (c: ShopierApiClient) => c.orders.get('   ')],
      ['refunds.get', (c: ShopierApiClient) => c.refunds.get('')],
      ['categories.update', (c: ShopierApiClient) => c.categories.update('', { title: 'x' })],
      ['balance.transactions.get', (c: ShopierApiClient) => c.balance.transactions.get('')],
    ])('should throw synchronously for a blank path parameter in %s', (_name, call) => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      expect(() => call(client)).toThrow(ValidationError);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it.each([
      ['webhooks.delete', (c: ShopierApiClient) => c.webhooks.delete('')],
      ['products.delete', (c: ShopierApiClient) => c.products.delete('   ')],
      ['selections.delete', (c: ShopierApiClient) => c.selections.delete('')],
      ['shippings.delete', (c: ShopierApiClient) => c.shippings.delete('')],
    ])('should reject a blank path parameter in %s', async (_name, call) => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await expect(call(client)).rejects.toThrow(ValidationError);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should percent-encode path parameters', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.products.get('a/b?c#d');

      expect(urlOf(fetcher)).toBe(`${BASE}/products/a%2Fb%3Fc%23d`);
    });
  });

  describe('response body decoding', () => {
    it('should return the parsed JSON body', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ id: 'order-1', totals: { total: '10.00' } })
      );

      await expect(client.orders.get('order-1')).resolves.toEqual({
        id: 'order-1',
        totals: { total: '10.00' },
      });
    });

    it('should return undefined for a 204 response', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => new Response(null, { status: 204 })
      );

      await expect(client.request('/products/prod-1')).resolves.toBeUndefined();
    });

    it('should return undefined when content-length is zero', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => new Response('', { status: 200, headers: { 'content-length': '0' } })
      );

      await expect(client.request('/products/prod-1')).resolves.toBeUndefined();
    });

    it('should return undefined for an empty body without content-length', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => new Response('', { status: 200 })
      );

      await expect(client.request('/products/prod-1')).resolves.toBeUndefined();
    });

    it('should return raw text when the body is not JSON', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => new Response('plain text body', { status: 200 })
      );

      await expect(client.request('/products/prod-1')).resolves.toBe('plain text body');
    });
  });

  describe('error mapping', () => {
    it.each([
      [401, ShopierUnauthorizedPatError],
      [403, ShopierUnauthorizedPatError],
      [429, ShopierRateLimitError],
      [400, ShopierApiRequestError],
      [404, ShopierApiRequestError],
      [500, ShopierApiRequestError],
      [503, ShopierApiRequestError],
    ])('should map HTTP %s to the documented error type', async (status, expected) => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ message: 'nope' }, status)
      );

      await expect(client.orders.list()).rejects.toBeInstanceOf(expected);
    });

    it('should surface status, statusText, and body on the error details', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ message: 'Order not found' }, 404)
      );

      const error = await captureError(() => client.orders.get('missing'));

      expect(error).toBeInstanceOf(ShopierApiRequestError);
      expect((error as ShopierError).details).toMatchObject({
        status: 404,
        body: { message: 'Order not found' },
      });
    });

    it.each([
      ['message', { message: 'Token expired' }],
      ['error_description', { error_description: 'Token expired' }],
      ['error', { error: 'Token expired' }],
    ])('should lift the API message from the %s field', async (_field, body) => {
      const { client } = createClient({ personalAccessToken: 'pat' }, () => jsonResponse(body, 401));

      const error = await captureError(() => client.orders.list());

      expect((error as Error).message).toBe('Token expired');
    });

    it('should keep the generic message when the body carries no API message', async () => {
      const { client } = createClient({ personalAccessToken: 'pat' }, () => jsonResponse([], 500));

      const error = await captureError(() => client.orders.list());

      expect((error as Error).message).toBe('Shopier API response was not successful');
    });

    it('should map an invalid media url message to ShopierInvalidMediaUrlError', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ message: 'Invalid media URL supplied' }, 422)
      );

      await expect(
        client.products.create({
          title: 'Urun',
          type: 'physical',
          media: [{ type: 'image', url: 'not-a-url', placement: 1 }],
          priceData: { currency: 'TRY', price: '10.00' },
          shippingPayer: 'buyerPays',
        })
      ).rejects.toBeInstanceOf(ShopierInvalidMediaUrlError);
    });

    it.each([
      ['English', 'Product listing must be active'],
      ['Turkish', 'Ürün listelemesi aktif olmalıdır'],
      ['diacritic-free Turkish', 'Urun listelemesi aktif olmalidir'],
    ])('should map a %s listing message to ShopierHostedCheckoutListingError', async (_label, message) => {
      const { client } = createClient({ personalAccessToken: 'pat' }, () => jsonResponse({ message }, 422));

      await expect(client.orders.list()).rejects.toBeInstanceOf(ShopierHostedCheckoutListingError);
    });

    it('should prefer the unauthorized mapping over message-based mapping', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ message: 'Invalid media URL' }, 401)
      );

      await expect(client.orders.list()).rejects.toBeInstanceOf(ShopierUnauthorizedPatError);
    });

    it('should redact sensitive detail fields when logging safely', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat' },
        () => jsonResponse({ message: 'nope', token: 'secret-value' }, 401)
      );

      const error = (await captureError(() => client.orders.list())) as ShopierError;

      expect(error.toSafeJSON()).toMatchObject({
        code: 'SHOPIER_UNAUTHORIZED_PAT',
        name: 'ShopierUnauthorizedPatError',
      });
    });
  });

  describe('transport failures', () => {
    it('should throw ShopierFetchUnavailableError when no fetch implementation exists', async () => {
      const originalFetch = globalThis.fetch;
      // @ts-expect-error simulate a runtime without global fetch
      delete globalThis.fetch;

      try {
        const client = new ShopierApiClient({ personalAccessToken: 'pat' });
        await expect(client.balance.get()).rejects.toBeInstanceOf(ShopierFetchUnavailableError);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should wrap a network failure in ShopierApiRequestError with the cause', async () => {
      const { client } = createClient({ personalAccessToken: 'pat' }, () => {
        throw new TypeError('fetch failed');
      });

      const error = await captureError(() => client.orders.list());

      expect(error).toBeInstanceOf(ShopierApiRequestError);
      expect((error as ShopierError).details).toMatchObject({ cause: 'fetch failed' });
    });

    it('should stringify a non-Error rejection reason', async () => {
      const { client } = createClient({ personalAccessToken: 'pat' }, () => {
        throw 'socket hang up';
      });

      const error = await captureError(() => client.orders.list());

      expect((error as ShopierError).details).toMatchObject({ cause: 'socket hang up' });
    });

    it('should rethrow a ShopierError raised by a custom fetch implementation untouched', async () => {
      const thrown = new ShopierRateLimitError('slow down');
      const { client } = createClient({ personalAccessToken: 'pat' }, () => {
        throw thrown;
      });

      await expect(client.orders.list()).rejects.toBe(thrown);
    });
  });

  describe('timeouts and cancellation', () => {
    it('should default to a 15 second timeout', () => {
      const { client } = createClient({ personalAccessToken: 'pat' });

      expect(client.timeoutMs).toBe(15000);
    });

    it('should abort and report a timeout error once timeoutMs elapses', async () => {
      const { client } = createClient(
        { personalAccessToken: 'pat', timeoutMs: 5 },
        (_url, init) => neverResolving(init)
      );

      const error = await captureError(() => client.orders.list());

      expect(error).toBeInstanceOf(ShopierApiRequestError);
      expect((error as Error).message).toBe('Shopier API request timed out');
      expect((error as ShopierError).details).toMatchObject({ timeoutMs: 5 });
    });

    it('should not attach a signal when timeouts are disabled and no signal is supplied', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat', timeoutMs: 0 });

      await client.orders.list();

      expect(initOf(fetcher).signal).toBeUndefined();
    });

    it('should abort immediately when the caller signal is already aborted', async () => {
      const { client, fetcher } = createClient(
        { personalAccessToken: 'pat', timeoutMs: 0 },
        (_url, init) => neverResolving(init)
      );

      await expect(
        client.request('/orders', { signal: AbortSignal.abort() })
      ).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(initOf(fetcher).signal?.aborted).toBe(true);
    });

    it('should abort when the caller signal fires mid-flight', async () => {
      const controller = new AbortController();
      const { client } = createClient(
        { personalAccessToken: 'pat', timeoutMs: 0 },
        (_url, init) => neverResolving(init)
      );

      const pending = client.request('/orders', { signal: controller.signal });
      controller.abort();

      await expect(pending).rejects.toBeInstanceOf(ShopierApiRequestError);
    });

    it('should clear the timeout after a successful response', async () => {
      const clearSpy = jest.spyOn(global, 'clearTimeout');
      const { client } = createClient({ personalAccessToken: 'pat', timeoutMs: 5000 });

      await client.orders.list();

      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });

  describe('request options', () => {
    it('should merge caller supplied headers', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', { headers: { 'X-Request-Id': 'req-1' } });

      expect(initOf(fetcher).headers).toMatchObject({
        Authorization: 'Bearer pat',
        'X-Request-Id': 'req-1',
      });
    });

    it('should let the caller override the Content-Type header', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', {
        method: 'POST',
        body: { a: 1 },
        headers: { 'Content-Type': 'application/vnd.shopier+json' },
      });

      expect(initOf(fetcher).headers).toMatchObject({
        'Content-Type': 'application/vnd.shopier+json',
      });
    });

    it('should default to GET when no method is supplied', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders');

      expect(initOf(fetcher).method).toBe('GET');
    });

    it('should send a JSON body for explicitly falsy payloads', async () => {
      const { client, fetcher } = createClient({ personalAccessToken: 'pat' });

      await client.request('/orders', { method: 'POST', body: null });

      expect(initOf(fetcher).body).toBe('null');
      expect(initOf(fetcher).headers).toMatchObject({ 'Content-Type': 'application/json' });
    });
  });
});

interface EndpointCase {
  readonly name: string;
  readonly call: (client: ShopierApiClient) => Promise<unknown>;
  readonly url: string;
  readonly method: string;
  readonly body?: unknown;
}

type Fetcher = jest.Mock<Promise<Response>, [string, RequestInit | undefined]>;

function createClient(
  config: Record<string, unknown>,
  respond: (url: string, init?: RequestInit) => Response | Promise<Response> = () => jsonResponse({ ok: true })
): { client: ShopierApiClient; fetcher: Fetcher } {
  const fetcher = jest.fn(async (url: string, init?: RequestInit) =>
    respond(url, init)
  ) as unknown as Fetcher;

  const client = new ShopierApiClient({
    ...config,
    fetch: fetcher as unknown as typeof fetch,
  });

  return { client, fetcher };
}

function urlOf(fetcher: Fetcher): string {
  expect(fetcher).toHaveBeenCalled();
  return fetcher.mock.calls[0][0];
}

function initOf(fetcher: Fetcher): RequestInit & { headers: Record<string, string> } {
  expect(fetcher).toHaveBeenCalled();
  return fetcher.mock.calls[0][1] as RequestInit & { headers: Record<string, string> };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function neverResolving(init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;

    if (!signal) {
      return;
    }

    if (signal.aborted) {
      reject(abortError());
      return;
    }

    signal.addEventListener('abort', () => reject(abortError()), { once: true });
  });
}

function abortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }

  throw new Error('Expected the call to reject');
}
