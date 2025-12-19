import * as fc from 'fast-check';
import { renderAutoSubmitHTML } from '../../src/renderers/auto-submit';
import { renderButton } from '../../src/renderers/button';
import { renderHiddenInputs } from '../../src/renderers/hidden-inputs';
import { FormData } from '../../src/types';
import { Language } from '../../src/enums';

/**
 * **Feature: shopier-sdk, Property 4: HTML Output Contains Required Elements**
 * **Validates: Requirements 3.1, 3.2, 3.4**
 * 
 * For any valid form data:
 * - Auto-submit HTML SHALL contain a form element with action URL, all hidden inputs, and auto-submit script
 * - Button HTML SHALL contain a button element and hidden form
 * - Hidden inputs HTML SHALL contain only input elements with type="hidden"
 */
describe('Property 4: HTML Output Contains Required Elements', () => {
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

  describe('Auto-submit HTML', () => {
    it('should contain a form element with action URL', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderAutoSubmitHTML(formData, actionUrl);
            
            // Should contain form element
            const hasForm = html.includes('<form');
            // Should contain action attribute (URL will be escaped)
            const hasAction = html.includes('action="');
            // Should have POST method
            const hasPostMethod = html.includes('method="POST"');
            
            return hasForm && hasAction && hasPostMethod;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain all hidden inputs for form data fields', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderAutoSubmitHTML(formData, actionUrl);
            
            // Should contain hidden inputs for all form data keys
            const formDataKeys = Object.keys(formData);
            return formDataKeys.every(key => 
              html.includes(`name="${key}"`) && html.includes('type="hidden"')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain auto-submit script', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderAutoSubmitHTML(formData, actionUrl);
            
            // Should contain script tag
            const hasScript = html.includes('<script>');
            // Should contain submit call
            const hasSubmit = html.includes('.submit()');
            
            return hasScript && hasSubmit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be a complete HTML document', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderAutoSubmitHTML(formData, actionUrl);
            
            return html.includes('<!DOCTYPE html>') &&
                   html.includes('<html>') &&
                   html.includes('</html>') &&
                   html.includes('<head>') &&
                   html.includes('</head>') &&
                   html.includes('<body>') &&
                   html.includes('</body>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Button HTML', () => {
    it('should contain a button element', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderButton(formData, actionUrl);
            
            // Should contain button element
            const hasButton = html.includes('<button');
            const hasButtonClose = html.includes('</button>');
            // Should be submit type
            const hasSubmitType = html.includes('type="submit"');
            
            return hasButton && hasButtonClose && hasSubmitType;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain a hidden form', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderButton(formData, actionUrl);
            
            // Should contain form element
            const hasForm = html.includes('<form');
            // Should contain action attribute
            const hasAction = html.includes('action="');
            // Should have POST method
            const hasPostMethod = html.includes('method="POST"');
            
            return hasForm && hasAction && hasPostMethod;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain all hidden inputs', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderButton(formData, actionUrl);
            
            // Should contain hidden inputs for all form data keys
            const formDataKeys = Object.keys(formData);
            return formDataKeys.every(key => 
              html.includes(`name="${key}"`) && html.includes('type="hidden"')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain button styling', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderButton(formData, actionUrl);
            
            // Should contain style tag with button styles
            return html.includes('<style>') && 
                   html.includes('.shopier-button');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use correct default button text based on language', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          actionUrlArbitrary,
          (formData, actionUrl) => {
            const html = renderButton(formData, actionUrl);
            
            if (formData.current_language === Language.EN) {
              return html.includes('Pay with Shopier');
            } else {
              return html.includes('Shopier ile Öde');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Hidden inputs HTML', () => {
    it('should contain only input elements with type="hidden"', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          (formData) => {
            const html = renderHiddenInputs(formData);
            
            // Should only contain input elements
            const lines = html.split('\n').filter(line => line.trim());
            return lines.every(line => 
              line.includes('<input') && 
              line.includes('type="hidden"') &&
              line.includes('name="') &&
              line.includes('value="')
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain one hidden input for each form data field', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          (formData) => {
            const html = renderHiddenInputs(formData);
            
            const formDataKeys = Object.keys(formData);
            const inputCount = (html.match(/<input/g) || []).length;
            
            return inputCount === formDataKeys.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain form wrapper or other elements', () => {
      fc.assert(
        fc.property(
          formDataArbitrary,
          (formData) => {
            const html = renderHiddenInputs(formData);
            
            // Should not contain form, button, script, style, etc.
            return !html.includes('<form') &&
                   !html.includes('<button') &&
                   !html.includes('<script') &&
                   !html.includes('<style') &&
                   !html.includes('<div') &&
                   !html.includes('<!DOCTYPE');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
