import * as fc from 'fast-check';
import { validateInstallment } from '../../src/core/validator';
import { ValidationError } from '../../src/errors';

/**
 * **Feature: shopier-sdk, Property 2: Installment Limit Validation**
 * **Validates: Requirements 2.4**
 * 
 * *For any* installment value between 0 and 12 (inclusive), the System SHALL accept it; 
 * *for any* value outside this range, the System SHALL throw a ValidationError.
 * Note: 0 means no installment (single payment)
 */
describe('Property 2: Installment Limit Validation', () => {
  it('should accept any installment value between 0 and 12 (inclusive)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 12 }),
        (validInstallment) => {
          expect(() => validateInstallment(validInstallment)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw ValidationError for any installment value less than 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: -1 }),
        (invalidInstallment) => {
          expect(() => validateInstallment(invalidInstallment)).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw ValidationError for any installment value greater than 12', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 13 }),
        (invalidInstallment) => {
          expect(() => validateInstallment(invalidInstallment)).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw ValidationError for any non-integer installment value', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.01, max: 11.99, noNaN: true }).filter(n => !Number.isInteger(n)),
        (nonIntegerInstallment) => {
          expect(() => validateInstallment(nonIntegerInstallment)).toThrow(ValidationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});
