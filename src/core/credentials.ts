import { InvalidApiKeyError, InvalidApiSecretError, ValidationError } from '../errors';

export type ShopierCredentialName = string;

export interface ShopierCheckoutCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface ShopierOsbCredentials {
  username: string;
  password: string;
}

export interface ShopierPatCredentials {
  personalAccessToken: string;
}

export interface ResolveCheckoutCredentialsOptions extends Partial<ShopierCheckoutCredentials> {
  credentialName?: ShopierCredentialName;
  envPrefix?: string;
}

export interface ResolveOsbCredentialsOptions extends Partial<ShopierOsbCredentials> {
  credentialName?: ShopierCredentialName;
  envPrefix?: string;
}

export interface ResolvePatCredentialsOptions extends Partial<ShopierPatCredentials> {
  credentialName?: ShopierCredentialName;
  envPrefix?: string;
}

export interface ShopierCredentialManagerOptions {
  checkout?: Record<string, Partial<ShopierCheckoutCredentials>>;
  osb?: Record<string, Partial<ShopierOsbCredentials>>;
  pat?: Record<string, Partial<ShopierPatCredentials>>;
}

const DEFAULT_CREDENTIAL_NAME = 'default';

export function resolveCheckoutCredentials(
  options: ResolveCheckoutCredentialsOptions = {}
): ShopierCheckoutCredentials {
  const name = normalizeCredentialName(options.credentialName);
  const apiKey = firstNonEmpty(
    options.apiKey,
    ...checkoutEnvNames(name, options.envPrefix, 'API_KEY').map((envName) => process.env[envName])
  );
  const apiSecret = firstNonEmpty(
    options.apiSecret,
    ...checkoutEnvNames(name, options.envPrefix, 'API_SECRET').map((envName) => process.env[envName])
  );

  if (!apiKey) {
    throw new InvalidApiKeyError('API key is missing or empty', {
      credentialName: name,
    });
  }

  if (!apiSecret) {
    throw new InvalidApiSecretError('API secret is missing or empty', {
      credentialName: name,
    });
  }

  return { apiKey, apiSecret };
}

export function resolveOsbCredentials(
  options: ResolveOsbCredentialsOptions = {}
): ShopierOsbCredentials {
  const name = normalizeCredentialName(options.credentialName);
  const username = firstNonEmpty(
    options.username,
    ...osbEnvNames(name, options.envPrefix, 'USERNAME').map((envName) => process.env[envName])
  );
  const password = firstNonEmpty(
    options.password,
    ...osbEnvNames(name, options.envPrefix, 'PASSWORD').map((envName) => process.env[envName])
  );

  if (!username || !password) {
    throw new ValidationError('OSB username and password are required', {
      credentialName: name,
      credentialType: 'osb',
    });
  }

  return { username, password };
}

export function resolvePatCredentials(
  options: ResolvePatCredentialsOptions = {}
): ShopierPatCredentials {
  const name = normalizeCredentialName(options.credentialName);
  const personalAccessToken = firstNonEmpty(
    options.personalAccessToken,
    ...patEnvNames(name, options.envPrefix).map((envName) => process.env[envName])
  );

  if (!personalAccessToken) {
    throw new ValidationError('Personal access token is required', {
      credentialName: name,
      credentialType: 'personalAccessToken',
    });
  }

  return { personalAccessToken };
}

export class ShopierCredentialManager {
  private readonly checkout: Record<string, Partial<ShopierCheckoutCredentials>>;
  private readonly osb: Record<string, Partial<ShopierOsbCredentials>>;
  private readonly pat: Record<string, Partial<ShopierPatCredentials>>;

  constructor(options: ShopierCredentialManagerOptions = {}) {
    this.checkout = options.checkout ?? {};
    this.osb = options.osb ?? {};
    this.pat = options.pat ?? {};
  }

  getCheckout(name: ShopierCredentialName = DEFAULT_CREDENTIAL_NAME): ShopierCheckoutCredentials {
    return resolveCheckoutCredentials({
      credentialName: name,
      ...this.checkout[name],
    });
  }

  getOsb(name: ShopierCredentialName = DEFAULT_CREDENTIAL_NAME): ShopierOsbCredentials {
    return resolveOsbCredentials({
      credentialName: name,
      ...this.osb[name],
    });
  }

  getPat(name: ShopierCredentialName = DEFAULT_CREDENTIAL_NAME): ShopierPatCredentials {
    return resolvePatCredentials({
      credentialName: name,
      ...this.pat[name],
    });
  }
}

function checkoutEnvNames(
  name: string,
  envPrefix: string | undefined,
  field: 'API_KEY' | 'API_SECRET'
): string[] {
  const names = optionalPrefix(envPrefix, field);

  if (name !== DEFAULT_CREDENTIAL_NAME) {
    names.push(`SHOPIER_CHECKOUT_${toEnvName(name)}_${field}`);
    names.push(`SHOPIER_${toEnvName(name)}_${field}`);
  }

  names.push(`SHOPIER_${field}`);
  return names;
}

function osbEnvNames(
  name: string,
  envPrefix: string | undefined,
  field: 'USERNAME' | 'PASSWORD'
): string[] {
  const names = optionalPrefix(envPrefix, field);

  if (name !== DEFAULT_CREDENTIAL_NAME) {
    names.push(`SHOPIER_OSB_${toEnvName(name)}_${field}`);
  }

  names.push(`SHOPIER_OSB_${field}`);
  return names;
}

function patEnvNames(name: string, envPrefix: string | undefined): string[] {
  const names = optionalPrefix(envPrefix, 'PAT');

  if (name !== DEFAULT_CREDENTIAL_NAME) {
    names.push(`SHOPIER_PAT_${toEnvName(name)}`);
    names.push(`SHOPIER_${toEnvName(name)}_PAT`);
    names.push(`SHOPIER_${toEnvName(name)}_PERSONAL_ACCESS_TOKEN`);
  }

  names.push('SHOPIER_PAT', 'SHOPIER_PERSONAL_ACCESS_TOKEN', 'SHOPIER_ACCESS_TOKEN');
  return names;
}

function optionalPrefix(envPrefix: string | undefined, field: string): string[] {
  if (!envPrefix || envPrefix.trim() === '') {
    return [];
  }

  return [`${toEnvName(envPrefix)}_${field}`];
}

function normalizeCredentialName(name: string | undefined): string {
  return name && name.trim() !== '' ? name.trim() : DEFAULT_CREDENTIAL_NAME;
}

function toEnvName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return undefined;
}
