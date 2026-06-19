import * as fc from 'fast-check';
import { generateSignature, verifySignature } from '../../src';

describe('Signature generation determinism', () => {
  const secretArb = fc.string({ minLength: 1, maxLength: 64 });
  const dataArb = fc.string({ minLength: 0, maxLength: 256 });

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
        return signature.length > 0 && /^[A-Za-z0-9+/]+=*$/.test(signature);
      }),
      { numRuns: 100 }
    );
  });
});
