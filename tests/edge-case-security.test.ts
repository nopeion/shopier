/**
 * Edge-case security tests for @nopeion/shopier
 * Tests for unicode handling, long strings, type coercion, and error safety
 */
import {
    Shopier,
    ValidationError,
    ShopierError,
    validateInstallment,
} from '../src';
import { verifySignature, generateSignature } from '../src/core/signature';
import { escapeHtml } from '../src/utils';

describe('Edge Case Security Tests', () => {
    const testConfig = {
        apiKey: 'test-api-key-123',
        apiSecret: 'test-api-secret-456',
    };

    const validBuyer = {
        id: 'buyer-123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '05551234567',
        productName: 'Test Product',
    };

    const validBilling = {
        address: 'Test Street 123',
        city: 'Istanbul',
        country: 'Turkey',
        postcode: '34000',
    };

    describe('1. Unicode Character Handling', () => {
        it('should handle Chinese characters in buyer fields', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: '你好', lastName: '世界', productName: '中文产品名称' },
                billing: validBilling,
                randomNr: 123456,
            });

            expect(hiddenInputs).toContain('你好');
        });

        it('should handle Arabic characters in buyer fields', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: 'مرحبا', lastName: 'العالم' },
                randomNr: 123456,
            })).not.toThrow();
        });

        it('should handle emoji in buyer fields', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: 'Test🎉', lastName: 'User👋', productName: 'Product 🚀' },
                randomNr: 123456,
            })).not.toThrow();
        });

        it('should handle Turkish special characters', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: 'Şükrü', lastName: 'Öztürk', productName: 'Türkçe Ürün İsmi' },
                billing: { address: 'Çiçek Sokak No:1', city: 'İstanbul', country: 'Türkiye', postcode: '34000' },
                randomNr: 123456,
            });

            expect(hiddenInputs).toContain('Şükrü');
            expect(hiddenInputs).toContain('Öztürk');
        });

        it('should correctly sign and verify unicode data', () => {
            const unicodeData = '你好世界🎉مرحبا';
            const signature = generateSignature(testConfig.apiSecret, unicodeData);
            expect(verifySignature(testConfig.apiSecret, unicodeData, signature)).toBe(true);
        });
    });

    describe('2. Long String Handling', () => {
        it('should handle extremely long buyer name (1000 chars)', () => {
            const longString = 'A'.repeat(1000);
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: longString },
                randomNr: 123456,
            })).not.toThrow();
        });

        it('should handle extremely long product name (5000 chars)', () => {
            const longString = 'Product'.repeat(700);
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, productName: longString },
                randomNr: 123456,
            })).not.toThrow();
        });

        it('should handle very long address (2000 chars)', () => {
            const longAddress = 'Street '.repeat(300);
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: validBuyer,
                billing: { ...validBilling, address: longAddress },
                randomNr: 123456,
            })).not.toThrow();
        });

        it('should reject signature with extremely long input', () => {
            const longData = 'x'.repeat(10000);
            expect(verifySignature(testConfig.apiSecret, longData, 'invalid')).toBe(false);
        });

        it('should correctly sign and verify long data', () => {
            const longData = 'x'.repeat(10000);
            const signature = generateSignature(testConfig.apiSecret, longData);
            expect(verifySignature(testConfig.apiSecret, longData, signature)).toBe(true);
        });
    });

    describe('3. Type Coercion Attacks', () => {
        it('should reject array as amount', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: [100] as any,
                buyer: validBuyer,
            })).toThrow(ValidationError);
        });

        it('should reject object as amount', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: { value: 100 } as any,
                buyer: validBuyer,
            })).toThrow(ValidationError);
        });

        it('should reject string as amount', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: '100' as any,
                buyer: validBuyer,
            })).toThrow(ValidationError);
        });

        it('should reject Infinity as amount', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: Infinity,
                buyer: validBuyer,
            })).toThrow(ValidationError);
        });

        it('should reject -Infinity as amount', () => {
            const shopier = new Shopier(testConfig);
            expect(() => shopier.createPayment({
                amount: -Infinity,
                buyer: validBuyer,
            })).toThrow(ValidationError);
        });

        it('should handle float amount correctly', () => {
            const shopier = new Shopier(testConfig);
            const { formData } = shopier.createPayment({
                amount: 99.99,
                buyer: validBuyer,
                randomNr: 123456,
            });

            expect(formData.total_order_value).toBe(99.99);
        });

        it('should reject non-integer installment', () => {
            expect(() => validateInstallment(3.5)).toThrow(ValidationError);
        });
    });

    describe('4. Buffer/Edge Case Handling', () => {
        it('should handle empty string in signature verification', () => {
            expect(verifySignature(testConfig.apiSecret, '', 'test')).toBe(false);
        });

        it('should handle null-like strings in signature', () => {
            expect(verifySignature(testConfig.apiSecret, 'data', 'null')).toBe(false);
            expect(verifySignature(testConfig.apiSecret, 'data', 'undefined')).toBe(false);
            expect(verifySignature(testConfig.apiSecret, 'data', 'NaN')).toBe(false);
        });

        it('should handle whitespace-only signature', () => {
            expect(verifySignature(testConfig.apiSecret, 'data', '   ')).toBe(false);
            expect(verifySignature(testConfig.apiSecret, 'data', '\n\t')).toBe(false);
        });

        it('should handle special escape characters in HTML', () => {
            expect(escapeHtml('test\n\r\t')).toBe('test\n\r\t');
            expect(escapeHtml('test\0')).toBe('test\0');
        });

        it('should handle mixed special characters', () => {
            const input = '<script>"test\'&</script>';
            const escaped = escapeHtml(input);
            expect(escaped).not.toContain('<');
            expect(escaped).not.toContain('>');
            expect(escaped).not.toContain('"');
            expect(escaped).toContain('&lt;');
            expect(escaped).toContain('&gt;');
            expect(escaped).toContain('&quot;');
        });
    });

    describe('5. Error Details Safety', () => {
        it('should mask email in getSafeDetails', () => {
            const error = new ShopierError(
                'Validation failed',
                'VALIDATION_ERROR',
                { field: 'email', value: 'secret@example.com', email: 'test@test.com' }
            );

            const safeDetails = error.getSafeDetails();
            expect(safeDetails).toBeDefined();
            expect(safeDetails!.field).toBe('email');
            expect(safeDetails!.value).toBe('[REDACTED]');
            expect(safeDetails!.email).toBe('[REDACTED]');
        });

        it('should mask phone in getSafeDetails', () => {
            const error = new ShopierError(
                'Validation failed',
                'VALIDATION_ERROR',
                { field: 'phone', phone: '05551234567' }
            );

            const safeDetails = error.getSafeDetails();
            expect(safeDetails).toBeDefined();
            expect(safeDetails!.phone).toBe('[REDACTED]');
        });

        it('should mask apiSecret and apiKey', () => {
            const error = new ShopierError(
                'Config error',
                'CONFIG_ERROR',
                { apiKey: 'my-key', apiSecret: 'my-secret' }
            );

            const safeDetails = error.getSafeDetails();
            expect(safeDetails!.apiKey).toBe('[REDACTED]');
            expect(safeDetails!.apiSecret).toBe('[REDACTED]');
        });

        it('should return undefined for errors without details', () => {
            const error = new ShopierError('Error', 'ERROR');
            expect(error.getSafeDetails()).toBeUndefined();
        });

        it('should preserve non-sensitive fields', () => {
            const error = new ShopierError(
                'Error',
                'CODE',
                { field: 'amount', expectedType: 'number', receivedType: 'string' }
            );

            const safeDetails = error.getSafeDetails();
            expect(safeDetails!.field).toBe('amount');
            expect(safeDetails!.expectedType).toBe('number');
            expect(safeDetails!.receivedType).toBe('string');
        });

        it('should provide safe JSON representation', () => {
            const error = new ShopierError(
                'Test error',
                'TEST_CODE',
                { email: 'secret@test.com', orderId: '12345' }
            );

            const safeJson = error.toSafeJSON();
            expect(safeJson.name).toBe('ShopierError');
            expect(safeJson.message).toBe('Test error');
            expect(safeJson.code).toBe('TEST_CODE');
            expect((safeJson.details as any).email).toBe('[REDACTED]');
            expect((safeJson.details as any).orderId).toBe('12345');
        });
    });

    describe('6. Prototype Pollution Prevention', () => {
        it('should not be affected by __proto__ in buyer object', () => {
            const maliciousBuyer = {
                ...validBuyer,
                __proto__: { isAdmin: true },
            };

            const shopier = new Shopier(testConfig);
            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: maliciousBuyer,
                billing: validBilling,
                randomNr: 123456,
            });

            expect((formData as any).isAdmin).toBeUndefined();
        });

        it('should not be affected by prototype property in address', () => {
            const maliciousAddress = {
                ...validBilling,
                __proto__: { isAdmin: true },
            };

            const shopier = new Shopier(testConfig);
            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: validBuyer,
                billing: maliciousAddress,
                randomNr: 123456,
            });

            expect((formData as any).isAdmin).toBeUndefined();
        });
    });
});
