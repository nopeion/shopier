import {
  ShopierApiClient,
  ShopierApiRequestError,
  ShopierError,
  ShopierRateLimitError,
  ShopierUnauthorizedPatError,
  createShopierApiError,
} from '../../src';
import type { ShopierRetryContext, ShopierRetryOptions } from '../../src';

describe('ShopierApiClient retries', () => {
  describe('idempotency policy', () => {
    it('should retry a 503 on GET and return the eventual success', async () => {
      const { client, fetcher } = createClient([
        error(503),
        error(503),
        json({ id: 'order-1' }),
      ]);

      await expect(client.categories.list()).resolves.toEqual({ id: 'order-1' });
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it.each([
      ['PUT', (c: ShopierApiClient) => c.categories.update('cat-1', { title: 'x' })],
      ['DELETE', (c: ShopierApiClient) => c.categories.delete('cat-1')],
    ])('should retry a 503 on %s', async (_method, call) => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })]);

      await call(client);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry a 503 on POST, because the request may already be applied', async () => {
      const { client, fetcher } = createClient([error(503), json({ id: 'refund-1' })]);

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' })
      ).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry a network failure on POST', async () => {
      const { client, fetcher } = createClient([networkFailure(), json({ id: 'refund-1' })]);

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' })
      ).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should retry a 429 on POST, because a rate limited request was never processed', async () => {
      const { client, fetcher } = createClient([error(429), json({ id: 'refund-1' })]);

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' })
      ).resolves.toEqual({ id: 'refund-1' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should retry a POST once retryNonIdempotent is opted into', async () => {
      const { client, fetcher } = createClient([error(503), json({ id: 'refund-1' })], {
        retryNonIdempotent: true,
      });

      await expect(
        client.refunds.create({ orderId: 'order-1', amount: '10.00' })
      ).resolves.toEqual({ id: 'refund-1' });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryable failures', () => {
    it.each([408, 429, 500, 502, 503, 504])('should retry HTTP %s', async (status) => {
      const { client, fetcher } = createClient([error(status), json({ ok: true })]);

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it.each([400, 401, 403, 404, 409, 422])('should not retry HTTP %s', async (status) => {
      const { client, fetcher } = createClient([error(status), json({ ok: true })]);

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should retry a network failure on GET', async () => {
      const { client, fetcher } = createClient([networkFailure(), json({ ok: true })]);

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should retry a per-attempt timeout on GET', async () => {
      const { client, fetcher } = createClient([timeoutFailure(), json({ ok: true })], {}, 5);

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should surface the final error once retries are exhausted', async () => {
      const { client, fetcher } = createClient([error(503), error(503), error(429)]);

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierRateLimitError);
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('should preserve the mapped error type across retries', async () => {
      const { client } = createClient([error(503), error(503), error(401)]);

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierUnauthorizedPatError);
    });

    // A custom fetch layer can map its own failures with the exported
    // createShopierApiError, producing a ShopierError that carries a status but
    // none of the client's internal reason tagging.
    it('should classify an externally built error by its status', async () => {
      const { client, fetcher } = createClient([
        async () => {
          throw createShopierApiError('gateway down', { status: 503 });
        },
        json({ ok: true }),
      ]);

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should treat an untagged, statusless error as a transport failure', async () => {
      const contexts: ShopierRetryContext[] = [];
      const { client } = createClient(
        [
          async () => {
            throw new ShopierApiRequestError('socket closed');
          },
          json({ ok: true }),
        ],
        { onRetry: (context) => contexts.push(context) }
      );

      await client.categories.list();

      expect(contexts[0]).toMatchObject({ reason: 'network', status: undefined });
    });
  });

  describe('retry budget', () => {
    it('should make a single attempt when retrying is disabled', async () => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })], { maxRetries: 0 });

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should default to two retries', async () => {
      const { client, fetcher } = createClient([error(503), error(503), error(503)]);

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('should honour a raised maxRetries', async () => {
      const { client, fetcher } = createClient(
        [error(503), error(503), error(503), json({ ok: true })],
        { maxRetries: 3 }
      );

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(4);
    });

    it('should treat a negative maxRetries as zero', async () => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })], { maxRetries: -5 });

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should let a per-request override beat the client configuration', async () => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })], { maxRetries: 0 });

      await client.request('/orders', { retry: { maxRetries: 1, baseDelayMs: 0 } });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('backoff', () => {
    it('should grow the delay exponentially with jitter', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const delays: number[] = [];
      const { client } = createClient([error(503), error(503), json({ ok: true })], {
        baseDelayMs: 100,
        onRetry: (context) => delays.push(context.delayMs),
      });

      await client.categories.list();

      // 0.5 jitter keeps 75% of the exponential term: 100 -> 75, 200 -> 150.
      expect(delays).toEqual([75, 150]);
      randomSpy.mockRestore();
    });

    it('should cap the exponential delay at maxDelayMs', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(1);
      const delays: number[] = [];
      const { client } = createClient([error(503), error(503), json({ ok: true })], {
        baseDelayMs: 1000,
        maxDelayMs: 10,
        onRetry: (context) => delays.push(context.delayMs),
      });

      await client.categories.list();

      expect(delays).toEqual([10, 10]);
      randomSpy.mockRestore();
    });
  });

  describe('Retry-After', () => {
    it.each([
      ['integer seconds', '2', 2000],
      ['fractional seconds', '0.25', 250],
      ['zero', '0', 0],
      ['negative seconds clamped to zero', '-5', 0],
    ])('should parse %s', async (_label, header, expected) => {
      const { client } = createClient([error(429, { 'retry-after': header })], { maxRetries: 0 });

      const failure = (await captureError(() => client.categories.list())) as ShopierError;

      expect(failure.details).toMatchObject({ retryAfterMs: expected });
    });

    it('should parse an HTTP date', async () => {
      const future = new Date(Date.now() + 30_000).toUTCString();
      const { client } = createClient([error(429, { 'retry-after': future })], { maxRetries: 0 });

      const failure = (await captureError(() => client.categories.list())) as ShopierError;
      const retryAfterMs = (failure.details as { retryAfterMs: number }).retryAfterMs;

      expect(retryAfterMs).toBeGreaterThan(25_000);
      expect(retryAfterMs).toBeLessThanOrEqual(30_000);
    });

    it('should clamp a past HTTP date to zero', async () => {
      const past = new Date(Date.now() - 30_000).toUTCString();
      const { client } = createClient([error(429, { 'retry-after': past })], { maxRetries: 0 });

      const failure = (await captureError(() => client.categories.list())) as ShopierError;

      expect(failure.details).toMatchObject({ retryAfterMs: 0 });
    });

    it('should ignore an unparseable value and fall back to backoff', async () => {
      const delays: number[] = [];
      const { client } = createClient([error(429, { 'retry-after': 'soon' }), json({ ok: true })], {
        baseDelayMs: 0,
        onRetry: (context) => delays.push(context.delayMs),
      });

      await client.categories.list();

      const failure = delays[0];
      expect(failure).toBe(0);
    });

    it('should prefer Retry-After over the computed backoff', async () => {
      const delays: number[] = [];
      const { client } = createClient([error(429, { 'retry-after': '0.05' }), json({ ok: true })], {
        baseDelayMs: 5000,
        onRetry: (context) => delays.push(context.delayMs),
      });

      await client.categories.list();

      expect(delays).toEqual([50]);
    });

    it('should cap Retry-After at maxDelayMs', async () => {
      const delays: number[] = [];
      const { client } = createClient([error(429, { 'retry-after': '600' }), json({ ok: true })], {
        maxDelayMs: 5,
        onRetry: (context) => delays.push(context.delayMs),
      });

      await client.categories.list();

      expect(delays).toEqual([5]);
    });
  });

  describe('cancellation', () => {
    it('should not retry when the caller aborts mid-flight', async () => {
      const controller = new AbortController();
      const fetcher = jest.fn(async (_url: string, init?: RequestInit) => {
        controller.abort();
        return neverResolving(init);
      }) as unknown as Fetcher;
      const client = new ShopierApiClient({
        personalAccessToken: 'pat',
        fetch: fetcher as unknown as typeof fetch,
        retry: { baseDelayMs: 0 },
      });

      const failure = (await captureError(() =>
        client.request('/orders', { signal: controller.signal })
      )) as ShopierError;

      expect(failure.message).toBe('Shopier API request was aborted');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should abort a pending backoff wait', async () => {
      const controller = new AbortController();
      const { client, fetcher } = createClient([error(503), json({ ok: true })], {
        baseDelayMs: 10_000,
      });

      const pending = client.request('/orders', { signal: controller.signal });
      await flush();
      controller.abort();

      await expect(pending).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should not accumulate abort listeners across attempts', async () => {
      const controller = new AbortController();
      const addSpy = jest.spyOn(controller.signal, 'addEventListener');
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
      const { client } = createClient([error(503), error(503), json({ ok: true })]);

      await client.request('/orders', { signal: controller.signal });

      expect(addSpy).toHaveBeenCalledTimes(3);
      expect(removeSpy).toHaveBeenCalledTimes(3);
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('hooks', () => {
    it('should describe the failure in the onRetry context', async () => {
      const contexts: ShopierRetryContext[] = [];
      const { client } = createClient([error(503), json({ ok: true })], {
        baseDelayMs: 0,
        onRetry: (context) => contexts.push(context),
      });

      await client.orders.get('order-1');

      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toMatchObject({
        attempt: 1,
        maxRetries: 2,
        method: 'GET',
        path: '/orders/order-1',
        status: 503,
        reason: 'http',
        retryable: true,
        delayMs: 0,
      });
      expect(contexts[0].error).toBeInstanceOf(ShopierError);
    });

    it('should report the transport reason for a network failure', async () => {
      const contexts: ShopierRetryContext[] = [];
      const { client } = createClient([networkFailure(), json({ ok: true })], {
        baseDelayMs: 0,
        onRetry: (context) => contexts.push(context),
      });

      await client.categories.list();

      expect(contexts[0]).toMatchObject({ reason: 'network', status: undefined });
    });

    it('should let shouldRetry widen the default policy', async () => {
      const { client, fetcher } = createClient([error(409), json({ ok: true })], {
        baseDelayMs: 0,
        shouldRetry: (context) => context.retryable || context.status === 409,
      });

      await client.categories.list();

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should let shouldRetry narrow the default policy', async () => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })], {
        baseDelayMs: 0,
        shouldRetry: () => false,
      });

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should not consult shouldRetry once the budget is spent', async () => {
      const shouldRetry = jest.fn(() => true);
      const { client, fetcher } = createClient([error(503), json({ ok: true })], {
        maxRetries: 0,
        shouldRetry,
      });

      await expect(client.categories.list()).rejects.toBeInstanceOf(ShopierApiRequestError);
      expect(shouldRetry).not.toHaveBeenCalled();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should not fire onRetry when nothing is retried', async () => {
      const onRetry = jest.fn();
      const { client } = createClient([json({ ok: true })], { onRetry });

      await client.categories.list();

      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe('request shape across retries', () => {
    it('should replay the identical url, method, headers and body', async () => {
      const { client, fetcher } = createClient([error(429), error(429), json({ id: 'r-1' })]);

      await client.refunds.create({ orderId: 'order-1', amount: '10.00' });

      const calls = fetcher.mock.calls;
      expect(calls).toHaveLength(3);
      expect(new Set(calls.map((call) => call[0]))).toEqual(
        new Set(['https://api.shopier.com/v1/refunds'])
      );
      expect(new Set(calls.map((call) => call[1]?.body))).toEqual(
        new Set([JSON.stringify({ orderId: 'order-1', amount: '10.00' })])
      );
      expect(new Set(calls.map((call) => call[1]?.method))).toEqual(new Set(['POST']));
    });

    it('should give each attempt a fresh timeout signal', async () => {
      const { client, fetcher } = createClient([error(503), json({ ok: true })], {}, 5000);

      await client.categories.list();

      const signals = fetcher.mock.calls.map((call) => call[1]?.signal);
      expect(signals[0]).toBeDefined();
      expect(signals[1]).toBeDefined();
      expect(signals[0]).not.toBe(signals[1]);
      expect(signals[0]?.aborted).toBe(false);
    });
  });
});

type Fetcher = jest.Mock<Promise<Response>, [string, RequestInit | undefined]>;

type Step = (init?: RequestInit) => Promise<Response>;

function createClient(
  steps: Step[],
  retry: ShopierRetryOptions = {},
  timeoutMs?: number
): { client: ShopierApiClient; fetcher: Fetcher } {
  const queue = [...steps];
  const fetcher = jest.fn(async (_url: string, init?: RequestInit) => {
    const step = queue.shift();

    if (!step) {
      throw new Error('Unexpected extra request: the response queue is empty');
    }

    return step(init);
  }) as unknown as Fetcher;

  const client = new ShopierApiClient({
    personalAccessToken: 'pat',
    fetch: fetcher as unknown as typeof fetch,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    // Keep the default backoff out of the way unless a test opts into it.
    retry: { baseDelayMs: 0, ...retry },
  });

  return { client, fetcher };
}

function json(body: unknown, status = 200): Step {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
}

function error(status: number, headers: Record<string, string> = {}): Step {
  return async () =>
    new Response(JSON.stringify({ message: `status ${status}` }), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });
}

function networkFailure(): Step {
  return async () => {
    throw new TypeError('fetch failed');
  };
}

function timeoutFailure(): Step {
  return (init) => neverResolving(init);
}

function neverResolving(init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;

    if (!signal) {
      return;
    }

    const fail = (): void => {
      const abort = new Error('The operation was aborted');
      abort.name = 'AbortError';
      reject(abort);
    };

    if (signal.aborted) {
      fail();
      return;
    }

    signal.addEventListener('abort', fail, { once: true });
  });
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (caught) {
    return caught;
  }

  throw new Error('Expected the call to reject');
}
