import { ShopierApiClient, ShopierPaymentFlow } from '@nopeion/shopier';

const client = new ShopierApiClient({ pat: process.env.SHOPIER_PAT });
const payments = new ShopierPaymentFlow({ client });

const payment = await payments.createPaymentLink({
  title: 'Premium Membership',
  amount: '99.99',
  currency: 'TRY',
  imageUrl: 'https://cdn.example.com/premium-membership.png',
  orderId: 'order-123',
  hostedCheckout: true,
  shopSlug: process.env.SHOPIER_SHOP_SLUG,
});

console.log('Product ID:', payment.productId);
console.log('Product page:', payment.paymentUrl);
console.log('Hosted checkout HTML:', payment.checkoutHtml);
