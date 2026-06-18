import { createHmac, timingSafeEqual } from 'crypto';

export interface OsbCredentials {
  username: string;
  password: string;
}

export interface VerifyOsbOptions extends OsbCredentials {
  res?: string;
  hash?: string;
}

export interface ParseOsbPayloadOptions {
  res: string;
}

export type OsbCurrency = 'TL' | 'USD' | 'EUR' | string;

export interface OsbPayload {
  orderId?: string;
  email?: string;
  currency?: OsbCurrency;
  price?: number;
  buyerName?: string;
  buyerSurname?: string;
  productCount?: number;
  productId?: unknown;
  customerNote?: string;
  isTest?: boolean;
  raw: Record<string, unknown>;
}

export interface VerifyOsbResult {
  verified: boolean;
  error?: string;
}

export interface HandleOsbResult {
  verified: boolean;
  payload?: OsbPayload;
  error?: string;
}

const CURRENCY_MAP: Record<string, OsbCurrency> = {
  '0': 'TL',
  '1': 'USD',
  '2': 'EUR',
};

export function verifyOsb(options: VerifyOsbOptions): VerifyOsbResult {
  const { res, hash, username, password } = options;

  if (!res || !hash) {
    return { verified: false, error: 'OSB res and hash are required' };
  }

  if (!username || !password) {
    return { verified: false, error: 'OSB username and password are required' };
  }

  const expectedHash = createHmac('sha256', password)
    .update(`${res}${username}`)
    .digest('hex');

  const verified = timingSafeCompareHex(expectedHash, hash);

  return {
    verified,
    ...(verified ? {} : { error: 'OSB hash verification failed' }),
  };
}

export function parseOsbPayload(res: string | ParseOsbPayloadOptions): OsbPayload {
  const encodedPayload = typeof res === 'string' ? res : res.res;
  const raw = parseBase64Json(encodedPayload);

  return {
    orderId: getString(raw, ['orderid', 'orderId', 'order_id', 'id']),
    email: getString(raw, ['email', 'buyer_email', 'buyerEmail']),
    currency: normalizeCurrency(raw.currency ?? raw.currency_id ?? raw.currencyId),
    price: normalizePrice(raw.price ?? raw.total_price ?? raw.totalPrice ?? raw.amount),
    buyerName: getString(raw, ['buyer_name', 'buyerName', 'name']),
    buyerSurname: getString(raw, ['buyer_surname', 'buyerSurname', 'surname']),
    productCount: normalizeInteger(raw.product_count ?? raw.productCount),
    productId: raw.product_id ?? raw.productId,
    customerNote: getString(raw, ['customer_note', 'customerNote', 'note']),
    isTest: normalizeBoolean(raw.is_test ?? raw.isTest ?? raw.test),
    raw,
  };
}

export function handleOsb(options: VerifyOsbOptions): HandleOsbResult {
  const verification = verifyOsb(options);

  if (!verification.verified) {
    return verification;
  }

  try {
    return {
      verified: true,
      payload: parseOsbPayload(options.res as string),
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'OSB payload parsing failed',
    };
  }
}

function timingSafeCompareHex(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

function parseBase64Json(res: string): Record<string, unknown> {
  try {
    const decoded = Buffer.from(res, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('OSB payload must be a JSON object');
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('OSB payload is not valid JSON');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('OSB payload parsing failed');
  }
}

function getString(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function normalizeCurrency(value: unknown): OsbCurrency | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const currency = String(value);
  return CURRENCY_MAP[currency] ?? currency;
}

function normalizePrice(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().replace(',', '.');
  if (normalized.length === 0) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}
