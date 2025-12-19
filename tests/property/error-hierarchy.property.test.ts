import * as fc from 'fast-check';
import {
  ShopierError,
  InvalidApiKeyError,
  InvalidApiSecretError,
  ValidationError,
  SignatureValidationError
} from '../../src/errors';

/**
 * **Feature: shopier-sdk, Property 12: Error Class Hierarchy**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 *
 * For any ShopierError subclass (InvalidApiKeyError, InvalidApiSecretError,
 * ValidationError, SignatureValidationError), it SHALL be an instance of
 * ShopierError and SHALL have code, message, and details properties.
 */
describe('Property 12: Error Class Hierarchy', () => {
  // Error class configurations with their expected codes
  const errorClasses = [
    { ErrorClass: InvalidApiKeyError, expectedCode: 'INVALID_API_KEY', name: 'InvalidApiKeyError' },
    { ErrorClass: InvalidApiSecretError, expectedCode: 'INVALID_API_SECRET', name: 'InvalidApiSecretError' },
    { ErrorClass: ValidationError, expectedCode: 'VALIDATION_ERROR', name: 'ValidationError' },
    { ErrorClass: SignatureValidationError, expectedCode: 'SIGNATURE_VALIDATION_ERROR', name: 'SignatureValidationError' }
  ];

  it('All error subclasses should be instances of ShopierError', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass }, message) => {
          const error = new ErrorClass(message);
          return error instanceof ShopierError;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should be instances of Error', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass }, message) => {
          const error = new ErrorClass(message);
          return error instanceof Error;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should have the correct error code', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass, expectedCode }, message) => {
          const error = new ErrorClass(message);
          return error.code === expectedCode;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should preserve the message property', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass }, message) => {
          const error = new ErrorClass(message);
          return error.message === message;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should have details property (undefined when not provided)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass }, message) => {
          const error = new ErrorClass(message);
          return 'details' in error && error.details === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should preserve details when provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string(), fc.jsonValue()),
        ({ ErrorClass }, message, details) => {
          const error = new ErrorClass(message, details);
          return error.details === details;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All error subclasses should have the correct name property', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...errorClasses),
        fc.string({ minLength: 1 }),
        ({ ErrorClass, name }, message) => {
          const error = new ErrorClass(message);
          return error.name === name;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ShopierError base class should have code, message, and details properties', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: undefined }),
        (message, code, details) => {
          const error = new ShopierError(message, code, details);
          return (
            error.message === message &&
            error.code === code &&
            error.details === details &&
            error instanceof Error
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
