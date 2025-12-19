/**
 * Temel Kullanım Örneği
 */

import { Shopier, Currency, Language } from '@nopeion/shopier';

// 1. SDK'yı başlat
const shopier = new Shopier({
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
});

// 2. Ödeme oluştur
const { html, formData, actionUrl, hiddenInputs } = shopier.createPayment({
    // Zorunlu alanlar
    amount: 99.99,
    buyer: {
        id: 'user-123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'ahmet@example.com',
        phone: '05551234567',
        productName: 'Premium Üyelik',
    },

    // Opsiyonel alanlar
    currency: Currency.TL,
    language: Language.TR,
    maxInstallment: 6,
    billing: {
        address: 'Örnek Mah. Test Sok. No:1',
        city: 'İstanbul',
        country: 'Türkiye',
        postcode: '34000',
    },
});

console.log('HTML length:', html.length);
console.log('Action URL:', actionUrl);
console.log('Form data:', formData);

// 3. Callback doğrulama
const mockCallback = {
    random_nr: '123456',
    platform_order_id: 'user-123',
    payment_id: 'pay-789',
    installment: '3',
    status: 'success' as const,
    signature: shopier.generateSignature('123456user-123'),
};

try {
    const result = shopier.verifyCallback(mockCallback);
    console.log('Callback result:', result);
} catch (error) {
    console.error('Verification failed:', error);
}
