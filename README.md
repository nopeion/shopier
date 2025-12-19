# @nopeion/shopier

[![npm version](https://img.shields.io/npm/v/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![npm downloads](https://img.shields.io/npm/dm/@nopeion/shopier.svg)](https://www.npmjs.com/package/@nopeion/shopier)
[![install size](https://packagephobia.com/badge?p=@nopeion/shopier)](https://packagephobia.com/result?p=@nopeion/shopier)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Shopier ödeme sistemi için TypeScript/Node.js SDK'sı.

> [!NOTE]
> Bu paket Shopier ile resmi olarak ilişkili değildir. Topluluk tarafından geliştirilen bağımsız bir SDK'dır.

## Özellikler

- **Güvenli** - HMAC-SHA256 imzalama, XSS koruması, timing-safe karşılaştırma
- **Sıfır bağımlılık** - Sadece Node.js built-in modülleri
- **TypeScript** - Tam tip desteği
- **Basit API** - Tek method ile ödeme oluşturma
- **Dual format** - ESM ve CommonJS desteği

## Kurulum

```bash
npm install @nopeion/shopier
```

## Hızlı Başlangıç

```typescript
import { Shopier, Currency } from '@nopeion/shopier';

const shopier = new Shopier({
  apiKey: process.env.SHOPIER_API_KEY,
  apiSecret: process.env.SHOPIER_API_SECRET,
});

const { html } = shopier.createPayment({
  amount: 99.99,
  currency: Currency.TL,
  buyer: {
    id: 'user-123',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@example.com',
    phone: '05551234567',
    productName: 'Premium Üyelik',
  },
  billing: {
    address: 'Örnek Mah. Test Sok. No:1',
    city: 'İstanbul',
    country: 'Türkiye',
    postcode: '34000',
  },
});

// HTML'i tarayıcıya gönder
res.send(html);
```

## API

### `createPayment(options): PaymentResult`

Ödeme formu oluşturur.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `amount` | `number` | ✅ | Ödeme tutarı |
| `buyer` | `BuyerInfo` | ✅ | Alıcı bilgileri |
| `billing` | `BillingAddress` | - | Fatura adresi |
| `shipping` | `ShippingAddress` | - | Kargo adresi |
| `currency` | `Currency` | - | Para birimi (varsayılan: TL) |
| `maxInstallment` | `number` | - | Maks. taksit (0-12) |
| `language` | `Language` | - | Dil (varsayılan: TR) |

**Dönen değer:**

```typescript
interface PaymentResult {
  html: string;           // Auto-submit HTML sayfası
  formData: FormData;     // Form verileri
  actionUrl: string;      // Shopier URL
  hiddenInputs: string;   // Hidden input HTML
}
```

### `verifyCallback(body): CallbackResult`

Shopier'dan gelen callback'i doğrular.

```typescript
const result = shopier.verifyCallback(req.body);

if (result.success) {
  console.log('Ödeme başarılı:', result.orderId);
}
```

## Örnekler

Detaylı örnekler için [`examples/`](./examples) klasörüne bakın:

| Örnek | Açıklama |
|-------|----------|
| [`basic.ts`](./examples/basic.ts) | Temel kullanım |
| [`express/server.js`](./examples/express/server.js) | Express.js entegrasyonu |
| [`nextjs/route.ts`](./examples/nextjs/route.ts) | Next.js App Router |
| [`vue/App.vue`](./examples/vue/App.vue) | Vue.js component |

## Environment Variables

```bash
SHOPIER_API_KEY=your-api-key
SHOPIER_API_SECRET=your-api-secret
```

## Güvenlik

- ✅ HMAC-SHA256 imza doğrulama
- ✅ Timing-safe karşılaştırma
- ✅ XSS koruması
- ✅ Cryptographically secure random

> [!CAUTION]
> API Secret'ınızı asla client-side'da kullanmayın!

> [!IMPORTANT]
> Callback endpoint'inizi HTTPS üzerinden sunun.

> [!WARNING]
> **Idempotency (Tekrarlanabilirlik):** Shopier callback'leri ağ sorunları nedeniyle aynı sipariş için birden fazla kez gelebilir. Sipariş numarası (`orderId`) kullanılarak mükerrer işlem kontrolü yapılmalıdır.

## Hata Yönetimi

Hatalar `ShopierError` sınıfından türetilir ve production ortamları için güvenli loglama metodları içerir.

```typescript
import {
  ShopierError,
  ValidationError,
  SignatureValidationError,
  InvalidApiKeyError,
} from '@nopeion/shopier';

try {
  // ... shopier calls
} catch (error) {
  if (error instanceof ShopierError) {
    // Hassas verileri (kredi kartı, API secret vb.) maskeler
    console.error('Ödeme hatası:', error.toSafeJSON());
  }
}
```

## TypeScript

Tüm tipler export edilir:

```typescript
import type {
  PaymentOptions,
  PaymentResult,
  BuyerInfo,
  CallbackResult,
} from '@nopeion/shopier';
```

## Author

**nopeion**

- GitHub: [@nopeion](https://github.com/nopeion)
- Email: [nopeiondev@gmail.com](mailto:nopeiondev@gmail.com)

