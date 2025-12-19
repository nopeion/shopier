import * as fc from 'fast-check';
import { validateConfig } from '../../src/core/validator';
import { InvalidApiKeyError, InvalidApiSecretError } from '../../src/errors';

/**
 * **Feature: shopier-sdk, Property 10: Missing Credentials Error**
 * **Validates: Requirements 5.1, 5.2**
 * 
 * *For any* configuration where API key is empty/undefined/null (and no env var), 
 * InvalidApiKeyError SHALL be thrown; *for any* configuration where API secret is 
 * empty/undefined/null (and no env var), InvalidApiSecretError SHALL be thrown.
 */
describe('Property 10: Missing Credentials Error', () => {
  // Store original env vars
  const originalApiKey = process.env.SHOPIER_API_KEY;
  const originalApiSecret = process.env.SHOPIER_API_SECRET;

  beforeEach(() => {
    // Clear env vars before each test
    delete process.env.SHOPIER_API_KEY;
    delete process.env.SHOPIER_API_SECRET;
  });

  afterAll(() => {
    // Restore original env vars
    if (originalApiKey !== undefined) {
      process.env.SHOPIER_API_KEY = originalApiKey;
    }
    if (originalApiSecret !== undefined) {
      process.env.SHOPIER_API_SECRET = originalApiSecret;
    }
  });

  it('should throw InvalidApiKeyError for any empty/undefined/null API key', () => {
    fc.assert(
      fc.property(
        // Generate empty-like values for API key
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('   '),
          fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 }) // whitespace strings
        ),
        // Generate valid API secret
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (apiKey, apiSecret) => {
          expect(() => validateConfig({ apiKey, apiSecret })).toThrow(InvalidApiKeyError);
        }
      ),
      { numRuns: 100 }
    );
  });


  it('should throw InvalidApiSecretError for any empty/undefined/null API secret when API key is valid', () => {
    fc.assert(
      fc.property(
        // Generate valid API key
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        // Generate empty-like values for API secret
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('   '),
          fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 }) // whitespace strings
        ),
        (apiKey, apiSecret) => {
          expect(() => validateConfig({ apiKey, apiSecret })).toThrow(InvalidApiSecretError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not throw for any valid API key and API secret combination', () => {
    fc.assert(
      fc.property(
        // Generate non-empty, non-whitespace strings
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (apiKey, apiSecret) => {
          expect(() => validateConfig({ apiKey, apiSecret })).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use env var fallback when config values are missing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (envApiKey, envApiSecret) => {
          process.env.SHOPIER_API_KEY = envApiKey;
          process.env.SHOPIER_API_SECRET = envApiSecret;
          
          // Should not throw when env vars are set
          expect(() => validateConfig({})).not.toThrow();
          
          // Clean up
          delete process.env.SHOPIER_API_KEY;
          delete process.env.SHOPIER_API_SECRET;
        }
      ),
      { numRuns: 100 }
    );
  });
});
