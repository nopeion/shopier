/**
 * **Feature: shopier-sdk, Property 7: Callback Signature Verification**
 * **Validates: Requirements 4.2, 4.3**
 *
 * Property: For any callback body with a valid signature (computed from random_nr
 * and platform_order_id), verifyCallback SHALL return a CallbackResult with all
 * payment details; for any callback with an invalid signature, verifyCallback
 * SHALL throw SignatureValidationError.
 */

import * as fc from 'fast-check';
import { Shopier } from '../../src/core/shopier';
import { generateCallbackSignature } from '../../src/core/signature';
import { SignatureValidationError } from '../../src/errors';
import { CallbackBody } from '../../src/types';

describe('Property 7: Callback Signature Verification', () => {
  const apiSecret = 'test-api-secret';
  const validConfig = {
    apiKey: 'test-api-key',
    apiSecret,
  };

  // Arbitrary for valid callback body components
  const randomNrArb = fc.integer({ min: 100000, max: 999999 }).map(String);
  const orderIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const paymentIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const installmentArb = fc.integer({ min: 1, max: 12 }).map(String);
  const statusArb = fc.constantFrom('success', 'failed') as fc.Arbitrary<'success' | 'failed'>;

  it('should return CallbackResult with all payment details for valid signature', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        statusArb,
        (randomNr, orderId, paymentId, installment, status) => {
          const shopier = new Shopier(validConfig);

          // Generate valid signature
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment,
            status,
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          // Verify all fields are present and correct
          return (
            result.success === (status === 'success') &&
            result.orderId === orderId &&
            result.paymentId === paymentId &&
            result.installment === parseInt(installment, 10) &&
            result.platformOrderId === orderId &&
            result.status === status
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw SignatureValidationError for invalid signature', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        statusArb,
        fc.string({ minLength: 10, maxLength: 50 }), // Invalid signature
        (randomNr, orderId, paymentId, installment, status, invalidSignature) => {
          const shopier = new Shopier(validConfig);

          // Generate valid signature to ensure our invalid one is different
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          // Skip if by chance the random string matches the valid signature
          if (invalidSignature === validSignature) {
            return true;
          }

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment,
            status,
            signature: invalidSignature,
          };

          try {
            shopier.verifyCallback(callbackBody);
            return false; // Should have thrown
          } catch (error) {
            return (
              error instanceof SignatureValidationError &&
              error.code === 'SIGNATURE_VALIDATION_ERROR'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw SignatureValidationError without exposing signature details', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        (randomNr, orderId) => {
          const shopier = new Shopier(validConfig);
          const invalidSignature = 'invalid-signature-value';

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: 'payment-123',
            installment: '1',
            status: 'success',
            signature: invalidSignature,
          };

          try {
            shopier.verifyCallback(callbackBody);
            return false;
          } catch (error) {
            if (!(error instanceof SignatureValidationError)) {
              return false;
            }
            // Security: error.details should NOT contain expected/received signatures
            // to prevent signature exposure
            const details = error.details;
            return (
              details === undefined ||
              !('expected' in (details as object)) ||
              !('received' in (details as object))
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly parse installment as number', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        fc.integer({ min: 1, max: 12 }),
        (randomNr, orderId, installmentNum) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: 'payment-123',
            installment: String(installmentNum),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return (
            typeof result.installment === 'number' &&
            result.installment === installmentNum
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle tampered random_nr (signature mismatch)', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        randomNrArb,
        orderIdArb,
        (originalRandomNr, tamperedRandomNr, orderId) => {
          // Skip if they happen to be the same
          if (originalRandomNr === tamperedRandomNr) {
            return true;
          }

          const shopier = new Shopier(validConfig);

          // Generate signature with original random_nr
          const signature = generateCallbackSignature(apiSecret, originalRandomNr, orderId);

          // But send tampered random_nr
          const callbackBody: CallbackBody = {
            random_nr: tamperedRandomNr,
            platform_order_id: orderId,
            payment_id: 'payment-123',
            installment: '1',
            status: 'success',
            signature,
          };

          try {
            shopier.verifyCallback(callbackBody);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof SignatureValidationError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle tampered order_id (signature mismatch)', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        orderIdArb,
        (randomNr, originalOrderId, tamperedOrderId) => {
          // Skip if they happen to be the same
          if (originalOrderId === tamperedOrderId) {
            return true;
          }

          const shopier = new Shopier(validConfig);

          // Generate signature with original order_id
          const signature = generateCallbackSignature(apiSecret, randomNr, originalOrderId);

          // But send tampered order_id
          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: tamperedOrderId,
            payment_id: 'payment-123',
            installment: '1',
            status: 'success',
            signature,
          };

          try {
            shopier.verifyCallback(callbackBody);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof SignatureValidationError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
