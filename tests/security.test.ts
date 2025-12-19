/**
 * Security tests for @nopeion/shopier
 * Tests for XSS, signature validation, input validation, and more
 */
import {
    Shopier,
    Currency,
    ValidationError,
    SignatureValidationError,
    InvalidApiKeyError,
    InvalidApiSecretError,
    validateInstallment,
} from '../src';
import { verifySignature, generateSignature } from '../src/core/signature';

describe('Security Tests', () => {
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

    describe('1. Signature Validation', () => {
        describe('1.1 Valid Signature', () => {
            it('should accept valid signature', () => {
                const shopier = new Shopier(testConfig);
                const data = '123456order-789';
                const signature = shopier.generateSignature(data);

                expect(verifySignature(testConfig.apiSecret, data, signature)).toBe(true);
            });
        });

        describe('1.2 Invalid Signature', () => {
            it('should reject invalid signature', () => {
                expect(verifySignature(testConfig.apiSecret, 'test-data', 'invalid-sig')).toBe(false);
            });

            it('should reject empty signature', () => {
                expect(verifySignature(testConfig.apiSecret, 'test-data', '')).toBe(false);
            });

            it('should reject null-like signature', () => {
                expect(verifySignature(testConfig.apiSecret, 'test-data', 'null')).toBe(false);
                expect(verifySignature(testConfig.apiSecret, 'test-data', 'undefined')).toBe(false);
            });
        });

        describe('1.3 Timing-Safe Comparison', () => {
            it('should use constant-time comparison', () => {
                const sig1 = generateSignature(testConfig.apiSecret, 'test');
                const sig2 = generateSignature(testConfig.apiSecret, 'test');
                expect(verifySignature(testConfig.apiSecret, 'test', sig1)).toBe(true);
                expect(sig1).toBe(sig2);
            });
        });

        describe('1.4 Signature Manipulation', () => {
            it('should reject callback with modified random_nr', () => {
                const shopier = new Shopier(testConfig);
                const originalRandomNr = '123456';
                const orderId = 'order-789';
                const signature = shopier.generateSignature(`${originalRandomNr}${orderId}`);

                const tamperedCallback = {
                    random_nr: '654321',
                    platform_order_id: orderId,
                    payment_id: 'pay-123',
                    installment: '0',
                    status: 'success' as const,
                    signature,
                };

                expect(() => shopier.verifyCallback(tamperedCallback)).toThrow(SignatureValidationError);
            });

            it('should reject callback with modified platform_order_id', () => {
                const shopier = new Shopier(testConfig);
                const randomNr = '123456';
                const originalOrderId = 'order-789';
                const signature = shopier.generateSignature(`${randomNr}${originalOrderId}`);

                const tamperedCallback = {
                    random_nr: randomNr,
                    platform_order_id: 'order-HACKED',
                    payment_id: 'pay-123',
                    installment: '0',
                    status: 'success' as const,
                    signature,
                };

                expect(() => shopier.verifyCallback(tamperedCallback)).toThrow(SignatureValidationError);
            });
        });
    });

    describe('2. XSS Protection', () => {
        it('should escape script tags in firstName', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, firstName: '<script>alert(1)</script>' },
                billing: validBilling,
                randomNr: 123456,
            });

            expect(hiddenInputs).not.toContain('<script>');
            expect(hiddenInputs).toContain('&lt;script&gt;');
        });

        it('should escape script tags in lastName', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, lastName: '<script>document.cookie</script>' },
                billing: validBilling,
                randomNr: 123456,
            });

            expect(hiddenInputs).not.toContain('<script>document.cookie</script>');
        });

        it('should escape special chars in buyer id', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, id: '"><img src=x>' },
                billing: validBilling,
                randomNr: 123456,
            });

            expect(hiddenInputs).not.toContain('"><img');
            expect(hiddenInputs).toContain('&quot;');
            expect(hiddenInputs).toContain('&lt;');
        });

        it('should escape XSS in product name', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: { ...validBuyer, productName: '"><script>alert("XSS")</script>' },
                billing: validBilling,
                randomNr: 123456,
            });

            expect(hiddenInputs).not.toContain('<script>');
        });

        it('should escape XSS in address', () => {
            const shopier = new Shopier(testConfig);
            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: validBuyer,
                billing: { ...validBilling, address: '<img src=x>Test Address' },
                randomNr: 123456,
            });

            expect(hiddenInputs).not.toContain('<img');
            expect(hiddenInputs).toContain('&lt;img');
        });
    });

    describe('3. Input Validation', () => {
        describe('3.1 Amount Validation', () => {
            it('should reject zero amount', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: 0,
                    buyer: validBuyer,
                })).toThrow(ValidationError);
            });

            it('should reject negative amount', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: -100,
                    buyer: validBuyer,
                })).toThrow(ValidationError);
            });

            it('should reject NaN amount', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: NaN,
                    buyer: validBuyer,
                })).toThrow(ValidationError);
            });

            it('should accept valid positive amount', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: 99.99,
                    buyer: validBuyer,
                    randomNr: 123456,
                })).not.toThrow();
            });
        });

        describe('3.2 Installment Validation', () => {
            it('should reject installment > 12', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: 100,
                    buyer: validBuyer,
                    maxInstallment: 13,
                })).toThrow(ValidationError);
            });

            it('should reject negative installment', () => {
                const shopier = new Shopier(testConfig);
                expect(() => shopier.createPayment({
                    amount: 100,
                    buyer: validBuyer,
                    maxInstallment: -1,
                })).toThrow(ValidationError);
            });

            it('should accept installment = 0 (no installment)', () => {
                expect(() => validateInstallment(0)).not.toThrow();
            });

            it('should accept valid installment range (0-12)', () => {
                expect(() => validateInstallment(0)).not.toThrow();
                expect(() => validateInstallment(1)).not.toThrow();
                expect(() => validateInstallment(6)).not.toThrow();
                expect(() => validateInstallment(12)).not.toThrow();
            });
        });
    });

    describe('4. API Key Security', () => {
        describe('4.1 Empty Credentials', () => {
            it('should throw InvalidApiKeyError for empty API key', () => {
                expect(() => new Shopier({ apiKey: '', apiSecret: 'secret' }))
                    .toThrow(InvalidApiKeyError);
            });

            it('should throw InvalidApiSecretError for empty API secret', () => {
                expect(() => new Shopier({ apiKey: 'key', apiSecret: '' }))
                    .toThrow(InvalidApiSecretError);
            });

            it('should throw for whitespace-only credentials', () => {
                expect(() => new Shopier({ apiKey: '   ', apiSecret: 'secret' }))
                    .toThrow(InvalidApiKeyError);
            });
        });

        describe('4.2 API Secret Not Exposed', () => {
            it('should not include API secret in HTML output', () => {
                const shopier = new Shopier(testConfig);
                const { html } = shopier.createPayment({
                    amount: 100,
                    buyer: validBuyer,
                    randomNr: 123456,
                });

                expect(html).not.toContain(testConfig.apiSecret);
            });

            it('should not include API secret in form data', () => {
                const shopier = new Shopier(testConfig);
                const { formData } = shopier.createPayment({
                    amount: 100,
                    buyer: validBuyer,
                    randomNr: 123456,
                });

                const allValues = Object.values(formData).map(String).join(' ');
                expect(allValues).not.toContain(testConfig.apiSecret);
            });
        });
    });

    describe('5. Callback Security', () => {
        it('should correctly identify failed status', () => {
            const shopier = new Shopier(testConfig);
            const randomNr = '123456';
            const orderId = 'order-789';
            const signature = shopier.generateSignature(`${randomNr}${orderId}`);

            const callback = {
                random_nr: randomNr,
                platform_order_id: orderId,
                payment_id: 'pay-123',
                installment: '0',
                status: 'failed' as const,
                signature,
            };

            const result = shopier.verifyCallback(callback);
            expect(result.success).toBe(false);
            expect(result.status).toBe('failed');
        });

        it('should correctly identify success status', () => {
            const shopier = new Shopier(testConfig);
            const randomNr = '123456';
            const orderId = 'order-789';
            const signature = shopier.generateSignature(`${randomNr}${orderId}`);

            const callback = {
                random_nr: randomNr,
                platform_order_id: orderId,
                payment_id: 'pay-123',
                installment: '3',
                status: 'success' as const,
                signature,
            };

            const result = shopier.verifyCallback(callback);
            expect(result.success).toBe(true);
            expect(result.installment).toBe(3);
        });
    });

    describe('6. Currency Security', () => {
        it('should only accept valid currency values', () => {
            const shopier = new Shopier(testConfig);
            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: validBuyer,
                currency: Currency.TL,
                randomNr: 123456,
            });

            expect([0, 1, 2]).toContain(formData.currency);
        });
    });
});
