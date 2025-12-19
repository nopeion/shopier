import * as fc from 'fast-check';
import {
  generateSignature,
  verifySignature,
  generatePaymentSignature,
  generateCallbackSignature,
} from '../../src/core/signature';

/**
 * **Feature: shopier-sdk, Property 6: Signature Generation Determinism**
 * **Validates: Requirements 4.1**
 * 
 * For any given secret, random_nr, order_id, amount, and currency combination,
 * the generateSignature method SHALL always produce the same HMAC-SHA256 base64-encoded signature.
 */
describe('Property 6: Signature Generation Determinism', () => {
  // Arbitrary generators for signature inputs
  const secretArb = fc.string({ minLength: 1, maxLength: 64 });
  const dataArb = fc.string({ minLength: 0, maxLength: 256 });
  const randomNrArb = fc.integer({ min: 100000, max: 999999 });
  const orderIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true });
  const currencyArb = fc.integer({ min: 0, max: 2 });

  it('generateSignature should be deterministic for any secret and data', () => {
    fc.assert(
      fc.property(secretArb, dataArb, (secret, data) => {
        const sig1 = generateSignature(secret, data);
        const sig2 = generateSignature(secret, data);
        return sig1 === sig2;
      }),
      { numRuns: 100 }
    );
  });

  it('generatePaymentSignature should be deterministic for any payment parameters', () => {
    fc.assert(
      fc.property(
        secretArb,
        randomNrArb,
        orderIdArb,
        amountArb,
        currencyArb,
        (secret, randomNr, orderId, amount, currency) => {
          const sig1 = generatePaymentSignature(secret, randomNr, orderId, amount, currency);
          const sig2 = generatePaymentSignature(secret, randomNr, orderId, amount, currency);
          return sig1 === sig2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('generateCallbackSignature should be deterministic for any callback parameters', () => {
    fc.assert(
      fc.property(
        secretArb,
        randomNrArb.map(n => n.toString()),
        orderIdArb,
        (secret, randomNr, orderId) => {
          const sig1 = generateCallbackSignature(secret, randomNr, orderId);
          const sig2 = generateCallbackSignature(secret, randomNr, orderId);
          return sig1 === sig2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('verifySignature should always verify a signature generated with same inputs', () => {
    fc.assert(
      fc.property(secretArb, dataArb, (secret, data) => {
        const signature = generateSignature(secret, data);
        return verifySignature(secret, data, signature) === true;
      }),
      { numRuns: 100 }
    );
  });

  it('signature should always be a non-empty base64 string', () => {
    fc.assert(
      fc.property(secretArb, dataArb, (secret, data) => {
        const signature = generateSignature(secret, data);
        // Base64 strings contain only alphanumeric, +, /, and = characters
        const base64Regex = /^[A-Za-z0-9+/]+=*$/;
        return signature.length > 0 && base64Regex.test(signature);
      }),
      { numRuns: 100 }
    );
  });

  it('different inputs should produce different signatures', () => {
    fc.assert(
      fc.property(
        secretArb,
        dataArb,
        dataArb.filter(d => d.length > 0),
        (secret, data1, data2) => {
          // Only test when data1 !== data2
          if (data1 === data2) return true;
          
          const sig1 = generateSignature(secret, data1);
          const sig2 = generateSignature(secret, data2);
          return sig1 !== sig2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('different secrets should produce different signatures for same data', () => {
    fc.assert(
      fc.property(
        secretArb,
        secretArb,
        dataArb,
        (secret1, secret2, data) => {
          // Only test when secrets are different
          if (secret1 === secret2) return true;
          
          const sig1 = generateSignature(secret1, data);
          const sig2 = generateSignature(secret2, data);
          return sig1 !== sig2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
