import {
  generateSignature,
  verifySignature,
  generatePaymentSignature,
  generateCallbackSignature,
} from '../../src/core/signature';
import { createHmac } from 'crypto';

describe('Signature Module', () => {
  // Known test vectors for HMAC-SHA256
  const testSecret = 'test-api-secret-key';
  const testData = 'test-data-string';

  describe('generateSignature', () => {
    it('should generate correct HMAC-SHA256 base64 signature', () => {
      // Compute expected signature using Node.js crypto directly
      const expectedSignature = createHmac('sha256', testSecret)
        .update(testData)
        .digest('base64');

      const result = generateSignature(testSecret, testData);

      expect(result).toBe(expectedSignature);
    });

    it('should produce consistent signatures for same inputs', () => {
      const sig1 = generateSignature(testSecret, testData);
      const sig2 = generateSignature(testSecret, testData);

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different data', () => {
      const sig1 = generateSignature(testSecret, 'data1');
      const sig2 = generateSignature(testSecret, 'data2');

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const sig1 = generateSignature('secret1', testData);
      const sig2 = generateSignature('secret2', testData);

      expect(sig1).not.toBe(sig2);
    });

    // Known test vector verification
    it('should match known HMAC-SHA256 test vector', () => {
      // Using a well-known test case
      const knownSecret = 'key';
      const knownData = 'The quick brown fox jumps over the lazy dog';
      // Correct base64 encoding of HMAC-SHA256
      const expectedBase64 = '97yD9DBThCSxMpjmqm+xQ+9NWaFJRhdZl0edvC0aPNg=';

      const result = generateSignature(knownSecret, knownData);
      expect(result).toBe(expectedBase64);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const signature = generateSignature(testSecret, testData);
      const result = verifySignature(testSecret, testData, signature);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const result = verifySignature(testSecret, testData, 'invalid-signature');

      expect(result).toBe(false);
    });

    it('should return false for tampered data', () => {
      const signature = generateSignature(testSecret, testData);
      const result = verifySignature(testSecret, 'tampered-data', signature);

      expect(result).toBe(false);
    });

    it('should return false for wrong secret', () => {
      const signature = generateSignature(testSecret, testData);
      const result = verifySignature('wrong-secret', testData, signature);

      expect(result).toBe(false);
    });
  });

  describe('generatePaymentSignature', () => {
    it('should generate signature from concatenated payment data', () => {
      const secret = 'payment-secret';
      const randomNr = 123456;
      const orderId = 'ORDER-001';
      const amount = 100.50;
      const currency = 0; // TL

      // Expected data string: randomNr + orderId + amount + currency
      const expectedData = `${randomNr}${orderId}${amount}${currency}`;
      const expectedSignature = generateSignature(secret, expectedData);

      const result = generatePaymentSignature(secret, randomNr, orderId, amount, currency);

      expect(result).toBe(expectedSignature);
    });

    it('should produce different signatures for different amounts', () => {
      const secret = 'payment-secret';
      const randomNr = 123456;
      const orderId = 'ORDER-001';
      const currency = 0;

      const sig1 = generatePaymentSignature(secret, randomNr, orderId, 100, currency);
      const sig2 = generatePaymentSignature(secret, randomNr, orderId, 200, currency);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different currencies', () => {
      const secret = 'payment-secret';
      const randomNr = 123456;
      const orderId = 'ORDER-001';
      const amount = 100;

      const sigTL = generatePaymentSignature(secret, randomNr, orderId, amount, 0);
      const sigUSD = generatePaymentSignature(secret, randomNr, orderId, amount, 1);

      expect(sigTL).not.toBe(sigUSD);
    });
  });

  describe('generateCallbackSignature', () => {
    it('should generate signature from concatenated callback data', () => {
      const secret = 'callback-secret';
      const randomNr = '654321';
      const orderId = 'ORDER-002';

      // Expected data string: randomNr + orderId
      const expectedData = `${randomNr}${orderId}`;
      const expectedSignature = generateSignature(secret, expectedData);

      const result = generateCallbackSignature(secret, randomNr, orderId);

      expect(result).toBe(expectedSignature);
    });

    it('should produce different signatures for different order IDs', () => {
      const secret = 'callback-secret';
      const randomNr = '654321';

      const sig1 = generateCallbackSignature(secret, randomNr, 'ORDER-001');
      const sig2 = generateCallbackSignature(secret, randomNr, 'ORDER-002');

      expect(sig1).not.toBe(sig2);
    });

    it('should handle string randomNr correctly', () => {
      const secret = 'callback-secret';
      const orderId = 'ORDER-001';

      // Callback randomNr comes as string from POST body
      const sig = generateCallbackSignature(secret, '123456', orderId);
      
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    });
  });
});
