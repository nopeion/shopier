import { createHmac } from 'crypto';
import { generateSignature, verifySignature } from '../../src';

describe('Signature Module', () => {
  const testSecret = 'test-api-secret-key';
  const testData = 'test-data-string';

  describe('generateSignature', () => {
    it('should generate correct HMAC-SHA256 base64 signature', () => {
      const expectedSignature = createHmac('sha256', testSecret)
        .update(testData)
        .digest('base64');

      expect(generateSignature(testSecret, testData)).toBe(expectedSignature);
    });

    it('should produce consistent signatures for same inputs', () => {
      expect(generateSignature(testSecret, testData)).toBe(generateSignature(testSecret, testData));
    });

    it('should produce different signatures for different data', () => {
      expect(generateSignature(testSecret, 'data1')).not.toBe(generateSignature(testSecret, 'data2'));
    });

    it('should match a known HMAC-SHA256 test vector', () => {
      const result = generateSignature('key', 'The quick brown fox jumps over the lazy dog');

      expect(result).toBe('97yD9DBThCSxMpjmqm+xQ+9NWaFJRhdZl0edvC0aPNg=');
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const signature = generateSignature(testSecret, testData);

      expect(verifySignature(testSecret, testData, signature)).toBe(true);
    });

    it('should return false for invalid signature', () => {
      expect(verifySignature(testSecret, testData, 'invalid-signature')).toBe(false);
    });

    it('should return false for tampered data', () => {
      const signature = generateSignature(testSecret, testData);

      expect(verifySignature(testSecret, 'tampered-data', signature)).toBe(false);
    });
  });
});
