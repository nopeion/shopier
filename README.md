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

## API uyumluluk tablosu

| Ozellik | Durum | Not |
| ------- | ----- | --- |
| Odeme formu olusturma | ✅ | Klasik Shopier checkout form akisi. |
| Callback dogrulama | ✅ | HMAC imza dogrulama ve normalize sonuc. |
| Taksit destegi | ✅ | `maxInstallment` ile 0-12 arasi. |
| Coklu para birimi | ✅ | TL, USD, EUR. |
| OSB dogrulama | ✅ | Legacy OSB `res` + `hash` helperlari. |
| PAT API client | ⚠️ Guarded | Developer portal semasi netlesene kadar kaynak helperlari kapali. |
| Yeni webhook dogrulama | ⚠️ Guarded | Signature header ve payload semasi dogrulanmadan varsayim yapmaz. |
| Refund / iptal | ❌ Planned | Provider API semasi netlestikten sonra eklenebilir. |
| Sandbox / test mode | ❌ Not supported | Provider tarafinda genel bir sandbox akisi varsayilmiyor. |

## Test edilen davranislar

CI ve lokal test paketi ozellikle su kritik payment davranislarini gorunur sekilde kapsar:

- signature generation
- callback verification
- invalid signature rejection
- timing-safe comparison
- XSS escaping
- amount validation
- missing API key / secret validation
- checkout field mapping
- OSB hash verification
- idempotency documentation example

```bash
npm run lint
npm test
npm run build
```

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

## Dokumantasyon

- [Getting started](./docs/getting-started.md)
- [Callbacks](./docs/callbacks.md)
- [Security](./docs/security.md)
- [Next.js](./docs/nextjs.md)
- [Express](./docs/express.md)

## Checkout playground

Bu repo icinde nested bir companion playground bulunur: [`playground`](./playground).

```bash
npm run build
cd playground
npm install
npm start
```

Playground, local package buildini kullanarak Shopier checkout HTML'i olusturur. Gercek odeme testi icin `playground/.env.example` dosyasini `.env` olarak kopyalayip Shopier checkout credentiallarini girin.

## OSB, PAT API ve yeni webhooklar

### OSB helpers

OSB (Otomatik Siparis Bildirimi) Shopier tarafinda legacy olarak konumlanir, ancak panelde kullanilabildigi icin paket dogrulama ve parse helperlari saglar. Paket yalnizca provider payload'ini dogrular/normalize eder; kredi yukleme, siparis tamamlama ve idempotency uygulama tarafinda kalmalidir.

```typescript
import { handleOsb } from '@nopeion/shopier/osb';

const result = handleOsb({
  res: req.body.res,
  hash: req.body.hash,
  username: process.env.SHOPIER_OSB_USERNAME!,
  password: process.env.SHOPIER_OSB_PASSWORD!,
});

if (result.verified) {
  console.log(result.payload?.orderId);
  res.send('success');
}
```

### PAT API client

PAT (Personal Access Token) Shopier API erisimi icindir. Checkout form signature'i icin `apiSecret` yerine veya OSB hash password'u yerine kullanilmaz.

```typescript
import { ShopierApiClient } from '@nopeion/shopier/api';

const api = new ShopierApiClient({
  personalAccessToken: process.env.SHOPIER_PAT!,
});
```

Shopier developer portal endpoint ve response semalari netlesene kadar `orders.get/list` gibi kaynak helperlari guarded durumdadir ve acik hata verir.

### Yeni webhook modulu

`ShopierWebhook` sinifi geriye uyumluluk icin legacy callback helper olarak kalir. Yeni Shopier webhook sistemi icin ayri modulu kullanin:

```typescript
import { verifyWebhook } from '@nopeion/shopier/webhooks';
```

Webhook signature header'i ve payload semasi developer portal uzerinden kesinlesmeden paket tahmini dogrulama yapmaz; bu yuzden yeni webhook helperlari simdilik acik unsupported hatasi verir.

## Environment Variables

```bash
SHOPIER_API_KEY=your-api-key
SHOPIER_API_SECRET=your-api-secret
SHOPIER_OSB_USERNAME=your-osb-username
SHOPIER_OSB_PASSWORD=your-osb-password
SHOPIER_PAT=your-personal-access-token
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
    // Hassas verileri (API anahtarları, kişisel bilgiler vb.) maskeler
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

