/**
 * Next.js App Router ile Shopier Entegrasyonu
 * 
 * Checkout: app/api/checkout/route.ts
 * Callback: app/api/callback/route.ts
 */

import { NextResponse } from 'next/server';
import { Shopier, SignatureValidationError } from '@nopeion/shopier';

const shopier = new Shopier({
    apiKey: process.env.SHOPIER_API_KEY!,
    apiSecret: process.env.SHOPIER_API_SECRET!,
});

/**
 * Checkout Endpoint
 * POST /api/checkout
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { html } = shopier.createPayment({
            amount: body.amount,
            buyer: {
                id: body.orderId || `ORDER-${Date.now()}`,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: body.phone,
                productName: body.productName,
            },
            billing: body.billing,
        });

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
    }
}

/**
 * Callback Endpoint (ayrı dosyada kullanın: app/api/callback/route.ts)
 * POST /api/callback
 */
export async function POST_CALLBACK(req: Request) {
    try {
        const formData = await req.formData();
        const body = Object.fromEntries(formData.entries()) as any;

        const result = shopier.verifyCallback(body);

        if (result.success) {
            console.log('Payment successful:', {
                orderId: result.orderId,
                paymentId: result.paymentId,
            });

            // TODO: Veritabanınızı güncelleyin
            // await prisma.order.update({
            //   where: { id: result.orderId },
            //   data: { status: 'paid', paymentId: result.paymentId },
            // });

            return new NextResponse('OK', { status: 200 });
        }

        return new NextResponse('Payment failed', { status: 400 });
    } catch (error) {
        if (error instanceof SignatureValidationError) {
            return new NextResponse('Invalid signature', { status: 403 });
        }
        return new NextResponse('Error', { status: 500 });
    }
}
