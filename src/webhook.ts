
import { Shopier } from './core/shopier';
import { CallbackResult, ShopierConfig } from './types';

// Declare augmentation for Express Request
declare global {
    namespace Express {
        interface Request {
            /** Verified callback result from Shopier */
            shopier?: CallbackResult;
        }
    }
}

/**
 * Shopier Webhook Handler
 * Provides middleware and helpers for handling Shopier callbacks.
 */
export class ShopierWebhook {
    private shopier: Shopier;

    constructor(config?: ShopierConfig) {
        this.shopier = new Shopier(config);
    }

    /**
     * Express.js Middleware for handling Shopier callbacks.
     * Verifies the signature and attaches the result to `req.shopier`.
     * 
     * @example
     * ```typescript
     * app.post('/callback', webhook.express(), (req, res) => {
     *   if (req.shopier?.success) {
     *     // Handle successful payment
     *     res.status(200).send('OK');
     *   } else {
     *     res.status(400).send('Payment failed');
     *   }
     * });
     * ```
     */
    express() {
        return (req: any, res: any, next: (err?: any) => void) => {
            try {
                // Express usually puts parsed body in req.body
                // This assumes body-parser or express.urlencoded is used
                const body = req.body;

                if (!body || typeof body !== 'object') {
                    throw new Error('Request body is empty or invalid. Ensure express.urlencoded is used.');
                }

                const result = this.shopier.verifyCallback(body);
                req.shopier = result;

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Helper for Next.js App Router (or standard Request/Response).
     * Verifies the signature from a Request object.
     * 
     * @example
     * ```typescript
     * export async function POST(req: Request) {
     *   const result = await webhook.handleNext(req);
     *   if (result.success) {
     *     return new Response('OK', { status: 200 });
     *   }
     *   return new Response('Failed', { status: 400 });
     * }
     * ```
     */
    async handleNext(request: Request): Promise<CallbackResult> {
        const formData = await request.formData();
        const body = Object.fromEntries((formData as any).entries()) as any;
        return this.shopier.verifyCallback(body);
    }
}
