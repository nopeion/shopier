export type ShopierDiagnosticStatus = 'pass' | 'warn' | 'fail';

export type ShopierDiagnosticRequirement =
  | 'pat'
  | 'checkout'
  | 'osb'
  | 'webhook'
  | 'shopSlug'
  | 'imageUrl';

export interface ShopierDiagnosticCheck {
  id: string;
  status: ShopierDiagnosticStatus;
  title: string;
  message: string;
  action?: string;
}

export interface ShopierDiagnosticsOptions {
  env?: Record<string, string | undefined>;
  require?: ShopierDiagnosticRequirement[];
  imageUrl?: string;
}

export interface ShopierDiagnosticsResult {
  ok: boolean;
  counts: Record<ShopierDiagnosticStatus, number>;
  checks: ShopierDiagnosticCheck[];
}

const DEFAULT_REQUIREMENTS: ShopierDiagnosticRequirement[] = [
  'pat',
  'checkout',
  'webhook',
  'shopSlug',
];

export function runShopierDiagnostics(options: ShopierDiagnosticsOptions = {}): ShopierDiagnosticsResult {
  const env = options.env ?? process.env;
  const requirements = options.require ?? DEFAULT_REQUIREMENTS;
  const checks: ShopierDiagnosticCheck[] = [];

  if (requirements.includes('pat')) {
    checks.push(checkPat(env));
  }

  if (requirements.includes('checkout')) {
    checks.push(checkPair(env, 'checkout', [
      ['SHOPIER_API_KEY', 'SHOPIER_API_SECRET'],
      ['SHOPIER_CHECKOUT_API_KEY', 'SHOPIER_CHECKOUT_API_SECRET'],
    ]));
  }

  if (requirements.includes('osb')) {
    checks.push(checkPair(env, 'osb', [
      ['SHOPIER_OSB_USERNAME', 'SHOPIER_OSB_PASSWORD'],
    ]));
  }

  if (requirements.includes('webhook')) {
    checks.push(checkAny(env, 'webhook', [
      'SHOPIER_WEBHOOK_TOKEN',
      'SHOPIER_WEBHOOK_SECRET',
    ]));
  }

  if (requirements.includes('shopSlug')) {
    checks.push(checkAny(env, 'shopSlug', ['SHOPIER_SHOP_SLUG']));
  }

  if (requirements.includes('imageUrl') || options.imageUrl) {
    checks.push(checkImageUrl(options.imageUrl));
  }

  const counts = countStatuses(checks);

  return {
    ok: counts.fail === 0,
    counts,
    checks,
  };
}

export function formatShopierDiagnostics(result: ShopierDiagnosticsResult): string {
  const lines = [
    result.ok ? 'Shopier diagnostics passed' : 'Shopier diagnostics found issues',
    `pass: ${result.counts.pass}, warn: ${result.counts.warn}, fail: ${result.counts.fail}`,
    '',
  ];

  for (const check of result.checks) {
    lines.push(`${marker(check.status)} ${check.title}: ${check.message}`);

    if (check.action) {
      lines.push(`  action: ${check.action}`);
    }
  }

  return lines.join('\n');
}

function checkPat(env: Record<string, string | undefined>): ShopierDiagnosticCheck {
  const hasDefault = hasAny(env, [
    'SHOPIER_PAT',
    'SHOPIER_PERSONAL_ACCESS_TOKEN',
    'SHOPIER_ACCESS_TOKEN',
  ]);
  const hasNamed = Object.keys(env).some((key) =>
    /^SHOPIER_PAT_.+/.test(key) ||
    /^SHOPIER_.+_PAT$/.test(key) ||
    /^SHOPIER_.+_PERSONAL_ACCESS_TOKEN$/.test(key)
  );

  if (hasDefault || hasNamed) {
    return pass('pat', 'PAT credentials', hasDefault ? 'Default PAT is configured.' : 'Named PAT credentials are configured.');
  }

  return fail('pat', 'PAT credentials', 'No PAT credential was found.', 'Set SHOPIER_PAT or a named PAT such as SHOPIER_PAT_PRIMARY.');
}

function checkPair(
  env: Record<string, string | undefined>,
  id: 'checkout' | 'osb',
  pairs: Array<[string, string]>
): ShopierDiagnosticCheck {
  const completePair = pairs.find(([left, right]) => hasValue(env[left]) && hasValue(env[right]));
  const namedComplete = id === 'checkout' ? hasNamedCheckoutPair(env) : hasNamedOsbPair(env);

  if (completePair || namedComplete) {
    return pass(id, titleFor(id), completePair ? `${completePair[0]} and ${completePair[1]} are configured.` : `Named ${id} credentials are configured.`);
  }

  const partialPair = pairs.find(([left, right]) => hasValue(env[left]) || hasValue(env[right]));
  if (partialPair) {
    return fail(id, titleFor(id), `${partialPair[0]} / ${partialPair[1]} is incomplete.`, 'Set both values or remove the partial pair.');
  }

  return warn(id, titleFor(id), `No ${id} credentials were found.`, actionFor(id));
}

function checkAny(
  env: Record<string, string | undefined>,
  id: 'webhook' | 'shopSlug',
  names: string[]
): ShopierDiagnosticCheck {
  if (hasAny(env, names)) {
    return pass(id, titleFor(id), `${names.find((name) => hasValue(env[name]))} is configured.`);
  }

  return warn(id, titleFor(id), `No ${titleFor(id).toLowerCase()} value was found.`, actionFor(id));
}

function checkImageUrl(imageUrl: string | undefined): ShopierDiagnosticCheck {
  if (!imageUrl || imageUrl.trim() === '') {
    return warn('imageUrl', 'Product image URL', 'No image URL was provided.', 'Shopier product creation requires a public image URL.');
  }

  try {
    const url = new URL(imageUrl);
    const host = url.hostname.toLowerCase();

    if (url.protocol !== 'https:') {
      return fail('imageUrl', 'Product image URL', 'Image URL must use HTTPS.', 'Use a public HTTPS image URL.');
    }

    if (
      host === 'example.com' ||
      host.endsWith('.example.com') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return fail('imageUrl', 'Product image URL', 'Image URL must be publicly reachable.', 'Use a real CDN or public image URL.');
    }

    return pass('imageUrl', 'Product image URL', 'Image URL looks public.');
  } catch {
    return fail('imageUrl', 'Product image URL', 'Image URL is not valid.', 'Provide a full public HTTPS URL.');
  }
}

function hasNamedCheckoutPair(env: Record<string, string | undefined>): boolean {
  return hasNamedPair(env, [
    [/^SHOPIER_CHECKOUT_(.+)_API_KEY$/, 'key'],
    [/^SHOPIER_(?!CHECKOUT_)(.+)_API_KEY$/, 'key'],
    [/^SHOPIER_CHECKOUT_(.+)_API_SECRET$/, 'secret'],
    [/^SHOPIER_(?!CHECKOUT_)(.+)_API_SECRET$/, 'secret'],
  ], ['key', 'secret']);
}

function hasNamedOsbPair(env: Record<string, string | undefined>): boolean {
  return hasNamedPair(env, [
    [/^SHOPIER_OSB_(.+)_USERNAME$/, 'username'],
    [/^SHOPIER_OSB_(.+)_PASSWORD$/, 'password'],
  ], ['username', 'password']);
}

function hasNamedPair(
  env: Record<string, string | undefined>,
  patterns: Array<[RegExp, string]>,
  requiredFields: string[]
): boolean {
  const fieldsByName = new Map<string, Set<string>>();

  for (const [envName, value] of Object.entries(env)) {
    if (!hasValue(value)) {
      continue;
    }

    for (const [pattern, field] of patterns) {
      const match = envName.match(pattern);
      if (!match) {
        continue;
      }

      const name = match[1].toLowerCase();
      const fields = fieldsByName.get(name) ?? new Set<string>();
      fields.add(field);
      fieldsByName.set(name, fields);
    }
  }

  return Array.from(fieldsByName.values()).some((fields) =>
    requiredFields.every((field) => fields.has(field))
  );
}

function countStatuses(checks: ShopierDiagnosticCheck[]): Record<ShopierDiagnosticStatus, number> {
  return checks.reduce<Record<ShopierDiagnosticStatus, number>>((counts, check) => {
    counts[check.status] += 1;
    return counts;
  }, { pass: 0, warn: 0, fail: 0 });
}

function pass(id: string, title: string, message: string): ShopierDiagnosticCheck {
  return { id, title, message, status: 'pass' };
}

function warn(id: string, title: string, message: string, action?: string): ShopierDiagnosticCheck {
  return { id, title, message, status: 'warn', action };
}

function fail(id: string, title: string, message: string, action?: string): ShopierDiagnosticCheck {
  return { id, title, message, status: 'fail', action };
}

function marker(status: ShopierDiagnosticStatus): string {
  if (status === 'pass') return '[pass]';
  if (status === 'warn') return '[warn]';
  return '[fail]';
}

function hasAny(env: Record<string, string | undefined>, names: string[]): boolean {
  return names.some((name) => hasValue(env[name]));
}

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function titleFor(id: 'checkout' | 'osb' | 'webhook' | 'shopSlug'): string {
  if (id === 'checkout') return 'Classic checkout credentials';
  if (id === 'osb') return 'OSB credentials';
  if (id === 'webhook') return 'Webhook token';
  return 'Shop slug';
}

function actionFor(id: 'checkout' | 'osb' | 'webhook' | 'shopSlug'): string {
  if (id === 'checkout') return 'Set SHOPIER_API_KEY and SHOPIER_API_SECRET for classic checkout.';
  if (id === 'osb') return 'Set SHOPIER_OSB_USERNAME and SHOPIER_OSB_PASSWORD only if OSB is enabled.';
  if (id === 'webhook') return 'Set SHOPIER_WEBHOOK_TOKEN before verifying REST webhooks.';
  return 'Set SHOPIER_SHOP_SLUG before using hosted checkout.';
}
