/**
 * Comprehensive tests for @nopeion/shopier
 */
import {
    Shopier,
    Currency,
    Language,
    ProductType,
    ValidationError,
    SignatureValidationError,
    InvalidApiKeyError,
    InvalidApiSecretError,
} from '../src';

describe('Shopier SDK', () => {
    const testConfig = {
        apiKey: 'test-api-key-123',
        apiSecret: 'test-api-secret-456',
    };

    const testBuyer = {
        id: 'buyer-123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'ahmet@example.com',
        phone: '05551234567',
        productName: 'Test Ürün',
    };

    const testBilling = {
        address: 'Test Sokak No:1',
        city: 'İstanbul',
        country: 'Türkiye',
        postcode: '34000',
    };

    describe('Constructor', () => {
        it('should create instance with config object', () => {
            const shopier = new Shopier(testConfig);
            expect(shopier).toBeInstanceOf(Shopier);
        });

        it('should throw InvalidApiKeyError when apiKey is missing', () => {
            expect(() => new Shopier({ apiKey: '', apiSecret: 'secret' }))
                .toThrow(InvalidApiKeyError);
        });

        it('should throw InvalidApiSecretError when apiSecret is missing', () => {
            expect(() => new Shopier({ apiKey: 'key', apiSecret: '' }))
                .toThrow(InvalidApiSecretError);
        });
    });

    describe('createPayment', () => {
        it('should create payment with minimal options', () => {
            const shopier = new Shopier(testConfig);

            const result = shopier.createPayment({
                amount: 99.99,
                buyer: testBuyer,
                randomNr: 123456,
            });

            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.formData).toBeDefined();
            expect(result.actionUrl).toBe('https://www.shopier.com/ShowProduct/api_pay4.php');
            expect(result.hiddenInputs).toContain('type="hidden"');
        });

        it('should create payment with full options', () => {
            const shopier = new Shopier(testConfig);

            const result = shopier.createPayment({
                amount: 150.00,
                currency: Currency.USD,
                maxInstallment: 6,
                language: Language.EN,
                productType: ProductType.DOWNLOADABLE_VIRTUAL,
                buyer: testBuyer,
                billing: testBilling,
                randomNr: 123456,
            });

            expect(result.formData.total_order_value).toBe(150.00);
            expect(result.formData.currency).toBe(Currency.USD);
            expect(result.formData.platform).toBe(6);
            expect(result.formData.current_language).toBe(Language.EN);
        });

        it('should throw ValidationError for invalid amount', () => {
            const shopier = new Shopier(testConfig);

            expect(() => shopier.createPayment({
                amount: 0,
                buyer: testBuyer,
            })).toThrow(ValidationError);

            expect(() => shopier.createPayment({
                amount: -10,
                buyer: testBuyer,
            })).toThrow(ValidationError);
        });

        it('should use billing address for shipping when shipping not provided', () => {
            const shopier = new Shopier(testConfig);

            const result = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                billing: testBilling,
                randomNr: 123456,
            });

            expect(result.formData.shipping_address).toBe(testBilling.address);
            expect(result.formData.shipping_city).toBe(testBilling.city);
        });

        it('should use separate shipping address when provided', () => {
            const shopier = new Shopier(testConfig);
            const shippingAddress = {
                address: 'Shipping Address',
                city: 'Ankara',
                country: 'Türkiye',
                postcode: '06000',
            };

            const result = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                billing: testBilling,
                shipping: shippingAddress,
                randomNr: 123456,
            });

            expect(result.formData.shipping_address).toBe(shippingAddress.address);
            expect(result.formData.shipping_city).toBe(shippingAddress.city);
        });

        it('should validate installment range', () => {
            const shopier = new Shopier(testConfig);

            // Valid installment
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                maxInstallment: 6,
            })).not.toThrow();

            // Invalid installment (> 12)
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                maxInstallment: 13,
            })).toThrow(ValidationError);

            // Invalid installment (< 0)
            expect(() => shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                maxInstallment: -1,
            })).toThrow(ValidationError);
        });
    });

    describe('PaymentResult', () => {
        it('should contain valid HTML with auto-submit', () => {
            const shopier = new Shopier(testConfig);

            const { html } = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                randomNr: 123456,
            });

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<form');
            expect(html).toContain('api_pay4.php');
            expect(html).toContain('submit()');
        });

        it('should contain hidden inputs', () => {
            const shopier = new Shopier(testConfig);

            const { hiddenInputs } = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                randomNr: 123456,
            });

            expect(hiddenInputs).toContain('type="hidden"');
            expect(hiddenInputs).toContain('name="API_key"');
            expect(hiddenInputs).toContain('name="signature"');
        });

        it('should contain correct form data', () => {
            const shopier = new Shopier(testConfig);

            const { formData, actionUrl } = shopier.createPayment({
                amount: 99.99,
                buyer: testBuyer,
                billing: testBilling,
                randomNr: 123456,
            });

            expect(actionUrl).toBe('https://www.shopier.com/ShowProduct/api_pay4.php');
            expect(formData.API_key).toBe(testConfig.apiKey);
            expect(formData.total_order_value).toBe(99.99);
            expect(formData.buyer_name).toBe(testBuyer.firstName);
            expect(formData.buyer_surname).toBe(testBuyer.lastName);
            expect(formData.buyer_email).toBe(testBuyer.email);
            expect(formData.random_nr).toBe(123456);
            expect(formData.signature).toBeDefined();
        });
    });

    describe('Signature Generation', () => {
        it('should generate consistent signatures', () => {
            const shopier = new Shopier(testConfig);

            const sig1 = shopier.generateSignature('test-data');
            const sig2 = shopier.generateSignature('test-data');

            expect(sig1).toBe(sig2);
        });

        it('should generate different signatures for different data', () => {
            const shopier = new Shopier(testConfig);

            const sig1 = shopier.generateSignature('data-1');
            const sig2 = shopier.generateSignature('data-2');

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('Callback Verification', () => {
        it('should verify valid callback', () => {
            const shopier = new Shopier(testConfig);

            const randomNr = '123456';
            const platformOrderId = 'order-789';
            const signature = shopier.generateSignature(`${randomNr}${platformOrderId}`);

            const callbackBody = {
                random_nr: randomNr,
                platform_order_id: platformOrderId,
                payment_id: 'payment-123',
                installment: '3',
                status: 'success' as const,
                signature,
            };

            const result = shopier.verifyCallback(callbackBody);

            expect(result.success).toBe(true);
            expect(result.orderId).toBe(platformOrderId);
            expect(result.paymentId).toBe('payment-123');
            expect(result.installment).toBe(3);
        });

        it('should throw SignatureValidationError for invalid signature', () => {
            const shopier = new Shopier(testConfig);

            const callbackBody = {
                random_nr: '123456',
                platform_order_id: 'order-789',
                payment_id: 'payment-123',
                installment: '0',
                status: 'success' as const,
                signature: 'invalid-signature',
            };

            expect(() => shopier.verifyCallback(callbackBody))
                .toThrow(SignatureValidationError);
        });

        it('should return success: false for failed status', () => {
            const shopier = new Shopier(testConfig);

            const randomNr = '123456';
            const platformOrderId = 'order-789';
            const signature = shopier.generateSignature(`${randomNr}${platformOrderId}`);

            const callbackBody = {
                random_nr: randomNr,
                platform_order_id: platformOrderId,
                payment_id: 'payment-123',
                installment: '0',
                status: 'failed' as const,
                signature,
            };

            const result = shopier.verifyCallback(callbackBody);

            expect(result.success).toBe(false);
            expect(result.status).toBe('failed');
        });
    });

    describe('Currency Support', () => {
        it('should support TL currency', () => {
            const shopier = new Shopier(testConfig);

            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                currency: Currency.TL,
                randomNr: 123456,
            });

            expect(formData.currency).toBe(Currency.TL);
        });

        it('should support USD currency', () => {
            const shopier = new Shopier(testConfig);

            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                currency: Currency.USD,
                randomNr: 123456,
            });

            expect(formData.currency).toBe(Currency.USD);
        });

        it('should support EUR currency', () => {
            const shopier = new Shopier(testConfig);

            const { formData } = shopier.createPayment({
                amount: 100,
                buyer: testBuyer,
                currency: Currency.EUR,
                randomNr: 123456,
            });

            expect(formData.currency).toBe(Currency.EUR);
        });
    });
});
