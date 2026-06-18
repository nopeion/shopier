import { createHmac } from 'crypto';
import { ShopierOsbClient, handleOsb, parseOsbPayload, verifyOsb } from '../../src/osb';

describe('OSB helpers', () => {
  const username = 'osb-user';
  const password = 'osb-password';

  const makeRes = (payload: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

  const makeHash = (res: string) =>
    createHmac('sha256', password).update(`${res}${username}`).digest('hex');

  it('should reject missing res or hash', () => {
    expect(verifyOsb({ username, password, res: '', hash: 'hash' })).toEqual({
      verified: false,
      error: 'OSB res and hash are required',
    });

    expect(verifyOsb({ username, password, res: 'res', hash: '' })).toEqual({
      verified: false,
      error: 'OSB res and hash are required',
    });
  });

  it('should reject an invalid hash', () => {
    const res = makeRes({ orderid: '123' });

    expect(verifyOsb({ username, password, res, hash: '00' })).toEqual({
      verified: false,
      error: 'OSB hash verification failed',
    });
  });

  it('should verify and parse a valid payload', () => {
    const res = makeRes({
      orderid: '133325159',
      email: 'buyer@example.com',
      currency: '0',
      price: '149,00',
      buyer_name: 'Ada',
      buyer_surname: 'Lovelace',
      product_count: '2',
      product_id: 42,
      customer_note: 'note',
      is_test: '1',
    });
    const hash = makeHash(res);

    const result = handleOsb({ username, password, res, hash });

    expect(result.verified).toBe(true);
    expect(result.payload).toMatchObject({
      orderId: '133325159',
      email: 'buyer@example.com',
      currency: 'TL',
      price: 149,
      buyerName: 'Ada',
      buyerSurname: 'Lovelace',
      productCount: 2,
      productId: 42,
      customerNote: 'note',
      isTest: true,
    });
    expect(result.payload?.raw).toMatchObject({ orderid: '133325159' });
  });

  it.each([
    ['149', 149],
    ['149.00', 149],
    ['149,00', 149],
  ])('should normalize price %s', (price, expected) => {
    const payload = parseOsbPayload(makeRes({ price }));

    expect(payload.price).toBe(expected);
  });

  it.each([
    ['0', 'TL'],
    ['1', 'USD'],
    ['2', 'EUR'],
    ['GBP', 'GBP'],
  ])('should normalize currency %s', (currency, expected) => {
    const payload = parseOsbPayload(makeRes({ currency }));

    expect(payload.currency).toBe(expected);
  });

  it('should return false for timing-safe length mismatch path', () => {
    const res = makeRes({ orderid: '123' });

    expect(verifyOsb({ username, password, res, hash: 'abcd' }).verified).toBe(false);
  });

  it('should use named OSB credentials through ShopierOsbClient', () => {
    const originalEnv = { ...process.env };
    process.env.SHOPIER_OSB_PRIMARY_USERNAME = username;
    process.env.SHOPIER_OSB_PRIMARY_PASSWORD = password;

    try {
      const res = makeRes({ orderid: 'named-osb' });
      const client = new ShopierOsbClient({ credentialName: 'primary' });

      expect(client.handle({ res, hash: makeHash(res) })).toMatchObject({
        verified: true,
        payload: { orderId: 'named-osb' },
      });
    } finally {
      process.env = originalEnv;
    }
  });
});
