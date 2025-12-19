/**
 * Express.js ile Shopier Entegrasyonu
 * 
 * Çalıştırmak için:
 * 1. npm install express @nopeion/shopier
 * 2. SHOPIER_API_KEY ve SHOPIER_API_SECRET env var'larını ayarla
 * 3. node server.js
 */

const express = require('express');
const { Shopier, ShopierWebhook, SignatureValidationError } = require('@nopeion/shopier');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SDK'yı başlat
const shopier = new Shopier({
    apiKey: process.env.SHOPIER_API_KEY || 'YOUR_API_KEY',
    apiSecret: process.env.SHOPIER_API_SECRET || 'YOUR_API_SECRET',
});

const webhook = new ShopierWebhook({
    apiSecret: process.env.SHOPIER_API_SECRET || 'YOUR_API_SECRET',
});

/**
 * Checkout - Ödeme sayfası oluşturur
 */
app.post('/checkout', (req, res) => {
    const { html } = shopier.createPayment({
        amount: req.body.amount || 100.00,
        buyer: {
            id: `ORDER-${Date.now()}`,
            firstName: req.body.firstName || 'John',
            lastName: req.body.lastName || 'Doe',
            email: req.body.email || 'john.doe@example.com',
            phone: req.body.phone || '05555555555',
            productName: req.body.productName || 'Test Product',
        },
        billing: {
            address: req.body.address || 'Test Mah. Test Sok.',
            city: req.body.city || 'Istanbul',
            country: req.body.country || 'Turkey',
            postcode: req.body.postcode || '34000',
        },
    });

    res.send(html);
});

/**
 * Callback - Shopier'dan gelen yanıtı işler
 */
app.post('/callback', (req, res) => {
    try {
        const result = shopier.verifyCallback(req.body);

        if (result.success) {
            console.log('Ödeme başarılı:', {
                orderId: result.orderId,
                paymentId: result.paymentId,
                installment: result.installment,
            });

            // TODO: Veritabanınızı güncelleyin
            // await db.orders.update(result.orderId, { status: 'paid' });

            res.status(200).send('OK');
        } else {
            console.log('Ödeme başarısız:', result.status);
            res.status(200).send('OK'); // Başarısız ödemeler için de 200 dön
        }
    } catch (error) {
        if (error instanceof SignatureValidationError) {
            console.error('Geçersiz imza');
            res.status(403).send('Invalid signature');
        } else {
            console.error('Callback hatası:', error);
            res.status(500).send('Error');
        }
    }
});

/**
 * Callback (Webhook Middleware ile)
 */
app.post('/webhook', webhook.express(), (req, res) => {
    const { success, orderId, paymentId } = req.shopier;

    if (success) {
        console.log('Webhook - Ödeme başarılı:', paymentId);
        res.status(200).send('OK');
    } else {
        res.status(200).send('OK');
    }
});

app.listen(3000, () => {
    console.log('Express app running on http://localhost:3000');
});
