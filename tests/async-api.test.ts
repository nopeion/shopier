
import { Shopier } from '../src/core/shopier';
import { Currency } from '../src/enums';

describe('Shopier Async API', () => {
    const config = {
        apiKey: 'test-key',
        apiSecret: 'test-secret'
    };

    const validBuyer = {
        id: '12345',
        firstName: 'Ahmet',
        lastName: 'Yilmaz',
        email: 'ahmet@example.com',
        phone: '05555555555',
        productName: 'Test Product'
    };

    const validBilling = {
        address: 'Test Addr',
        city: 'Istanbul',
        country: 'Turkey',
        postcode: '34000'
    };

    it('createPayment should return payment result object', () => {
        const shopier = new Shopier(config);
        const result = shopier.createPayment({
            amount: 100,
            buyer: validBuyer,
            billing: validBilling,
            randomNr: 123456,
        });

        expect(result).toBeDefined();

        // Check HTML content
        expect(result.html).toContain('<form');
        expect(result.html).toContain('name="signature"');

        // Check form data
        expect(result.formData.total_order_value).toBe(100);
        expect(result.formData.currency).toBe(Currency.TL);

        // Check action URL
        expect(result.actionUrl).toContain('shopier.com');

        // Check hidden inputs
        expect(result.hiddenInputs).toContain('type="hidden"');
    });

    it('createPayment should throw error for missing buyer fields', () => {
        const shopier = new Shopier(config);

        expect(() => shopier.createPayment({
            amount: 100,
            buyer: { ...validBuyer, email: '' },
        })).toThrow();
    });

    it('createPayment should throw error for invalid amount', () => {
        const shopier = new Shopier(config);

        expect(() => shopier.createPayment({
            amount: 0,
            buyer: validBuyer,
        })).toThrow();
    });
});
