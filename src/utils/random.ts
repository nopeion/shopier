import { randomInt } from 'crypto';

/**
 * Minimum value for 6-digit random number (inclusive)
 */
const MIN_RANDOM = 100000;

/**
 * Maximum value for 6-digit random number (inclusive)
 */
const MAX_RANDOM = 999999;

/**
 * Generates a cryptographically secure 6-digit random number.
 * The result is always between 100000 and 999999 (inclusive).
 * 
 * @returns A 6-digit random integer
 */
export function generateRandomNumber(): number {
  // randomInt(min, max) returns a value where min is inclusive and max is exclusive
  // So we use MAX_RANDOM + 1 to make MAX_RANDOM inclusive
  return randomInt(MIN_RANDOM, MAX_RANDOM + 1);
}
