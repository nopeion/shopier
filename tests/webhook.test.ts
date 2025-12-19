
import { ShopierWebhook } from '../src/webhook';
import { generateCallbackSignature } from '../src/core/signature';

describe('ShopierWebhook', () => {
    const secret = 'test-secret';
    const config = { apiSecret: secret, apiKey: 'test-key' };

    // Mock valid callback body
    const validBody = {
        random_nr: '123456',
        platform_order_id: 'order-123',
        payment_id: 'payment-123',
        installment: '0',
        status: 'success',
        signature: ''
    };

    // Generate valid signature
    validBody.signature = generateCallbackSignature(secret, validBody.random_nr, validBody.platform_order_id);

    describe('Express Middleware', () => {
        it('should verify signature and attach result to req.shopier', () => {
            const webhook = new ShopierWebhook(config);
            const middleware = webhook.express();

            const req: any = { body: validBody };
            const res: any = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(); // Called without error
            expect(req.shopier).toBeDefined();
            expect(req.shopier.success).toBe(true);
            expect(req.shopier.orderId).toBe('order-123');
            expect(req.shopier.paymentId).toBe('payment-123');
        });

        it('should call next with error if signature is invalid', () => {
            const webhook = new ShopierWebhook(config);
            const middleware = webhook.express();

            const invalidBody = { ...validBody, signature: 'invalid' };
            const req: any = { body: invalidBody };
            const res: any = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(req.shopier).toBeUndefined();
        });

        it('should call next with error if body is missing', () => {
            const webhook = new ShopierWebhook(config);
            const middleware = webhook.express();

            const req: any = {};
            const res: any = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle tampered order_id (signature mismatch)', () => {
            const webhook = new ShopierWebhook(config);
            const middleware = webhook.express();

            const tamperedBody = { ...validBody, platform_order_id: 'tampered-order' };
            const req: any = { body: tamperedBody };
            const res: any = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('Next.js Helper', () => {
        it('should verify signature and return result', async () => {
            const webhook = new ShopierWebhook(config);

            // Mock FormData
            const formData = new Map();
            Object.entries(validBody).forEach(([key, value]) => formData.set(key, value));

            const req = {
                formData: async () => formData
            } as unknown as Request;

            const result = await webhook.handleNext(req);

            expect(result.success).toBe(true);
            expect(result.orderId).toBe('order-123');
            expect(result.paymentId).toBe('payment-123');
        });

        it('should throw error if signature is invalid', async () => {
            const webhook = new ShopierWebhook(config);

            const formData = new Map();
            Object.entries({ ...validBody, signature: 'invalid' }).forEach(([key, value]) => formData.set(key, value));

            const req = {
                formData: async () => formData
            } as unknown as Request;

            await expect(webhook.handleNext(req)).rejects.toThrow();
        });
    });
});
