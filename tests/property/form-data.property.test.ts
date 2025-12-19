import * as fc from 'fast-check';
import { getFormDataObject } from '../../src/renderers/form-data';
import { FormData, FormDataResult } from '../../src/types';

/**
 * **Feature: shopier-sdk, Property 3: Form Data Completeness**
 * **Validates: Requirements 3.3**
 * 
 * For any valid Shopier configuration with buyer and address information,
 * the getFormData method SHALL return an object containing all required form fields
 * (API_key, signature, buyer info, addresses, amount, currency) and the action URL.
 */
describe('Property 3: Form Data Completeness', () => {
  // Required form data fields according to the design document
  const requiredFields: (keyof FormData)[] = [
    'API_key',
    'website_index',
    'platform_order_id',
    'product_name',
    'product_type',
    'buyer_name',
    'buyer_surname',
    'buyer_email',
    'buyer_account_age',
    'buyer_id_nr',
    'buyer_phone',
    'billing_address',
    'billing_city',
    'billing_country',
    'billing_postcode',
    'shipping_address',
    'shipping_city',
    'shipping_country',
    'shipping_postcode',
    'total_order_value',
    'currency',
    'platform',
    'is_in_frame',
    'current_language',
    'modul_version',
    'random_nr',
    'signature',
  ];

  // Arbitrary for generating valid FormData
  const formDataArbitrary = fc.record({
    API_key: fc.string({ minLength: 1, maxLength: 50 }),
    website_index: fc.integer({ min: 1, max: 5 }),
    platform_order_id: fc.string({ minLength: 1, maxLength: 50 }),
    product_name: fc.string({ minLength: 1, maxLength: 100 }),
    product_type: fc.integer({ min: 0, max: 2 }),
    buyer_name: fc.string({ minLength: 1, maxLength: 50 }),
    buyer_surname: fc.string({ minLength: 1, maxLength: 50 }),
    buyer_email: fc.emailAddress(),
    buyer_account_age: fc.integer({ min: 0, max: 3650 }),
    buyer_id_nr: fc.string({ minLength: 1, maxLength: 20 }),
    buyer_phone: fc.string({ minLength: 10, maxLength: 15 }),
    billing_address: fc.string({ minLength: 1, maxLength: 200 }),
    billing_city: fc.string({ minLength: 1, maxLength: 50 }),
    billing_country: fc.string({ minLength: 1, maxLength: 50 }),
    billing_postcode: fc.string({ minLength: 1, maxLength: 10 }),
    shipping_address: fc.string({ minLength: 1, maxLength: 200 }),
    shipping_city: fc.string({ minLength: 1, maxLength: 50 }),
    shipping_country: fc.string({ minLength: 1, maxLength: 50 }),
    shipping_postcode: fc.string({ minLength: 1, maxLength: 10 }),
    total_order_value: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    currency: fc.integer({ min: 0, max: 2 }),
    platform: fc.integer({ min: 0, max: 1 }),
    is_in_frame: fc.integer({ min: 0, max: 1 }),
    current_language: fc.integer({ min: 0, max: 1 }),
    modul_version: fc.constant('1.0.4'),
    random_nr: fc.integer({ min: 100000, max: 999999 }),
    signature: fc.string({ minLength: 20, maxLength: 100 }),
  }) as fc.Arbitrary<FormData>;

  const actionUrlArbitrary = fc.webUrl();

  it('should return an object with formData and actionUrl properties', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result = getFormDataObject(formData, actionUrl);
          
          return typeof result === 'object' &&
                 result !== null &&
                 'formData' in result &&
                 'actionUrl' in result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the exact formData object passed in', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result = getFormDataObject(formData, actionUrl);
          
          // The returned formData should be the same object
          return result.formData === formData;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the exact actionUrl passed in', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result = getFormDataObject(formData, actionUrl);
          
          return result.actionUrl === actionUrl;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default Shopier action URL when not provided', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          
          return result.actionUrl === 'https://www.shopier.com/ShowProduct/api_pay4.php';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain all required form fields in formData', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result = getFormDataObject(formData, actionUrl);
          
          // Check that all required fields exist in the result
          return requiredFields.every(field => field in result.formData);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all form field values', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result = getFormDataObject(formData, actionUrl);
          
          // Check that all values are preserved
          return requiredFields.every(field => 
            result.formData[field] === formData[field]
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return FormDataResult type structure', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        actionUrlArbitrary,
        (formData, actionUrl) => {
          const result: FormDataResult = getFormDataObject(formData, actionUrl);
          
          // TypeScript ensures the type, but we verify runtime structure
          return typeof result.formData === 'object' &&
                 typeof result.actionUrl === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain API_key field', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          return 'API_key' in result.formData && 
                 typeof result.formData.API_key === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain signature field', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          return 'signature' in result.formData && 
                 typeof result.formData.signature === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain buyer information fields', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          const fd = result.formData;
          
          return 'buyer_name' in fd &&
                 'buyer_surname' in fd &&
                 'buyer_email' in fd &&
                 'buyer_phone' in fd &&
                 'buyer_id_nr' in fd &&
                 'buyer_account_age' in fd;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain billing address fields', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          const fd = result.formData;
          
          return 'billing_address' in fd &&
                 'billing_city' in fd &&
                 'billing_country' in fd &&
                 'billing_postcode' in fd;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain shipping address fields', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          const fd = result.formData;
          
          return 'shipping_address' in fd &&
                 'shipping_city' in fd &&
                 'shipping_country' in fd &&
                 'shipping_postcode' in fd;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain amount and currency fields', () => {
    fc.assert(
      fc.property(
        formDataArbitrary,
        (formData) => {
          const result = getFormDataObject(formData);
          const fd = result.formData;
          
          return 'total_order_value' in fd &&
                 'currency' in fd &&
                 typeof fd.total_order_value === 'number' &&
                 typeof fd.currency === 'number';
        }
      ),
      { numRuns: 100 }
    );
  });
});
