import * as fc from 'fast-check';
import { generateRandomNumber } from '../../src/utils';

/**
 * **Feature: shopier-sdk, Property 8: Random Number Generation**
 * **Validates: Requirements 4.4**
 * 
 * For any call to the random number generator without override,
 * the result SHALL be a 6-digit integer between 100000 and 999999 (inclusive).
 */
describe('Property 8: Random Number Generation', () => {
  const MIN_RANDOM = 100000;
  const MAX_RANDOM = 999999;

  it('should always generate a number within the valid 6-digit range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Just a dummy to run multiple iterations
        () => {
          const result = generateRandomNumber();
          return result >= MIN_RANDOM && result <= MAX_RANDOM;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always generate an integer (no decimals)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const result = generateRandomNumber();
          return Number.isInteger(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always generate exactly a 6-digit number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const result = generateRandomNumber();
          const digitCount = result.toString().length;
          return digitCount === 6;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid numbers that are not NaN or Infinity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const result = generateRandomNumber();
          return !isNaN(result) && isFinite(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate positive numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const result = generateRandomNumber();
          return result > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should demonstrate randomness by generating different values over multiple calls', () => {
    // Generate a set of random numbers and check that we get some variety
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(generateRandomNumber());
    }
    
    // With 50 calls, we should have at least 10 unique values
    // (probability of getting fewer is astronomically low for a good RNG)
    expect(results.size).toBeGreaterThan(10);
  });
});
