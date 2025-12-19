/**
 * **Feature: shopier-sdk, Property 9: Random Number Override**
 * **Validates: Requirements 4.5**
 *
 * Property: For any provided random_nr override value, the generated form data
 * SHALL contain exactly that value in the random_nr field.
 */

import * as fc from 'fast-check';
import { Shopier } from '../../src/core/shopier';
import { Currency, ProductType } from '../../src/enums';
import { BuyerInfo, BillingAddress } from '../../src/types';

describe('Property 9: Random Number Override', () => {
  const validConfig = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
  };

  const validBuyer: BuyerInfo = {
    id: 'buyer-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '5551234567',
    productName: 'Test Product',
    productType: ProductType.REAL_OBJECT,
  };

  const validAddress: BillingAddress = {
    address: '123 Test St',
    city: 'Istanbul',
    country: 'Turkey',
    postcode: '34000',
  };

  it('should use the provided random_nr override value in form data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 999999 }),
        (randomNr) => {
          const shopier = new Shopier(validConfig);
          const result = shopier.createPayment({
            amount: 100,
            buyer: validBuyer,
            billing: validAddress,
            currency: Currency.TL,
            randomNr,
          });

          return result.formData.random_nr === randomNr;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use override value even when it is at boundary (100000)', () => {
    const shopier = new Shopier(validConfig);
    const result = shopier.createPayment({
      amount: 100,
      buyer: validBuyer,
      billing: validAddress,
      randomNr: 100000,
    });

    expect(result.formData.random_nr).toBe(100000);
  });

  it('should use override value even when it is at boundary (999999)', () => {
    const shopier = new Shopier(validConfig);
    const result = shopier.createPayment({
      amount: 100,
      buyer: validBuyer,
      billing: validAddress,
      randomNr: 999999,
    });

    expect(result.formData.random_nr).toBe(999999);
  });

  it('should generate valid random_nr when override is not set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        () => {
          const shopier = new Shopier(validConfig);
          const result = shopier.createPayment({
            amount: 100,
            buyer: validBuyer,
            billing: validAddress,
          });

          // Should be a valid 6-digit number
          return result.formData.random_nr >= 100000 && result.formData.random_nr <= 999999;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use override value in hidden inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 999999 }),
        (randomNr) => {
          const shopier = new Shopier(validConfig);
          const result = shopier.createPayment({
            amount: 100,
            buyer: validBuyer,
            billing: validAddress,
            randomNr,
          });

          // Check form data
          const formDataMatch = result.formData.random_nr === randomNr;

          // Check hidden inputs contain the random_nr
          const hiddenInputsMatch = result.hiddenInputs.includes(`value="${randomNr}"`);

          // Check HTML contains the random_nr
          const htmlMatch = result.html.includes(`value="${randomNr}"`);

          return formDataMatch && hiddenInputsMatch && htmlMatch;
        }
      ),
      { numRuns: 100 }
    );
  });
});
