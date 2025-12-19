/**
 * **Feature: shopier-sdk, Property 14: Failed Callback Response**
 * **Validates: Requirements 8.3**
 *
 * Property: For any callback with status='failed' and valid signature, the result
 * SHALL contain a structured response with status='failed' and the original order
 * information.
 */

import * as fc from 'fast-check';
import { Shopier } from '../../src/core/shopier';
import { generateCallbackSignature } from '../../src/core/signature';
import { CallbackBody } from '../../src/types';

describe('Property 14: Failed Callback Response', () => {
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

  it('should return result with status="failed" for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.status === 'failed';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with success=false for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with original orderId for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.orderId === orderId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with original platformOrderId for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.platformOrderId === orderId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with paymentId for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          return result.paymentId === paymentId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return result with installment as number for failed callback', () => {
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
            status: 'failed',
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

  it('should return complete structured response for failed callback', () => {
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
            status: 'failed',
            signature: validSignature,
          };

          const result = shopier.verifyCallback(callbackBody);

          // Verify complete structured response
          return (
            result.success === false &&
            result.status === 'failed' &&
            result.orderId === orderId &&
            result.platformOrderId === orderId &&
            result.paymentId === paymentId &&
            result.installment === installment
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
