/**
 * **Feature: shopier-sdk, Property 13: Successful Callback Response**
 * **Validates: Requirements 8.1, 8.2**
 *
 * Property: For any callback with status='success' and valid signature, the result
 * SHALL contain orderId, paymentId, installment (as number), platformOrderId,
 * and status='success'.
 */

import * as fc from 'fast-check';
import { Shopier } from '../../src/core/shopier';
import { generateCallbackSignature } from '../../src/core/signature';
import { CallbackBody } from '../../src/types';

describe('Property 13: Successful Callback Response', () => {
  const apiSecret = 'test-api-secret';
  const validConfig = {
    apiKey: 'test-api-key',
    apiSecret,
  };

  // Arbitraries for callback body components
  const randomNrArb = fc.integer({ min: 100000, max: 999999 }).map(String);
  const orderIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const paymentIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const installmentArb = fc.integer({ min: 1, max: 12 });

  it('should return result with orderId for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.orderId === orderId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with paymentId for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.paymentId === paymentId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with installment as number for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return (
            typeof result.installment === 'number' &&
            result.installment === installment
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with platformOrderId for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.platformOrderId === orderId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with status="success" for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.status === 'success';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with success=true for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return complete CallbackResult structure for successful callback', () => {
    fc.assert(
      fc.property(
        randomNrArb,
        orderIdArb,
        paymentIdArb,
        installmentArb,
        (randomNr, orderId, paymentId, installment) => {
          const shopier = new Shopier(validConfig);
          const validSignature = generateCallbackSignature(apiSecret, randomNr, orderId);

          const callbackBody: CallbackBody = {
            random_nr: randomNr,
            platform_order_id: orderId,
            payment_id: paymentId,
            installment: String(installment),
            status: 'success',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          // Verify complete structure
          return (
            result.success === true &&
            result.orderId === orderId &&
            result.paymentId === paymentId &&
            result.installment === installment &&
            result.platformOrderId === orderId &&
            result.status === 'success'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
