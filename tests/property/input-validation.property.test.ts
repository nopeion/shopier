import * as fc from 'fast-check';
import { validateBuyer, validateAmount, validateEmail, validatePhone } from '../../src/core/validator';
import { ValidationError } from '../../src/errors';
import { BuyerInfo } from '../../src/types';

/**
 * **Feature: shopier-sdk, Property 11: Input Validation Errors**
 * **Validates: Requirements 5.3, 5.4, 5.5, 5.6**
 * 
 * *For any* buyer object missing required fields (id, firstName, lastName, email, phone, productName), 
 * ValidationError SHALL be thrown listing the missing fields; *for any* invalid email format, 
 * ValidationError SHALL be thrown; *for any* amount <= 0, ValidationError SHALL be thrown; 
 * *for any* invalid phone format, ValidationError SHALL be thrown.
 */
describe('Property 11: Input Validation Errors', () => {
  // Helper to generate valid buyer info
  const validBuyerArb = fc.record({
    id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    firstName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    lastName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress(),
    phone: fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 10, maxLength: 15 }),
    productName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  });

  describe('Missing required buyer fields', () => {
    const requiredFields: (keyof BuyerInfo)[] = ['id', 'firstName', 'lastName', 'email', 'phone', 'productName'];

    it('should throw ValidationError listing missing fields for any buyer with missing required fields', () => {
      fc.assert(
        fc.property(
          // Pick at least one field to make empty/missing
          fc.subarray(requiredFields, { minLength: 1 }),
          validBuyerArb,
          (fieldsToRemove, validBuyer) => {
            const invalidBuyer = { ...validBuyer } as Record<string, unknown>;
            
            // Remove selected fields
            for (const field of fieldsToRemove) {
              invalidBuyer[field] = '';
            }

            try {
              validateBuyer(invalidBuyer as unknown as BuyerInfo);
              return false; // Should have thrown
            } catch (error) {
              if (!(error instanceof ValidationError)) return false;
              const details = error.details as { missingFields?: string[] };
              // Check that all removed fields are in the missing fields list
              return fieldsToRemove.every(f => details.missingFields?.includes(f));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Invalid email format', () => {
    it('should return false for any string without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('@')),
          (invalidEmail) => {
            return validateEmail(invalidEmail) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for any string with @ but no domain part', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('@')),
          (localPart) => {
            return validateEmail(`${localPart}@`) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for any valid email format', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (validEmail) => {
            return validateEmail(validEmail) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid amount', () => {
    it('should throw ValidationError for any amount <= 0', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.double({ max: 0, noNaN: true }),
            fc.constant(0),
            fc.constant(-1),
            fc.constant(-0.01)
          ),
          (invalidAmount) => {
            expect(() => validateAmount(invalidAmount)).toThrow(ValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not throw for any positive amount', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, noNaN: true, noDefaultInfinity: true }),
          (validAmount) => {
            expect(() => validateAmount(validAmount)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid phone format', () => {
    it('should return false for any phone with less than 7 digits', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 1, maxLength: 6 }),
          (shortPhone) => {
            return validatePhone(shortPhone) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for any phone with 7-15 digits', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 7, maxLength: 15 }),
          (validPhone) => {
            return validatePhone(validPhone) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for phone numbers with valid formatting characters', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 10, maxLength: 12 }),
          (digits) => {
            // Add formatting characters
            const formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
            return validatePhone(formatted) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
